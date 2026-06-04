"""
BaseAgent — every agent in the ecosystem inherits from this.

To add a new agent:
1. Create agents/my_agent.py with a class inheriting BaseAgent
2. Override: name, description, model, system_prompt_file, run()
3. Register in registry.py: registry.register(MyAgent)
4. Add a route in main.py if it needs a dedicated endpoint

That's all — the registry, orchestrator, and monitoring pick it up automatically.
"""
from __future__ import annotations
import asyncio
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, TypeVar

import anthropic
import asyncpg

from config import settings
from memory.session_memory import SessionMemory
from monitoring.tracker import MetricsTracker

T = TypeVar("T")

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class AgentError(Exception):
    def __init__(self, agent_name: str, message: str, retryable: bool = False) -> None:
        self.agent_name = agent_name
        self.retryable = retryable
        super().__init__(f"[{agent_name}] {message}")


class BaseAgent(ABC):
    # Subclasses set these as class attributes
    name: str = "base"
    description: str = "Base agent"
    model: str = settings.model_fast
    system_prompt_file: str = ""

    # Whether this agent can run in parallel with other agents
    is_independent: bool = True

    def __init__(
        self,
        pool: asyncpg.Pool,
        memory: SessionMemory,
        metrics: MetricsTracker,
    ) -> None:
        self.pool = pool
        self.memory = memory
        self.metrics = metrics
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        if not self.system_prompt_file:
            return f"You are {self.name}, an AI agent for Life RPG Planner."
        path = _PROMPTS_DIR / self.system_prompt_file
        if path.exists():
            return path.read_text(encoding="utf-8").strip()
        return f"You are {self.name}, an AI agent for Life RPG Planner."

    @abstractmethod
    async def run(self, user_id: int, **kwargs: Any) -> Any:
        """Execute the agent. Returns an agent-specific output object."""

    async def _call_llm(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 1024,
    ) -> tuple[str, int]:
        """
        Call the Anthropic API with retry logic.
        Returns (response_text, total_tokens_used).
        """
        retryable = (anthropic.APITimeoutError, anthropic.RateLimitError, anthropic.InternalServerError)
        last_err: Exception | None = None

        for attempt in range(settings.max_retries):
            try:
                start = time.monotonic()
                response = await asyncio.wait_for(
                    self._client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens,
                        system=self._system_prompt,
                        messages=messages,
                    ),
                    timeout=settings.agent_timeout_seconds,
                )
                latency_ms = int((time.monotonic() - start) * 1000)
                tokens = response.usage.input_tokens + response.usage.output_tokens
                text = response.content[0].text if response.content else ""

                # Track metrics asynchronously — don't block the response
                asyncio.create_task(
                    self.metrics.record(self.name, latency_ms, tokens)
                )
                return text, tokens

            except retryable as e:
                last_err = e
                if attempt < settings.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
            except asyncio.TimeoutError:
                last_err = AgentError(self.name, "LLM call timed out", retryable=True)
                if attempt < settings.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
            except anthropic.AuthenticationError as e:
                raise AgentError(self.name, f"Authentication failed: {e}", retryable=False) from e
            except Exception as e:
                raise AgentError(self.name, f"Unexpected error: {e}", retryable=False) from e

        raise AgentError(self.name, f"All {settings.max_retries} retries exhausted: {last_err}", retryable=False)

    def _format_task_list(self, tasks: list[Any]) -> str:
        """Render a compact task summary for LLM context."""
        if not tasks:
            return "No tasks."
        lines = []
        for t in tasks[:30]:  # cap at 30 to stay within token budget
            d = t if isinstance(t, dict) else t.__dict__
            deadline = d.get("deadline", "")
            deadline_str = str(deadline)[:10] if deadline else "no deadline"
            lines.append(
                f"- [{d.get('status', '?')}] {d.get('title', '?')} "
                f"(Priority: {d.get('priority', '?')}, "
                f"Category: {d.get('category', '?')}, "
                f"Deadline: {deadline_str})"
            )
        if len(tasks) > 30:
            lines.append(f"... and {len(tasks) - 30} more tasks")
        return "\n".join(lines)

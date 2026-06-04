from __future__ import annotations
import json
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import BalancerOutput
from tools.db_tools import get_aggregate_stats, get_events
from config import settings


class GameBalancerAgent(BaseAgent):
    name = "game_balancer"
    description = "Monitors XP economy balance across all users (admin/scheduled use only)"
    model = settings.model_smart
    system_prompt_file = "game_balancer.txt"
    is_independent = True

    async def run(self, user_id: int = 0, **kwargs: Any) -> BalancerOutput:
        # This agent operates on aggregate data — user_id is unused
        agg_stats = await get_aggregate_stats(self.pool)

        # Aggregate task completion events (last 30 days) across all users
        # We pass user_id=0 which will return no rows — game balancer reads aggregate
        # For a real multi-tenant app you'd have an admin query here
        context = {
            "aggregate_stats": agg_stats,
            "xp_formula": {
                "Critical": 75, "High": 50, "Medium": 20, "Low": 10,
                "focus_base": 10, "focus_per_minute": 0.5,
            },
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=512,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return BalancerOutput(**data)

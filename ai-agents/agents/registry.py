"""
AgentRegistry — central catalogue of all available agents.

Adding a new agent requires only:
    registry.register(MyNewAgent)

The orchestrator, monitoring, and health endpoint all read from this registry.
"""
from __future__ import annotations
from typing import TYPE_CHECKING

import asyncpg

from memory.session_memory import SessionMemory
from monitoring.tracker import MetricsTracker

if TYPE_CHECKING:
    from agents.base import BaseAgent


class AgentRegistry:
    def __init__(self) -> None:
        self._classes: dict[str, type[BaseAgent]] = {}
        self._instances: dict[str, "BaseAgent"] = {}

    def register(self, agent_cls: type["BaseAgent"]) -> None:
        self._classes[agent_cls.name] = agent_cls

    def build_all(
        self,
        pool: asyncpg.Pool,
        memory: SessionMemory,
        metrics: MetricsTracker,
    ) -> None:
        """Instantiate all registered agents with shared dependencies."""
        for name, cls in self._classes.items():
            self._instances[name] = cls(pool=pool, memory=memory, metrics=metrics)

    def get(self, name: str) -> "BaseAgent":
        if name not in self._instances:
            raise KeyError(f"Agent '{name}' is not registered or not yet built.")
        return self._instances[name]

    def all(self) -> dict[str, "BaseAgent"]:
        return dict(self._instances)

    def names(self) -> list[str]:
        return list(self._classes.keys())


# Singleton — imported by main.py and orchestrator
registry = AgentRegistry()

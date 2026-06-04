from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import SmartPlannerOutput
from tools.db_tools import get_user_tasks, get_user_preferences
from tools.analytics_tools import compute_deadline_urgency
from config import settings


class SmartPlannerAgent(BaseAgent):
    name = "smart_planner"
    description = "Generates an optimized daily schedule with time blocks based on tasks and priorities"
    model = settings.model_smart   # needs more reasoning for schedule optimization
    system_prompt_file = "smart_planner.txt"

    async def run(self, user_id: int, **kwargs: Any) -> SmartPlannerOutput:
        target_date: str = kwargs.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        now = datetime.now(timezone.utc)

        tasks = await get_user_tasks(self.pool, user_id)
        prefs = await get_user_preferences(self.pool, user_id)

        # Only include non-Done tasks relevant to this date
        relevant_tasks = []
        for t in tasks:
            if t.status == "Done":
                continue
            urgency = 0.1
            if t.deadline:
                urgency = compute_deadline_urgency(t.deadline.isoformat(), now)
            relevant_tasks.append({
                "id": str(t.id),
                "title": t.title,
                "category": t.category,
                "priority": t.priority,
                "deadline": t.deadline.strftime("%Y-%m-%d") if t.deadline else None,
                "start_time": t.start_time,
                "duration_hours": t.duration,
                "urgency_score": round(urgency, 3),
            })

        # Sort by urgency so the LLM sees most urgent first
        relevant_tasks.sort(key=lambda x: x["urgency_score"], reverse=True)

        prompt = (
            f"Schedule date: {target_date}\n"
            f"Player timezone: {prefs.timezone}\n"
            f"Tasks to schedule ({len(relevant_tasks)} items):\n"
            f"{json.dumps(relevant_tasks[:25], indent=2)}"
        )

        raw, _ = await self._call_llm(
            [{"role": "user", "content": prompt}],
            max_tokens=2048,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return SmartPlannerOutput(**data)

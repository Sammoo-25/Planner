from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import HabitCoachOutput
from tools.db_tools import (
    get_habits, get_habit_checkins, get_user_tasks, get_user_preferences,
)
from tools.analytics_tools import compute_habit_consistency, compute_category_breakdown
from config import settings


class HabitCoachAgent(BaseAgent):
    name = "habit_coach"
    description = "Analyzes habit streaks and consistency, recommends new habits for category gaps"
    model = settings.model_fast
    system_prompt_file = "habit_coach.txt"

    async def run(self, user_id: int, **kwargs: Any) -> HabitCoachOutput:
        now = datetime.now(timezone.utc)

        habits = await get_habits(self.pool, user_id)
        checkins = await get_habit_checkins(self.pool, user_id, days=30)
        tasks = await get_user_tasks(self.pool, user_id)
        prefs = await get_user_preferences(self.pool, user_id)

        habit_dicts = [h.__dict__ for h in habits]
        checkin_dicts = [dict(c) for c in checkins]

        consistency_data = compute_habit_consistency(habit_dicts, checkin_dicts, days=30)
        category_breakdown = compute_category_breakdown([t.__dict__ for t in tasks])

        # Mark which habits are at risk today (not checked in and have active streak)
        for item in consistency_data:
            h = next((x for x in habits if str(x.id) == item["habit_id"]), None)
            if h:
                not_checked_today = (
                    not h.last_checked_in or
                    (now - h.last_checked_in.replace(tzinfo=timezone.utc)).days >= 1
                )
                item["at_risk"] = h.current_streak > 0 and not_checked_today
            else:
                item["at_risk"] = False

        context = {
            "player_difficulty": prefs.difficulty,
            "habit_consistency": consistency_data,
            "category_breakdown": {
                cat: data["completed"] for cat, data in category_breakdown.items()
            },
            "total_habits": len(habits),
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=1024,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return HabitCoachOutput(**data)

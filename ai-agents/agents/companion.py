from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import CompanionOutput
from tools.db_tools import (
    get_user_tasks, get_player_stats, get_focus_sessions,
    get_habits, get_unlocked_achievements, get_user_preferences,
)
from config import settings


class CompanionAgent(BaseAgent):
    name = "companion"
    description = "AI Companion that provides personalized guidance throughout the player's journey"
    model = settings.model_smart    # companion needs empathetic, high-quality writing
    system_prompt_file = "companion.txt"

    async def run(self, user_id: int, **kwargs: Any) -> CompanionOutput:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        tasks = await get_user_tasks(self.pool, user_id)
        stats = await get_player_stats(self.pool, user_id)
        recent_sessions = await get_focus_sessions(self.pool, user_id, days=7)
        habits = await get_habits(self.pool, user_id)
        recent_achievements = await get_unlocked_achievements(self.pool, user_id)
        prefs = await get_user_preferences(self.pool, user_id)

        # Recent activity summary
        completed_this_week = [
            t for t in tasks
            if t.status == "Done" and t.completed_at and t.completed_at >= week_ago
        ]
        overdue = [
            t for t in tasks
            if t.status != "Done" and t.deadline and t.deadline < now
        ]
        recent_unlocks = [
            a for a in recent_achievements
            if a.get("unlocked_at") and
            datetime.fromisoformat(str(a["unlocked_at"])).replace(tzinfo=timezone.utc) >= week_ago
        ]
        habits_at_risk = [
            h for h in habits
            if h.current_streak > 0 and (
                not h.last_checked_in or
                (now - h.last_checked_in.replace(tzinfo=timezone.utc)).days >= 1
            )
        ]

        context = {
            "companion_name": prefs.companion_name,
            "player_stats": {
                "level": stats.level,
                "health": stats.health,
                "total_xp": stats.total_xp,
                "current_exp": stats.current_exp,
                "max_exp": stats.max_exp,
            },
            "week_summary": {
                "tasks_completed": len(completed_this_week),
                "overdue_count": len(overdue),
                "focus_sessions": len(recent_sessions),
                "focus_minutes": sum(s.duration_minutes for s in recent_sessions),
            },
            "recent_achievements": [a.get("achievement_title") for a in recent_unlocks[:3]],
            "habits_at_risk": [h.title for h in habits_at_risk],
            "active_habits_count": len(habits),
            "max_habit_streak": max((h.current_streak for h in habits), default=0),
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=512,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return CompanionOutput(**data)

from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import AchievementAgentOutput
from tools.db_tools import (
    get_user_tasks, get_player_stats, get_focus_sessions,
    get_habits, get_habit_checkins, get_unlocked_achievements,
)
from config import settings


class AchievementAgent(BaseAgent):
    name = "achievement_agent"
    description = "Evaluates player progress and unlocks earned achievements"
    model = settings.model_fast
    system_prompt_file = "achievement_agent.txt"

    async def run(self, user_id: int, **kwargs: Any) -> AchievementAgentOutput:
        # Gather all evidence
        tasks = await get_user_tasks(self.pool, user_id)
        stats = await get_player_stats(self.pool, user_id)
        focus_sessions = await get_focus_sessions(self.pool, user_id, days=365)
        habits = await get_habits(self.pool, user_id)
        checkins = await get_habit_checkins(self.pool, user_id, days=365)
        already_unlocked = await get_unlocked_achievements(self.pool, user_id)
        unlocked_keys = {a["achievement_key"] for a in already_unlocked}

        now = datetime.now(timezone.utc)

        completed_tasks = [t for t in tasks if t.status == "Done"]
        categories = set(t.category for t in completed_tasks if t.category)

        # Early-bird / Night-owl detection
        early_bird_tasks = []
        night_owl_tasks = []
        for t in completed_tasks:
            if t.completed_at:
                h = t.completed_at.hour
                if h < 9:
                    early_bird_tasks.append(str(t.id))
                if h >= 22:
                    night_owl_tasks.append(str(t.id))

        # Streak calculation (days with ≥1 completed task)
        completed_dates = set()
        for t in completed_tasks:
            if t.completed_at:
                completed_dates.add(str(t.completed_at.date()))

        streak_days = 0
        from datetime import timedelta
        check_date = now.date()
        while str(check_date) in completed_dates:
            streak_days += 1
            check_date -= timedelta(days=1)

        context = {
            "already_unlocked_keys": list(unlocked_keys),
            "player_stats": {
                "level": stats.level,
                "total_xp": stats.total_xp,
                "health": stats.health,
                "focus_total_sessions": stats.focus_total_sessions,
            },
            "task_summary": {
                "total_completed": len(completed_tasks),
                "critical_completed": sum(1 for t in completed_tasks if t.priority == "Critical"),
                "categories_used": list(categories),
                "category_count": len(categories),
                "early_bird_count": len(early_bird_tasks),
                "night_owl_count": len(night_owl_tasks),
                "streak_days": streak_days,
            },
            "focus_summary": {
                "total_sessions": len(focus_sessions),
            },
            "habit_summary": {
                "has_habits": len(habits) > 0,
                "max_streak": max((h.current_streak for h in habits), default=0),
                "checkin_count": len(checkins),
            },
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=1024,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return AchievementAgentOutput(**data)

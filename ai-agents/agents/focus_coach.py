from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import FocusCoachOutput
from tools.db_tools import get_focus_sessions, get_player_stats
from tools.analytics_tools import compute_peak_focus_hours, compute_focus_streak
from config import settings


class FocusCoachAgent(BaseAgent):
    name = "focus_coach"
    description = "Analyzes focus session patterns and recommends optimal deep work strategy"
    model = settings.model_fast
    system_prompt_file = "focus_coach.txt"

    async def run(self, user_id: int, **kwargs: Any) -> FocusCoachOutput:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)

        sessions_30d = await get_focus_sessions(self.pool, user_id, days=30)
        stats = await get_player_stats(self.pool, user_id)

        session_dicts = [s.__dict__ for s in sessions_30d]
        peak_hours = compute_peak_focus_hours(session_dicts)
        streak = compute_focus_streak(session_dicts)

        # This week vs last week
        this_week_minutes = sum(
            s.duration_minutes for s in sessions_30d
            if s.completed_at and s.completed_at >= week_ago
        )
        last_week_minutes = sum(
            s.duration_minutes for s in sessions_30d
            if s.completed_at and two_weeks_ago <= s.completed_at < week_ago
        )

        # Duration distribution for optimal recommendation
        durations = [s.duration_minutes for s in sessions_30d]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 25

        completion_rate = 1.0  # All stored sessions are completed — abandoned ones aren't saved

        context = {
            "total_sessions_30d": len(sessions_30d),
            "peak_hours": peak_hours,
            "streak_days": streak,
            "this_week_minutes": this_week_minutes,
            "last_week_minutes": last_week_minutes,
            "avg_session_duration_minutes": avg_duration,
            "completion_rate": completion_rate,
            "career_sessions": stats.focus_total_sessions,
            "career_minutes": stats.focus_total_minutes,
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=512,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        return FocusCoachOutput(**data)

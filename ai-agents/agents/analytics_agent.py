from __future__ import annotations
import json
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import AnalyticsOutput
from tools.db_tools import (
    get_user_tasks, get_player_stats, get_focus_sessions,
    get_habits, get_habit_checkins,
)
from tools.analytics_tools import (
    compute_category_breakdown, compute_consistency_score,
    compute_xp_per_day, compute_level_up_eta,
)
from config import settings


class AnalyticsAgent(BaseAgent):
    name = "analytics_agent"
    description = "Generates deep productivity insights and RPG narrative progress reports"
    model = settings.model_smart
    system_prompt_file = "analytics_agent.txt"

    async def run(self, user_id: int, **kwargs: Any) -> AnalyticsOutput:
        time_range: str = kwargs.get("time_range", "30d")
        days = {"7d": 7, "30d": 30, "all": 365}.get(time_range, 30)

        tasks = await get_user_tasks(self.pool, user_id)
        stats = await get_player_stats(self.pool, user_id)
        sessions = await get_focus_sessions(self.pool, user_id, days=days)
        habits = await get_habits(self.pool, user_id)
        checkins = await get_habit_checkins(self.pool, user_id, days=days)

        task_dicts = [t.__dict__ for t in tasks]
        completed_tasks = [t for t in tasks if t.status == "Done"]
        completed_dicts = [t.__dict__ for t in completed_tasks]

        category_breakdown = compute_category_breakdown(task_dicts)
        consistency = compute_consistency_score(completed_dicts, days=days)
        xp_history = compute_xp_per_day(task_dicts, days=min(days, 30))

        avg_xp_per_day = (
            sum(x["xp"] for x in xp_history) / len(xp_history)
            if xp_history else 0
        )
        eta = compute_level_up_eta(stats.current_exp, stats.max_exp, avg_xp_per_day)

        # Determine trend: compare first half vs second half of period
        mid = len(xp_history) // 2
        first_half_avg = (
            sum(x["xp"] for x in xp_history[:mid]) / mid if mid > 0 else 0
        )
        second_half_avg = (
            sum(x["xp"] for x in xp_history[mid:]) / max(1, len(xp_history) - mid)
        )
        if second_half_avg > first_half_avg * 1.1:
            trend = "ascending"
        elif second_half_avg < first_half_avg * 0.9:
            trend = "declining"
        else:
            trend = "steady"

        best_cat = max(category_breakdown, key=lambda c: category_breakdown[c]["completed"], default=None)
        worst_cat = min(
            (c for c in category_breakdown if category_breakdown[c]["total"] > 0),
            key=lambda c: category_breakdown[c]["completed"] / max(1, category_breakdown[c]["total"]),
            default=None,
        )

        context = {
            "time_range": time_range,
            "player_stats": {
                "level": stats.level,
                "current_exp": stats.current_exp,
                "max_exp": stats.max_exp,
                "total_xp": stats.total_xp,
            },
            "task_summary": {
                "total_tasks": len(tasks),
                "completed_tasks": len(completed_tasks),
                "completion_rate": round(len(completed_tasks) / max(1, len(tasks)), 3),
                "category_breakdown": {
                    cat: {"total": d["total"], "completed": d["completed"]}
                    for cat, d in category_breakdown.items()
                },
            },
            "focus_summary": {
                "total_sessions": len(sessions),
                "total_minutes": sum(s.duration_minutes for s in sessions),
            },
            "habit_summary": {
                "active_habits": len(habits),
                "total_checkins": len(checkins),
            },
            "computed": {
                "consistency_score": round(consistency, 3),
                "productivity_trend": trend,
                "best_category": best_cat,
                "worst_category": worst_cat,
                "level_up_eta_days": eta,
                "avg_xp_per_day": round(avg_xp_per_day, 1),
                "xp_history": xp_history[-7:],  # last 7 days for context
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

        return AnalyticsOutput(**data)

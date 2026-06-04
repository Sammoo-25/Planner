from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import QuestAdvisorOutput
from tools.db_tools import (
    get_user_tasks, get_player_stats,
    log_event, apply_health_damage, was_damage_applied_today,
)
from tools.analytics_tools import compute_deadline_urgency, compute_days_overdue
from config import settings


class QuestAdvisorAgent(BaseAgent):
    name = "quest_advisor"
    description = "Analyzes task backlog and builds a daily quest board with overdue detection"
    model = settings.model_fast
    system_prompt_file = "quest_advisor.txt"

    async def run(self, user_id: int, **kwargs: Any) -> QuestAdvisorOutput:
        now = datetime.now(timezone.utc)
        tasks = await get_user_tasks(self.pool, user_id)
        stats = await get_player_stats(self.pool, user_id)

        # Pre-compute urgency scores before the LLM call
        enriched_tasks = []
        for t in tasks:
            d = t.__dict__.copy()
            if t.deadline:
                d["urgency_score"] = compute_deadline_urgency(t.deadline.isoformat(), now)
                d["days_overdue"] = compute_days_overdue(t.deadline.isoformat(), now)
                d["is_overdue"] = d["days_overdue"] > 0 and t.status != "Done"
            else:
                d["urgency_score"] = 0.1
                d["days_overdue"] = 0.0
                d["is_overdue"] = False
            # Exclude completed tasks and restrict fields to save tokens
            if t.status != "Done":
                enriched_tasks.append({
                    "id": str(d["id"]),
                    "title": d["title"],
                    "category": d.get("category"),
                    "priority": d.get("priority"),
                    "status": d.get("status"),
                    "deadline": d.get("deadline").isoformat() if d.get("deadline") else None,
                    "urgency_score": round(d["urgency_score"], 3),
                    "days_overdue": round(d["days_overdue"], 1),
                    "is_overdue": d["is_overdue"],
                    "xp_value": t.xp_value,
                })

        prompt = (
            f"Current date/time: {now.strftime('%Y-%m-%d %H:%M UTC')}\n"
            f"Player level: {stats.level}, Health: {stats.health}/100, "
            f"Total XP: {stats.total_xp}\n\n"
            f"TASKS ({len(enriched_tasks)} active):\n"
            f"{json.dumps(enriched_tasks, indent=2)}"
        )

        raw, _ = await self._call_llm(
            [{"role": "user", "content": prompt}],
            max_tokens=1024,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        output = QuestAdvisorOutput(**data)

        # Apply overdue health damage — idempotent
        for alert in output.overdue_alerts:
            already_applied = await was_damage_applied_today(self.pool, user_id, alert.task_id)
            if not already_applied:
                await apply_health_damage(self.pool, user_id, alert.health_damage)
                await log_event(self.pool, user_id, "overdue_damage", {
                    "task_id": alert.task_id,
                    "damage": alert.health_damage,
                    "days_overdue": alert.days_overdue,
                })

        return output

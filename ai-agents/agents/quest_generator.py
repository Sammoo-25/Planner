from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from typing import Any

from agents.base import BaseAgent, AgentError
from schemas.agents import QuestGeneratorOutput
from tools.db_tools import (
    get_user_tasks, get_player_stats, get_active_daily_quests,
    save_daily_quests, get_user_preferences,
)
from tools.analytics_tools import compute_category_breakdown
from config import settings


class QuestGeneratorAgent(BaseAgent):
    name = "quest_generator"
    description = "Generates personalized daily quests and side quests based on player profile"
    model = settings.model_fast
    system_prompt_file = "quest_generator.txt"

    async def run(self, user_id: int, **kwargs: Any) -> QuestGeneratorOutput:
        now = datetime.now(timezone.utc)
        force_regenerate: bool = kwargs.get("force", False)

        # Return cached quests if they exist and force is False
        if not force_regenerate:
            existing = await get_active_daily_quests(self.pool, user_id)
            if existing:
                # Parse existing quests into output format
                quests = [
                    {
                        "title": q["title"],
                        "description": q.get("description") or "",
                        "category": q.get("category") or "General",
                        "xp_reward": q["xp_reward"],
                        "condition_type": q.get("condition_type") or "complete_any_tasks",
                        "condition_value": q.get("condition_value") or {"n": 1},
                        "difficulty": "Normal",
                    }
                    for q in existing
                ]
                return QuestGeneratorOutput(
                    daily_quests=quests[:5],
                    side_quests=quests[5:] if len(quests) > 5 else [],
                    total_xp_available=sum(q["xp_reward"] for q in quests),
                )

        tasks = await get_user_tasks(self.pool, user_id)
        stats = await get_player_stats(self.pool, user_id)
        prefs = await get_user_preferences(self.pool, user_id)

        category_breakdown = compute_category_breakdown([t.__dict__ for t in tasks if t.status != "Done"])
        day_of_week = now.strftime("%A")

        context = {
            "player_level": stats.level,
            "difficulty": prefs.difficulty,
            "daily_quest_count": prefs.daily_quest_count,
            "day_of_week": day_of_week,
            "category_breakdown": {
                cat: data["total"] for cat, data in category_breakdown.items()
            },
            "active_task_count": sum(1 for t in tasks if t.status != "Done"),
        }

        raw, _ = await self._call_llm(
            [{"role": "user", "content": json.dumps(context, indent=2)}],
            max_tokens=1024,
        )

        try:
            data = json.loads(raw.strip())
        except json.JSONDecodeError as e:
            raise AgentError(self.name, f"Invalid JSON from LLM: {e}", retryable=True)

        output = QuestGeneratorOutput(**data)

        # Persist quests to DB — expires at midnight tonight
        midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        all_quests = [q.model_dump() for q in output.daily_quests + output.side_quests]
        if output.boss_quest:
            all_quests.append(output.boss_quest.model_dump())

        await save_daily_quests(self.pool, user_id, all_quests, midnight)

        return output

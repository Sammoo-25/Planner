"""
Orchestrator — classifies user intent and routes to the appropriate agent(s).

Intent classification uses a cheap, fast Haiku call with a structured prompt
so the expensive agents only run when needed.
"""
from __future__ import annotations
import json
import asyncio
from typing import Any

import anthropic

from agents.registry import registry
from schemas.agents import ChatResponse
from memory.session_memory import SessionMemory
from config import settings
from tools.db_tools import get_user_tasks, get_player_stats, log_event


_INTENT_PROMPT = """Classify the user's message into exactly one of these intents:
- quest_board: asking what to do today, quest recommendations, daily tasks
- schedule: create a daily schedule, plan my day, organize tasks by time
- insights: productivity stats, analytics, progress report, how am I doing
- achievements: what achievements do I have, what can I unlock
- habit_check: habit status, streaks, consistency
- focus_advice: focus sessions, deep work, when to focus
- create_task: adding a new task, reminder, quest
- update_task: changing task status, priority, or deadline
- delete_task: remove a task
- chat: general conversation, greeting, question about the game, other

Return ONLY the intent string, nothing else."""


class Orchestrator:
    def __init__(self, memory: SessionMemory) -> None:
        self.memory = memory
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def _classify_intent(self, message: str) -> str:
        try:
            resp = await asyncio.wait_for(
                self._client.messages.create(
                    model=settings.model_fast,
                    max_tokens=20,
                    system=_INTENT_PROMPT,
                    messages=[{"role": "user", "content": message}],
                ),
                timeout=10,
            )
            intent = resp.content[0].text.strip().lower()
            valid = {
                "quest_board", "schedule", "insights", "achievements",
                "habit_check", "focus_advice", "create_task", "update_task",
                "delete_task", "chat",
            }
            return intent if intent in valid else "chat"
        except Exception:
            return "chat"

    async def handle_chat(
        self,
        user_id: int,
        message: str,
        pool: Any = None,
    ) -> ChatResponse:
        intent = await self._classify_intent(message)

        # Persist user message to conversation history
        await self.memory.append_message(user_id, "user", message)

        actions_taken: list[str] = []
        response_text = ""
        agent_name = "orchestrator"

        try:
            if intent == "quest_board":
                agent = registry.get("quest_advisor")
                result = await agent.run(user_id)
                agent_name = "quest_advisor"
                response_text = (
                    f"{result.narrative}\n\n"
                    f"**Today's Quests** ({result.xp_opportunity} XP available):\n"
                )
                for q in result.daily_quests:
                    response_text += f"• {q.title} ({q.xp_reward} XP) — {q.reason}\n"
                if result.overdue_alerts:
                    response_text += f"\n⚠️ **{len(result.overdue_alerts)} overdue quest(s)** — health damage applied."

            elif intent == "schedule":
                agent = registry.get("smart_planner")
                result = await agent.run(user_id)
                agent_name = "smart_planner"
                response_text = f"{result.schedule_narrative}\n\n**Schedule:**\n"
                for block in result.time_blocks:
                    response_text += f"• {block.start_time}–{block.end_time}: {block.title}\n"
                if result.unscheduled_tasks:
                    response_text += f"\n{len(result.unscheduled_tasks)} task(s) could not fit today."

            elif intent == "insights":
                agent = registry.get("analytics_agent")
                result = await agent.run(user_id, time_range="30d")
                agent_name = "analytics_agent"
                response_text = result.weekly_narrative + "\n\n"
                for insight in result.actionable_insights:
                    response_text += f"• {insight}\n"

            elif intent == "achievements":
                agent = registry.get("achievement_agent")
                result = await agent.run(user_id)
                agent_name = "achievement_agent"
                if result.new_achievements:
                    response_text = f"🏆 **{len(result.new_achievements)} achievement(s) unlocked!**\n"
                    for ach in result.new_achievements:
                        response_text += f"• **{ach.achievement_title}** (+{ach.xp_reward} XP)\n"
                    actions_taken.append(f"unlocked_{len(result.new_achievements)}_achievements")
                else:
                    progress = result.progress_updates[:3] if result.progress_updates else []
                    response_text = "No new achievements yet. Keep going!\n\n**In progress:**\n"
                    for p in progress:
                        response_text += f"• {p.get('achievement_key', '?')}: {p.get('current', 0)}/{p.get('required', '?')}\n"

            elif intent == "habit_check":
                agent = registry.get("habit_coach")
                result = await agent.run(user_id)
                agent_name = "habit_coach"
                response_text = result.coaching_message + "\n\n"
                if result.at_risk_habits:
                    response_text += f"⚠️ **At risk today:** {', '.join(result.at_risk_habits[:3])}\n"
                response_text += f"**Consistency score:** {int(result.consistency_score * 100)}%"

            elif intent == "focus_advice":
                agent = registry.get("focus_coach")
                result = await agent.run(user_id)
                agent_name = "focus_coach"
                peak_str = ", ".join(f"{h}:00" for h in result.peak_hours)
                response_text = (
                    f"{result.coaching_message}\n\n"
                    f"**Peak hours:** {peak_str}\n"
                    f"**Optimal session:** {result.optimal_duration_minutes} min\n"
                    f"**Deep work streak:** {result.deep_work_streak_days} day(s)"
                )

            else:
                # General chat — use companion for a personalized response
                companion = registry.get("companion")
                result = await companion.run(user_id)
                agent_name = "companion"
                response_text = result.message
                if result.suggested_action:
                    response_text += f"\n\n💡 **Suggestion:** {result.suggested_action}"

        except Exception as e:
            response_text = (
                "The Oracle is momentarily silent. Your quests await — try again shortly."
            )
            agent_name = "fallback"

        # Persist assistant response
        await self.memory.append_message(user_id, "assistant", response_text, agent_name)

        return ChatResponse(
            response=response_text,
            agent_name=agent_name,
            intent=intent,
            actions_taken=actions_taken,
            fallback=(agent_name == "fallback"),
        )

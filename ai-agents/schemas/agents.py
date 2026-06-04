from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel


# ── Common ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    agent_name: str
    intent: str
    actions_taken: list[str] = []
    fallback: bool = False


class AgentInsight(BaseModel):
    title: str
    description: str
    value: Optional[str] = None
    trend: Optional[str] = None           # "up" | "down" | "stable"


# ── Quest Advisor ────────────────────────────────────────────────────────────

class TaskRecommendation(BaseModel):
    task_id: str
    title: str
    reason: str
    urgency_score: float
    xp_reward: int


class OverdueAlert(BaseModel):
    task_id: str
    title: str
    days_overdue: float
    health_damage: int


class QuestAdvisorOutput(BaseModel):
    daily_quests: list[TaskRecommendation]
    overdue_alerts: list[OverdueAlert]
    narrative: str
    xp_opportunity: int


# ── Smart Planner ────────────────────────────────────────────────────────────

class TimeBlock(BaseModel):
    task_id: str
    title: str
    start_time: str                        # HH:MM
    end_time: str                          # HH:MM
    duration_minutes: int
    category: Optional[str] = None
    priority: Optional[str] = None
    reasoning: str


class SmartPlannerOutput(BaseModel):
    date: str                              # YYYY-MM-DD
    time_blocks: list[TimeBlock]
    unscheduled_tasks: list[str]           # task IDs that didn't fit
    total_scheduled_minutes: int
    schedule_narrative: str


# ── Achievement Agent ────────────────────────────────────────────────────────

class AchievementCheck(BaseModel):
    achievement_key: str
    achievement_title: str
    achievement_description: str
    xp_reward: int
    should_unlock: bool
    reason: str


class AchievementAgentOutput(BaseModel):
    new_achievements: list[AchievementCheck]
    progress_updates: list[dict[str, Any]]
    narrative: Optional[str] = None


# ── AI Companion ─────────────────────────────────────────────────────────────

class CompanionOutput(BaseModel):
    message: str
    tone: str                              # "encouraging" | "alert" | "celebratory" | "advisory"
    suggested_action: Optional[str] = None


# ── Habit Coach ──────────────────────────────────────────────────────────────

class HabitRecommendation(BaseModel):
    title: str
    description: str
    category: str
    frequency: str
    xp_reward: int
    reasoning: str


class HabitCoachOutput(BaseModel):
    streak_summary: list[dict[str, Any]]
    consistency_score: float               # 0.0 – 1.0
    at_risk_habits: list[str]             # habit IDs close to breaking streak
    habit_recommendations: list[HabitRecommendation]
    coaching_message: str


# ── Focus Coach ──────────────────────────────────────────────────────────────

class FocusCoachOutput(BaseModel):
    peak_hours: list[int]
    optimal_duration_minutes: int
    deep_work_streak_days: int
    weekly_focus_minutes: int
    completion_rate: float
    coaching_message: str


# ── Analytics Agent ──────────────────────────────────────────────────────────

class AnalyticsOutput(BaseModel):
    productivity_trend: str               # "ascending" | "steady" | "declining"
    consistency_score: float
    best_category: Optional[str] = None
    worst_category: Optional[str] = None
    level_up_eta_days: Optional[float] = None
    weekly_narrative: str
    actionable_insights: list[str]
    insights: list[AgentInsight] = []


# ── Quest Generator ──────────────────────────────────────────────────────────

class GeneratedQuest(BaseModel):
    title: str
    description: str
    category: str
    xp_reward: int
    condition_type: str
    condition_value: dict[str, Any]
    difficulty: str                        # Normal | Hard | Legendary


class QuestGeneratorOutput(BaseModel):
    daily_quests: list[GeneratedQuest]
    side_quests: list[GeneratedQuest]
    boss_quest: Optional[GeneratedQuest] = None
    total_xp_available: int


# ── Game Balancer ────────────────────────────────────────────────────────────

class BalancerOutput(BaseModel):
    economy_health: str                   # "balanced" | "inflationary" | "deflationary"
    avg_days_to_level_5: Optional[float] = None
    recommended_xp_adjustments: dict[str, int] = {}
    balance_report: str

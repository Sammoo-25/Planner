from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class Task(BaseModel):
    id: str
    user_id: int
    title: str
    category: Optional[str] = None
    priority: Optional[str] = None          # Low | Medium | High | Critical
    deadline: Optional[datetime] = None
    status: str = "To Do"                   # To Do | In Progress | Done
    start_time: Optional[str] = None        # HH:MM
    duration: Optional[int] = None          # hours
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    subtask_count: int = 0
    completed_subtask_count: int = 0

    @property
    def is_overdue(self) -> bool:
        if self.deadline and self.status != "Done":
            return datetime.utcnow() > self.deadline
        return False

    @property
    def xp_value(self) -> int:
        base = {"Critical": 75, "High": 50, "Medium": 20, "Low": 10}.get(self.priority or "Medium", 20)
        return base + (self.completed_subtask_count * 5)


class PlayerStats(BaseModel):
    user_id: int
    level: int = 1
    current_exp: int = 0
    max_exp: int = 100
    health: int = 100
    avatar_url: Optional[str] = None
    total_xp: int = 0
    focus_total_sessions: int = 0
    focus_total_minutes: int = 0


class FocusSession(BaseModel):
    id: str
    user_id: int
    task_id: Optional[str] = None
    duration_minutes: int
    xp_earned: int
    completed_at: datetime


class Habit(BaseModel):
    id: str
    user_id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    frequency: str = "daily"
    target_count: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    last_checked_in: Optional[datetime] = None
    xp_reward: int = 15
    is_active: bool = True


class UserPreferences(BaseModel):
    user_id: int
    timezone: str = "UTC"
    focus_duration_minutes: int = 25
    daily_quest_count: int = 5
    difficulty: str = "Normal"
    companion_name: str = "Sage"
    notifications_enabled: bool = True

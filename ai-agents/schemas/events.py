from __future__ import annotations
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel

EVENT_TYPES = {
    "task_complete",
    "task_create",
    "level_up",
    "focus_complete",
    "damage",
    "heal",
    "achievement_unlock",
    "daily_quest_complete",
    "habit_checkin",
    "overdue_damage",
}


class GameEvent(BaseModel):
    user_id: int
    event_type: str
    payload: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = None

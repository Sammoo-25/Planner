"""
Database access layer for all agents.

Every function is user-scoped — no cross-user reads are possible.
All queries are parameterised; no string interpolation of user data.
"""
from __future__ import annotations
from typing import Any, Optional
from datetime import datetime, timedelta, timezone
import asyncpg

from schemas.tasks import Task, PlayerStats, FocusSession, Habit, UserPreferences


def _naive_utc(dt: datetime) -> datetime:
    """
    Convert a timezone-aware UTC datetime to naive UTC for asyncpg.
    PostgreSQL TIMESTAMP columns don't store timezone info — asyncpg
    rejects aware datetimes when the column is TIMESTAMP (not TIMESTAMPTZ).
    """
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _normalize_row(row: Any) -> dict[str, Any]:
    """
    asyncpg returns UUID objects for UUID columns. Pydantic str fields reject them.
    Convert all UUID values to strings, Decimal to float, and attach UTC timezone
    to naive datetime objects so agents can compare them to timezone-aware values.
    """
    import uuid as _uuid
    from decimal import Decimal
    result = {}
    for k, v in dict(row).items():
        if isinstance(v, _uuid.UUID):
            result[k] = str(v)
        elif isinstance(v, Decimal):
            result[k] = float(v)
        elif isinstance(v, datetime) and v.tzinfo is None:
            # PostgreSQL TIMESTAMP columns return naive datetimes — attach UTC
            result[k] = v.replace(tzinfo=timezone.utc)
        else:
            result[k] = v
    return result


async def get_user_tasks(pool: asyncpg.Pool, user_id: int) -> list[Task]:
    rows = await pool.fetch(
        """
        SELECT t.*,
               (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) AS subtask_count,
               (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND is_completed = TRUE) AS completed_subtask_count
        FROM tasks t
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
        """,
        user_id,
    )
    return [Task(**_normalize_row(r)) for r in rows]


async def get_player_stats(pool: asyncpg.Pool, user_id: int) -> PlayerStats:
    row = await pool.fetchrow(
        "SELECT * FROM player_stats WHERE user_id = $1", user_id
    )
    if row:
        return PlayerStats(**_normalize_row(row))
    return PlayerStats(user_id=user_id)


async def get_focus_sessions(
    pool: asyncpg.Pool, user_id: int, days: int = 30
) -> list[FocusSession]:
    cutoff = _naive_utc(datetime.now(timezone.utc) - timedelta(days=days))
    rows = await pool.fetch(
        """
        SELECT * FROM focus_sessions
        WHERE user_id = $1 AND completed_at >= $2
        ORDER BY completed_at DESC
        """,
        user_id,
        cutoff,
    )
    return [FocusSession(**_normalize_row(r)) for r in rows]


async def get_habits(pool: asyncpg.Pool, user_id: int) -> list[Habit]:
    rows = await pool.fetch(
        "SELECT * FROM habits WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at ASC",
        user_id,
    )
    return [Habit(**_normalize_row(r)) for r in rows]


async def get_habit_checkins(
    pool: asyncpg.Pool, user_id: int, days: int = 30
) -> list[dict[str, Any]]:
    cutoff = _naive_utc(datetime.now(timezone.utc) - timedelta(days=days))
    rows = await pool.fetch(
        """
        SELECT hc.*, h.title as habit_title
        FROM habit_checkins hc
        JOIN habits h ON h.id = hc.habit_id
        WHERE hc.user_id = $1 AND hc.checked_in_at >= $2
        ORDER BY hc.checked_in_at DESC
        """,
        user_id,
        cutoff,
    )
    return [_normalize_row(r) for r in rows]


async def get_user_preferences(
    pool: asyncpg.Pool, user_id: int
) -> UserPreferences:
    row = await pool.fetchrow(
        "SELECT * FROM user_preferences WHERE user_id = $1", user_id
    )
    if row:
        return UserPreferences(**_normalize_row(row))
    return UserPreferences(user_id=user_id)


async def get_events(
    pool: asyncpg.Pool,
    user_id: int,
    event_type: Optional[str] = None,
    days: int = 30,
) -> list[dict[str, Any]]:
    cutoff = _naive_utc(datetime.now(timezone.utc) - timedelta(days=days))
    if event_type:
        rows = await pool.fetch(
            """
            SELECT * FROM events
            WHERE user_id = $1 AND event_type = $2 AND created_at >= $3
            ORDER BY created_at DESC
            """,
            user_id,
            event_type,
            cutoff,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT * FROM events
            WHERE user_id = $1 AND created_at >= $2
            ORDER BY created_at DESC
            """,
            user_id,
            cutoff,
        )
    return [_normalize_row(r) for r in rows]


async def get_unlocked_achievements(
    pool: asyncpg.Pool, user_id: int
) -> list[dict[str, Any]]:
    rows = await pool.fetch(
        "SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC",
        user_id,
    )
    return [_normalize_row(r) for r in rows]


async def get_active_daily_quests(
    pool: asyncpg.Pool, user_id: int
) -> list[dict[str, Any]]:
    rows = await pool.fetch(
        """
        SELECT * FROM daily_quests
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at ASC
        """,
        user_id,
    )
    return [_normalize_row(r) for r in rows]


async def save_daily_quests(
    pool: asyncpg.Pool,
    user_id: int,
    quests: list[dict[str, Any]],
    expires_at: datetime,
) -> list[dict[str, Any]]:
    """Delete today's unexpired quests and insert the new set."""
    import json as _json
    expires_naive = _naive_utc(expires_at)
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                "DELETE FROM daily_quests WHERE user_id = $1 AND expires_at > NOW() AND is_completed = FALSE",
                user_id,
            )
            saved = []
            for q in quests:
                condition_value = q.get("condition_value")
                if isinstance(condition_value, dict):
                    condition_value = _json.dumps(condition_value)
                row = await conn.fetchrow(
                    """
                    INSERT INTO daily_quests
                      (user_id, title, description, category, xp_reward,
                       condition_type, condition_value, expires_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
                    RETURNING *
                    """,
                    user_id,
                    q["title"],
                    q.get("description"),
                    q.get("category"),
                    q["xp_reward"],
                    q.get("condition_type"),
                    condition_value,
                    expires_naive,
                )
                saved.append(dict(row))
    return saved


async def log_event(
    pool: asyncpg.Pool,
    user_id: int,
    event_type: str,
    payload: Optional[dict[str, Any]] = None,
) -> None:
    import json
    payload_str = json.dumps(payload) if payload else None
    await pool.execute(
        "INSERT INTO events (user_id, event_type, payload) VALUES ($1, $2, $3::jsonb)",
        user_id,
        event_type,
        payload_str,
    )


async def apply_health_damage(
    pool: asyncpg.Pool, user_id: int, damage: int
) -> int:
    """Reduces player health by `damage`, floor 0. Returns new health value."""
    row = await pool.fetchrow(
        """
        UPDATE player_stats
        SET health = GREATEST(0, health - $1), updated_at = NOW()
        WHERE user_id = $2
        RETURNING health
        """,
        damage,
        user_id,
    )
    return row["health"] if row else 0


async def was_damage_applied_today(
    pool: asyncpg.Pool, user_id: int, task_id: str
) -> bool:
    """Idempotency check — ensures overdue damage is applied at most once per day."""
    count = await pool.fetchval(
        """
        SELECT COUNT(*) FROM events
        WHERE user_id = $1
          AND event_type = 'overdue_damage'
          AND payload::jsonb->>'task_id' = $2
          AND created_at > NOW() - INTERVAL '1 day'
        """,
        user_id,
        task_id,
    )
    return (count or 0) > 0


async def get_aggregate_stats(pool: asyncpg.Pool) -> dict[str, Any]:
    """Aggregated (non-personal) stats for the Game Balancer agent."""
    row = await pool.fetchrow(
        """
        SELECT
          COUNT(*) as total_users,
          AVG(level) as avg_level,
          MAX(level) as max_level,
          AVG(total_xp) as avg_total_xp,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY level) as median_level
        FROM player_stats
        """
    )
    distribution = await pool.fetch(
        "SELECT level, COUNT(*) as count FROM player_stats GROUP BY level ORDER BY level"
    )
    return {
        "summary": dict(row) if row else {},
        "level_distribution": [dict(r) for r in distribution],
    }

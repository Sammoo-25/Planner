"""
Pure computation tools — no I/O, no side effects.
These are called by agents to transform raw data before LLM analysis.
"""
from __future__ import annotations
from typing import Any
from collections import defaultdict
from datetime import datetime, timezone


def compute_deadline_urgency(deadline_str: str, now: datetime) -> float:
    """Returns urgency score 0.0–1.0. 1.0 = overdue or due within 6 hours."""
    try:
        if deadline_str.endswith("Z"):
            deadline_str = deadline_str[:-1] + "+00:00"
        deadline = datetime.fromisoformat(deadline_str)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        hours_remaining = (deadline - now).total_seconds() / 3600
        if hours_remaining <= 0:
            return 1.0
        if hours_remaining <= 6:
            return 0.95
        if hours_remaining <= 24:
            return 0.8
        if hours_remaining <= 72:
            return 0.5
        days = hours_remaining / 24
        return max(0.05, 1.0 - (days / 14))
    except Exception:
        return 0.1


def compute_days_overdue(deadline_str: str, now: datetime) -> float:
    try:
        if deadline_str.endswith("Z"):
            deadline_str = deadline_str[:-1] + "+00:00"
        deadline = datetime.fromisoformat(deadline_str)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        delta = now - deadline
        return max(0.0, delta.total_seconds() / 86400)
    except Exception:
        return 0.0


def compute_category_breakdown(tasks: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    """Returns {category: {total, completed, overdue}} counts."""
    result: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "completed": 0, "overdue": 0})
    now = datetime.now(timezone.utc)
    for t in tasks:
        cat = t.get("category") or "General"
        result[cat]["total"] += 1
        if t.get("status") == "Done":
            result[cat]["completed"] += 1
        elif t.get("deadline"):
            if compute_days_overdue(str(t["deadline"]), now) > 0:
                result[cat]["overdue"] += 1
    return dict(result)


def compute_peak_focus_hours(sessions: list[dict[str, Any]]) -> list[int]:
    """Returns list of top 3 hours of day (0-23) by completed session count."""
    hour_counts: dict[int, int] = defaultdict(int)
    for s in sessions:
        completed_at = s.get("completed_at")
        if completed_at:
            if isinstance(completed_at, str):
                try:
                    dt = datetime.fromisoformat(completed_at)
                    hour_counts[dt.hour] += 1
                except Exception:
                    pass
            elif hasattr(completed_at, "hour"):
                hour_counts[completed_at.hour] += 1
    sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
    return [h for h, _ in sorted_hours[:3]]


def compute_focus_streak(sessions: list[dict[str, Any]]) -> int:
    """Returns current streak of consecutive days with at least one focus session."""
    if not sessions:
        return 0
    dates: set[str] = set()
    for s in sessions:
        ca = s.get("completed_at")
        if ca:
            if isinstance(ca, str):
                try:
                    d = datetime.fromisoformat(ca).date()
                    dates.add(str(d))
                except Exception:
                    pass
            elif hasattr(ca, "date"):
                dates.add(str(ca.date()))

    today = datetime.now(timezone.utc).date()
    streak = 0
    current = today
    while str(current) in dates:
        streak += 1
        current = current.replace(day=current.day - 1) if current.day > 1 else current
        from datetime import timedelta
        current = today - timedelta(days=streak)
    return streak


def compute_consistency_score(
    completed_tasks: list[dict[str, Any]], days: int = 30
) -> float:
    """
    Ratio of active days (days with ≥1 completed task) to total days in window.
    """
    if not completed_tasks:
        return 0.0
    active_days: set[str] = set()
    for t in completed_tasks:
        ca = t.get("completed_at")
        if ca:
            if isinstance(ca, str):
                try:
                    active_days.add(ca[:10])
                except Exception:
                    pass
            elif hasattr(ca, "date"):
                active_days.add(str(ca.date()))
    return min(1.0, len(active_days) / days)


def compute_xp_per_day(tasks: list[dict[str, Any]], days: int = 7) -> list[dict[str, Any]]:
    """Returns [{date, xp}] for the last `days` days."""
    xp_by_date: dict[str, int] = defaultdict(int)
    now = datetime.now(timezone.utc)
    for t in tasks:
        if t.get("status") != "Done" or not t.get("completed_at"):
            continue
        ca = t["completed_at"]
        try:
            if isinstance(ca, str):
                dt = datetime.fromisoformat(ca)
            else:
                dt = ca
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if (now - dt).days <= days:
                priority = t.get("priority") or "Medium"
                xp = {"Critical": 75, "High": 50, "Medium": 20, "Low": 10}.get(priority, 20)
                xp_by_date[str(dt.date())] += xp
        except Exception:
            pass
    return [{"date": d, "xp": x} for d, x in sorted(xp_by_date.items())]


def compute_level_up_eta(current_exp: int, max_exp: int, avg_xp_per_day: float) -> float | None:
    """Estimated days until next level-up."""
    if avg_xp_per_day <= 0:
        return None
    needed = max_exp - current_exp
    return round(needed / avg_xp_per_day, 1)


def compute_habit_consistency(
    habits: list[dict[str, Any]],
    checkins: list[dict[str, Any]],
    days: int = 30,
) -> list[dict[str, Any]]:
    """For each habit, compute check-in rate over the window."""
    checkin_by_habit: dict[str, set[str]] = defaultdict(set)
    for c in checkins:
        hid = str(c.get("habit_id", ""))
        ca = c.get("checked_in_at")
        if ca:
            try:
                d = datetime.fromisoformat(str(ca)).date() if isinstance(ca, str) else ca.date()
                checkin_by_habit[hid].add(str(d))
            except Exception:
                pass

    result = []
    for h in habits:
        hid = str(h.get("id", ""))
        unique_days = len(checkin_by_habit.get(hid, set()))
        rate = min(1.0, unique_days / days)
        result.append({
            "habit_id": hid,
            "title": h.get("title", ""),
            "current_streak": h.get("current_streak", 0),
            "longest_streak": h.get("longest_streak", 0),
            "checkin_rate": round(rate, 3),
            "total_checkins": unique_days,
        })
    return result

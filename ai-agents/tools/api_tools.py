"""
HTTP client for calling back to the Express backend.
Agents use this to read/write data that goes through the Express API
(e.g., updating player stats, unlocking achievements).
"""
from __future__ import annotations
from typing import Any, Optional
import httpx

from config import settings


class ExpressClient:
    """Thin async wrapper around the Express REST API."""

    def __init__(self) -> None:
        self._base = settings.express_api_url.rstrip("/")
        self._secret = settings.agent_service_secret

    def _internal_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-internal-secret": self._secret,
        }

    async def log_event(
        self, user_id: int, event_type: str, payload: Optional[dict[str, Any]] = None
    ) -> None:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{self._base}/events",
                json={"user_id": user_id, "event_type": event_type, "payload": payload},
                headers=self._internal_headers(),
            )

    async def unlock_achievement(
        self,
        user_id: int,
        key: str,
        title: str,
        description: str,
        xp_reward: int,
        user_jwt: str,
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(
                f"{self._base}/achievements",
                json={
                    "achievement_key": key,
                    "achievement_title": title,
                    "achievement_description": description,
                    "xp_reward": xp_reward,
                },
                headers={"Authorization": f"Bearer {user_jwt}", "Content-Type": "application/json"},
            )
            return resp.json()

    async def save_daily_quests_via_api(
        self,
        user_id: int,
        quests: list[dict[str, Any]],
        user_jwt: str,
    ) -> None:
        """Not used directly — quests are written to DB by the agent service itself."""
        pass


express_client = ExpressClient()

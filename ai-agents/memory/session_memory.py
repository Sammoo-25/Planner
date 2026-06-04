"""
Session memory — stores conversation history per user in Redis.
Falls back gracefully to in-process dict storage if Redis is unavailable.
This means the service works even without Redis (conversation history is
lost on restart, but no crash occurs).
"""
from __future__ import annotations
import json
import logging
from collections import defaultdict
from typing import Any, Optional

logger = logging.getLogger(__name__)


class SessionMemory:
    def __init__(self, redis: Any = None) -> None:
        self._redis = redis
        self._available = redis is not None
        # In-process fallback storage (non-persistent, but functional)
        self._local_history: dict[int, list[dict[str, Any]]] = defaultdict(list)
        self._local_cache: dict[str, Any] = {}

        from config import settings
        self._settings = settings

    def _key(self, user_id: int) -> str:
        return f"conv:{user_id}"

    def _cache_key(self, prefix: str, user_id: int, suffix: str = "") -> str:
        return f"{prefix}:{user_id}{':' + suffix if suffix else ''}"

    async def _redis_get(self, key: str) -> Optional[str]:
        if not self._available:
            return None
        try:
            return await self._redis.get(key)
        except Exception as e:
            logger.warning(f"Redis get failed (using local fallback): {e}")
            self._available = False
            return None

    async def _redis_setex(self, key: str, ttl: int, value: str) -> None:
        if not self._available:
            return
        try:
            await self._redis.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Redis setex failed (using local fallback): {e}")
            self._available = False

    async def _redis_delete(self, key: str) -> None:
        if not self._available:
            return
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete failed: {e}")

    async def get_history(self, user_id: int) -> list[dict[str, Any]]:
        raw = await self._redis_get(self._key(user_id))
        if raw:
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return []
        # Fallback to local
        return list(self._local_history[user_id])

    async def append_message(
        self, user_id: int, role: str, content: str, agent_name: Optional[str] = None
    ) -> None:
        history = await self.get_history(user_id)
        history.append({"role": role, "content": content, "agent": agent_name})
        max_msgs = self._settings.max_conversation_messages
        if len(history) > max_msgs:
            history = history[-max_msgs:]

        serialized = json.dumps(history)
        await self._redis_setex(self._key(user_id), self._settings.conversation_ttl, serialized)
        # Always keep local copy as fallback
        self._local_history[user_id] = history

    async def clear_history(self, user_id: int) -> None:
        await self._redis_delete(self._key(user_id))
        self._local_history[user_id] = []

    async def set_cache(
        self, key_prefix: str, user_id: int, data: Any, ttl: int, suffix: str = ""
    ) -> None:
        key = self._cache_key(key_prefix, user_id, suffix)
        serialized = json.dumps(data, default=str)
        await self._redis_setex(key, ttl, serialized)
        self._local_cache[key] = data

    async def get_cache(
        self, key_prefix: str, user_id: int, suffix: str = ""
    ) -> Optional[Any]:
        key = self._cache_key(key_prefix, user_id, suffix)
        raw = await self._redis_get(key)
        if raw:
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return self._local_cache.get(key)

    async def invalidate_cache(self, key_prefix: str, user_id: int, suffix: str = "") -> None:
        key = self._cache_key(key_prefix, user_id, suffix)
        await self._redis_delete(key)
        self._local_cache.pop(key, None)

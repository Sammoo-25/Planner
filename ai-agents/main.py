"""
Life RPG — AI Agent Service
FastAPI application that hosts all agents and exposes them as HTTP endpoints.

All endpoints require the x-internal-secret header (set by the Express proxy).
User identity is passed via x-user-id header, extracted from the JWT by Express.
"""
from __future__ import annotations
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

import asyncpg
import redis.asyncio as aioredis
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import settings
from agents.registry import registry
from agents.quest_advisor import QuestAdvisorAgent
from agents.smart_planner import SmartPlannerAgent
from agents.achievement_agent import AchievementAgent
from agents.companion import CompanionAgent
from agents.habit_coach import HabitCoachAgent
from agents.focus_coach import FocusCoachAgent
from agents.analytics_agent import AnalyticsAgent
from agents.quest_generator import QuestGeneratorAgent
from agents.game_balancer import GameBalancerAgent
from memory.session_memory import SessionMemory
from monitoring.tracker import MetricsTracker
from orchestrator.orchestrator import Orchestrator
from schemas.agents import ChatRequest, ChatResponse
from schemas.events import GameEvent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("agent-service")

# Application state — shared across all requests
_pool: asyncpg.Pool | None = None
_redis: aioredis.Redis | None = None
_memory: SessionMemory | None = None
_metrics: MetricsTracker | None = None
_orchestrator: Orchestrator | None = None
_scheduler: AsyncIOScheduler | None = None


def _require_internal(secret: str = Header(..., alias="x-internal-secret")) -> None:
    if secret != settings.agent_service_secret:
        raise HTTPException(status_code=403, detail="Forbidden")


def _get_user_id(x_user_id: str = Header(..., alias="x-user-id")) -> int:
    try:
        return int(x_user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid x-user-id header")


async def _generate_daily_quests_for_all() -> None:
    """Scheduled job: regenerate daily quests for all active users at midnight."""
    if not _pool:
        return
    rows = await _pool.fetch("SELECT DISTINCT user_id FROM player_stats")
    logger.info(f"Generating daily quests for {len(rows)} users")
    gen = registry.get("quest_generator")
    for row in rows:
        try:
            await gen.run(row["user_id"], force=True)
        except Exception as e:
            logger.error(f"Quest generation failed for user {row['user_id']}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pool, _redis, _memory, _metrics, _orchestrator, _scheduler

    # Connect to PostgreSQL
    _pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=3,
        max_size=10,
        command_timeout=30,
    )
    logger.info("PostgreSQL pool established")

    # Connect to Redis (optional — falls back to in-process if unavailable)
    try:
        _redis = await aioredis.from_url(
            settings.redis_url, decode_responses=True, socket_connect_timeout=2
        )
        await _redis.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis unavailable ({e}) — using in-process fallback (no persistence)")
        _redis = None

    # Shared dependencies
    _memory = SessionMemory(_redis)
    _metrics = MetricsTracker(_pool)
    await _metrics.setup()

    # Register and build all agents
    registry.register(QuestAdvisorAgent)
    registry.register(SmartPlannerAgent)
    registry.register(AchievementAgent)
    registry.register(CompanionAgent)
    registry.register(HabitCoachAgent)
    registry.register(FocusCoachAgent)
    registry.register(AnalyticsAgent)
    registry.register(QuestGeneratorAgent)
    registry.register(GameBalancerAgent)
    registry.build_all(_pool, _memory, _metrics)
    logger.info(f"Agents ready: {registry.names()}")

    # Orchestrator
    _orchestrator = Orchestrator(_memory)

    # Scheduler — daily quest generation at midnight UTC
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(_generate_daily_quests_for_all, "cron", hour=0, minute=0)
    _scheduler.start()
    logger.info("Scheduler started")

    yield

    # Cleanup
    _scheduler.shutdown()
    await _pool.close()
    if _redis is not None:
        await _redis.aclose()
    logger.info("Agent service shut down cleanly")


app = FastAPI(
    title="Life RPG Agent Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "agents": registry.names()}


# ── Chat (NL interface through orchestrator) ─────────────────────────────────

@app.post("/agent/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    x_internal_secret: str = Header(...),
    x_user_id: str = Header(...),
):
    _require_internal(x_internal_secret)
    user_id = _get_user_id(x_user_id)
    return await _orchestrator.handle_chat(user_id, body.message, pool=_pool)


# ── Quest Board ──────────────────────────────────────────────────────────────

@app.get("/agent/daily-quests/{user_id}")
async def get_daily_quests(
    user_id: int,
    x_internal_secret: str = Header(...),
    force: bool = Query(False),
):
    _require_internal(x_internal_secret)
    agent = registry.get("quest_generator")
    result = await agent.run(user_id, force=force)
    return result.model_dump()


@app.get("/agent/quest-board/{user_id}")
async def get_quest_board(
    user_id: int,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)
    agent = registry.get("quest_advisor")
    result = await agent.run(user_id)
    return result.model_dump()


# ── Smart Planner ────────────────────────────────────────────────────────────

@app.post("/agent/schedule/{user_id}")
async def create_schedule(
    user_id: int,
    body: dict,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)
    agent = registry.get("smart_planner")
    result = await agent.run(user_id, date=body.get("date"))
    return result.model_dump()


# ── Analytics ────────────────────────────────────────────────────────────────

@app.get("/agent/insights/{user_id}")
async def get_insights(
    user_id: int,
    x_internal_secret: str = Header(...),
    time_range: str = Query("30d"),
):
    _require_internal(x_internal_secret)

    cached = await _memory.get_cache("insights", user_id, suffix=time_range)
    if cached:
        return cached

    agent = registry.get("analytics_agent")
    result = await agent.run(user_id, time_range=time_range)
    data = result.model_dump()

    await _memory.set_cache("insights", user_id, data, settings.insights_cache_ttl, suffix=time_range)
    return data


# ── Achievements ─────────────────────────────────────────────────────────────

@app.get("/agent/achievements/{user_id}")
async def check_achievements(
    user_id: int,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)
    agent = registry.get("achievement_agent")
    result = await agent.run(user_id)
    return result.model_dump()


# ── Companion ────────────────────────────────────────────────────────────────

@app.get("/agent/companion/{user_id}")
async def get_companion_message(
    user_id: int,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)

    cached = await _memory.get_cache("companion", user_id)
    if cached:
        return cached

    agent = registry.get("companion")
    result = await agent.run(user_id)
    data = result.model_dump()

    # Cache companion message for 1 hour — it changes throughout the day
    await _memory.set_cache("companion", user_id, data, 3600)
    return data


# ── Habit Coach ──────────────────────────────────────────────────────────────

@app.get("/agent/habits/{user_id}")
async def get_habit_coaching(
    user_id: int,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)
    agent = registry.get("habit_coach")
    result = await agent.run(user_id)
    return result.model_dump()


# ── Focus Coach ──────────────────────────────────────────────────────────────

@app.get("/agent/focus/{user_id}")
async def get_focus_coaching(
    user_id: int,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)
    agent = registry.get("focus_coach")
    result = await agent.run(user_id)
    return result.model_dump()


# ── Event Webhook (called by Express on game events) ─────────────────────────

@app.post("/agent/event")
async def handle_event(
    event: GameEvent,
    x_internal_secret: str = Header(...),
):
    _require_internal(x_internal_secret)

    # Invalidate relevant caches when player state changes
    if event.event_type in ("task_complete", "level_up", "achievement_unlock"):
        await asyncio.gather(
            _memory.invalidate_cache("insights", event.user_id, suffix="30d"),
            _memory.invalidate_cache("companion", event.user_id),
        )

    if event.event_type == "focus_complete":
        await _memory.invalidate_cache("insights", event.user_id, suffix="30d")

    return {"status": "processed"}


# ── Admin ────────────────────────────────────────────────────────────────────

@app.get("/admin/metrics")
async def get_metrics(x_internal_secret: str = Header(...)):
    _require_internal(x_internal_secret)
    daily_cost = await _metrics.daily_cost()
    agent_stats = await _metrics.agent_stats()
    return {"daily_cost_usd": daily_cost, "agents": agent_stats}

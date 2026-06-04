"""
Lightweight cost and latency tracker stored in PostgreSQL.
Creates its own table on first use — no migration needed.
"""
from __future__ import annotations
import asyncpg

# Anthropic pricing (per million tokens) as of 2025
_COST_PER_1M = {
    "claude-haiku-4-5-20251001":  {"input": 0.80,  "output": 4.00},
    "claude-sonnet-4-6":           {"input": 3.00,  "output": 15.00},
    "claude-opus-4-8":             {"input": 15.00, "output": 75.00},
}

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS agent_metrics (
    id BIGSERIAL PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL,
    latency_ms INTEGER,
    tokens_used INTEGER,
    cost_usd NUMERIC(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

_CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_agent_metrics_name_created
    ON agent_metrics(agent_name, created_at)
"""


class MetricsTracker:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool
        self._ready = False

    async def setup(self) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE)
            await conn.execute(_CREATE_INDEX)
        self._ready = True

    def _estimate_cost(self, model: str, tokens: int) -> float:
        pricing = _COST_PER_1M.get(model, {"input": 3.00, "output": 15.00})
        # Approximate: treat all tokens at average of input+output price
        avg_per_token = (pricing["input"] + pricing["output"]) / 2 / 1_000_000
        return round(tokens * avg_per_token, 6)

    async def record(
        self, agent_name: str, latency_ms: int, tokens: int, model: str = ""
    ) -> None:
        if not self._ready:
            return
        cost = self._estimate_cost(model, tokens)
        try:
            await self._pool.execute(
                "INSERT INTO agent_metrics (agent_name, latency_ms, tokens_used, cost_usd) VALUES ($1, $2, $3, $4)",
                agent_name, latency_ms, tokens, cost,
            )
        except Exception:
            pass  # Never crash the agent because of metrics failure

    async def daily_cost(self) -> float:
        if not self._ready:
            return 0.0
        val = await self._pool.fetchval(
            "SELECT COALESCE(SUM(cost_usd), 0) FROM agent_metrics WHERE created_at > NOW() - INTERVAL '1 day'"
        )
        return float(val or 0)

    async def agent_stats(self) -> list[dict]:
        if not self._ready:
            return []
        rows = await self._pool.fetch(
            """
            SELECT agent_name,
                   COUNT(*) AS calls,
                   AVG(latency_ms) AS avg_latency_ms,
                   SUM(cost_usd) AS total_cost_usd
            FROM agent_metrics
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY agent_name
            ORDER BY total_cost_usd DESC
            """
        )
        return [dict(r) for r in rows]

# Life RPG Planner

> Turn your life into an epic adventure. Manage tasks, earn XP, level up — powered by a production AI agent ecosystem.

![Status](https://img.shields.io/badge/status-Active_Development-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)

---

## Overview

Life RPG Planner is a full-stack gamified productivity application with an integrated multi-agent AI system. Tasks become quests, deadlines trigger real consequences, and nine specialized AI agents provide personalized coaching, scheduling, and progress analysis.

**Three independent services work together:**

| Service | Stack | Port |
|---------|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 | 3000 |
| Backend API | Express.js, PostgreSQL, JWT | 5005 |
| AI Agent Service | FastAPI, Python 3.11+, Anthropic SDK | 8000 |

---

## Features

### Gamification
- **XP & Leveling** — earn XP by completing tasks; priority-scaled rewards (Critical: 75 XP, High: 50, Medium: 20, Low: 10)
- **Health System** — overdue tasks deal HP damage; task completions heal
- **Focus Timer** — Pomodoro-style sessions with dynamic XP rewards (`10 + duration × 0.5`)
- **Streaks** — consecutive daily activity tracking
- **Achievements** — 19 unlockable badges persisted to the database

### Task Management
- Dashboard with sortable active quest log
- Kanban board with drag-and-drop between To Do / In Progress / Done
- Calendar and timeline planner views
- Subtask system with completion progress
- Category tagging (Work, Health, Learning, Hobby, General)
- Priority levels with color-coded visual indicators

### AI Agent Ecosystem (9 agents)
- **Quest Advisor** — analyzes your backlog and builds a daily quest board; applies overdue health damage
- **Smart Planner** — generates an optimal daily schedule with time blocks based on priority and deadlines
- **Achievement Agent** — evaluates progress and unlocks earned achievements automatically
- **AI Companion** — personalized RPG mentor that greets you, alerts on risks, and celebrates wins
- **Habit Coach** — tracks habit streaks, identifies at-risk habits, recommends new habits for gap categories
- **Focus Coach** — identifies peak productive hours and optimal session duration from your history
- **Analytics Agent** — generates narrative productivity reports with trend analysis and actionable insights
- **Daily Quest Generator** — creates personalized daily/side/boss quests tailored to your level and category gaps
- **Game Balancer** — monitors XP economy health across users (admin/scheduled)

### Statistics
- Task completion trend chart
- Skill distribution radar (Willpower, Intellect, Vitality, Focus, Discipline)
- Activity heatmap (12-week GitHub-style grid)
- Peak hours bar chart
- Success rate tracking

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Next.js Frontend :3000              │
│  Dashboard · Board · Calendar · Planner · Stats  │
│  AgentChat (floating) · CompanionBadge           │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────┐
│           Express.js Backend :5005               │
│  /api/tasks  /api/stats  /api/habits             │
│  /api/achievements  /api/focus-sessions          │
│  /api/agent/* (proxy)                            │
└────────────┬────────────────────────────────────┘
             │ Internal (x-internal-secret)
┌────────────▼────────────────────────────────────┐
│         FastAPI Agent Service :8000              │
│  Orchestrator → intent classify → route          │
│  9 agents · Redis memory · cost tracking         │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│              PostgreSQL :5432                    │
│  12 tables · 8 indexes · cascade deletes         │
└─────────────────────────────────────────────────┘
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Authentication |
| `tasks` | Quest log |
| `subtasks` | Task breakdown |
| `player_stats` | XP, level, health, focus totals |
| `focus_sessions` | Completed Pomodoro sessions |
| `habits` | Recurring habit definitions + streaks |
| `habit_checkins` | Individual check-in records |
| `daily_quests` | Agent-generated daily quest board |
| `user_achievements` | Persisted achievement unlocks |
| `user_preferences` | Timezone, difficulty, companion name |
| `events` | Gamification audit log |
| `agent_conversations` | Chat history per user |

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Node.js | 18+ | Required for backend and frontend |
| PostgreSQL | 14+ | Must be running locally |
| Python | 3.11+ | Required for AI agent service |
| Git | any | For cloning |
| Anthropic API key | — | Required for live AI responses; get one at [console.anthropic.com](https://console.anthropic.com) |

> **Redis is optional.** The agent service runs without it using an in-process fallback. Install Redis for persistent conversation history across restarts.

---

## Setup & Running

### Run locally (Docker)

Starts Postgres, the backend and the frontend with one command (requires Docker with Compose).

```bash
cp .env.example .env        # then edit .env; generate secrets with: openssl rand -hex 32
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:5005/api/health
- Logs: `docker compose logs -f backend`
- Stop: `docker compose down` (add `-v` to also wipe the database volume)

The external AI agent service is not included; `/api/agent/*` returns a 503 fallback and the UI degrades gracefully. `NEXT_PUBLIC_API_URL` is baked in at build time, so rebuild (`--build`) after changing it.

Prefer a manual setup? Follow the steps below.

### 1. Clone the repository

```bash
git clone https://github.com/Sammoo-25/Planner.git
cd Planner
```

---

### 2. Backend (Express + PostgreSQL)

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planer
JWT_SECRET=your-secret-key-here
PORT=5005
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=your-internal-secret-here
```

> **Note:** The database name is `planer` (intentional single-n) — must match your PostgreSQL database name.

Create the PostgreSQL database:

```sql
CREATE DATABASE planer;
```

Start the backend (auto-creates all tables on first run):

```bash
npm run dev
```

Verify: `curl http://localhost:5005/api/health` → `{"status":"OK"}`

---

### 3. Frontend (Next.js)

```bash
cd task-tracker
npm install
```

Create `task-tracker/.env.local` (optional — defaults shown):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5005/api
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### 4. AI Agent Service (FastAPI)

```bash
cd ai-agents
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `ai-agents/.env` (copy from `.env.example`):

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/planer
REDIS_URL=redis://localhost:6379
EXPRESS_API_URL=http://localhost:5005/api
JWT_SECRET=your-secret-key-here
AGENT_SERVICE_SECRET=your-internal-secret-here
AGENT_SERVICE_PORT=8000
```

> The `JWT_SECRET` and `AGENT_SERVICE_SECRET` must match the values in `backend/.env`.

Start the agent service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify: `curl http://localhost:8000/health`

Expected response:
```json
{
  "status": "ok",
  "agents": [
    "quest_advisor", "smart_planner", "achievement_agent", "companion",
    "habit_coach", "focus_coach", "analytics_agent", "quest_generator", "game_balancer"
  ]
}
```

---

### All three services running

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:3000 | App loads |
| Backend health | http://localhost:5005/api/health | `{"status":"OK"}` |
| Agent health | http://localhost:8000/health | 9 agents listed |

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | Yes | Database host (usually `localhost`) |
| `DB_PORT` | Yes | Database port (usually `5432`) |
| `DB_NAME` | Yes | Must be `planer` |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | API port (default: `5005`) |
| `DATABASE_URL` | No | Full connection string — overrides individual DB_* vars in production |
| `AGENT_SERVICE_URL` | No | Agent service URL (default: `http://localhost:8000`) |
| `AGENT_SERVICE_SECRET` | Yes | Shared secret for backend ↔ agent communication |

### `ai-agents/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — get one at console.anthropic.com |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Must match backend JWT_SECRET |
| `AGENT_SERVICE_SECRET` | Yes | Must match backend AGENT_SERVICE_SECRET |
| `EXPRESS_API_URL` | No | Backend URL (default: `http://localhost:5005/api`) |
| `REDIS_URL` | No | Redis URL (default: `redis://localhost:6379`) |
| `AGENT_SERVICE_PORT` | No | Agent service port (default: `8000`) |

---

## Development Commands

### Frontend

```bash
cd task-tracker
npm run dev        # Dev server with hot reload
npm run build      # Production build
npm run lint       # ESLint
```

### Backend

```bash
cd backend
npm run dev        # nodemon with auto-reload
npm start          # Production
```

### AI Agents

```bash
cd ai-agents

# Start service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run full test suite (109 infra tests + 45 browser tests)
python test_suite.py

# Browser E2E tests (requires all services running)
node ../test_app.js
```

---

## AI Agent Architecture

### Adding a New Agent

1. Create `ai-agents/agents/my_agent.py`:

```python
from agents.base import BaseAgent
from config import settings

class MyAgent(BaseAgent):
    name = "my_agent"
    description = "What this agent does"
    model = settings.model_fast          # haiku for speed, model_smart for reasoning
    system_prompt_file = "my_agent.txt"  # in ai-agents/prompts/

    async def run(self, user_id: int, **kwargs):
        data = await get_user_tasks(self.pool, user_id)
        raw, _ = await self._call_llm([{"role": "user", "content": str(data)}])
        return MyOutputSchema.model_validate_json(raw)
```

2. Create `ai-agents/prompts/my_agent.txt` with the system prompt.

3. In `ai-agents/main.py`, add two lines inside `lifespan()`:

```python
from agents.my_agent import MyAgent
# ...
registry.register(MyAgent)          # in the registration block
```

4. Optionally add a FastAPI endpoint and an Express proxy route in `backend/server.js`.

That's the entire extension surface.

### Intent Routing (Orchestrator)

The orchestrator classifies user messages into one of 10 intents using a fast Haiku call, then routes to the appropriate agent:

| Intent | Agent |
|--------|-------|
| `quest_board` | Quest Advisor |
| `schedule` | Smart Planner |
| `insights` | Analytics Agent |
| `achievements` | Achievement Agent |
| `habit_check` | Habit Coach |
| `focus_advice` | Focus Coach |
| `create_task` / `update_task` | NL Interface (via Quest Advisor) |
| `chat` | AI Companion |

---

## Project Structure

```
Planner/
├── backend/                  # Express.js API
│   ├── server.js             # All routes (single file)
│   ├── db.js                 # DB init + schema (CREATE IF NOT EXISTS)
│   └── package.json
│
├── task-tracker/             # Next.js frontend
│   ├── app/                  # Page routes (App Router)
│   │   ├── page.tsx          # Dashboard
│   │   ├── planner/          # Timeline planner
│   │   ├── board/            # Kanban board
│   │   ├── calendar/         # Calendar view
│   │   └── stats/            # Analytics
│   ├── components/
│   │   ├── agent/            # AI chat widget, companion badge, quest board, insights
│   │   ├── dashboard/        # Task items, focus modal, XP notifier
│   │   └── ui/               # Radix UI primitives
│   ├── context/              # AuthContext, TaskContext, GamificationContext,
│   │   │                     # FocusContext, AgentContext
│   ├── hooks/                # useQuestManager, useGamification, useTasks, useSettings
│   ├── lib/api.ts            # Single HTTP client (all API calls)
│   └── types/index.ts        # Shared TypeScript types
│
├── ai-agents/                # FastAPI AI service
│   ├── main.py               # FastAPI app, lifespan, all endpoints
│   ├── config.py             # Settings via pydantic-settings
│   ├── agents/               # 9 agent implementations + registry + base
│   ├── orchestrator/         # Intent classification + routing
│   ├── tools/                # db_tools, analytics_tools, api_tools
│   ├── memory/               # Redis session memory (in-process fallback)
│   ├── schemas/              # Pydantic input/output models
│   ├── prompts/              # System prompt .txt files (one per agent)
│   ├── monitoring/           # Cost + latency tracking
│   ├── requirements.txt
│   └── .env.example
│
├── test_app.js               # Playwright E2E browser tests
└── .gitignore
```

---

## Production Deployment

### Frontend
Deploy `task-tracker/` to Netlify or Vercel. The included `netlify.toml` sets `base = "task-tracker"`.

Set the environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### Backend
Deploy `backend/` to any Node.js host (Railway, Render, Fly.io). Set `DATABASE_URL` and all other env vars. The schema auto-creates on startup.

### AI Agent Service
Deploy `ai-agents/` to a Python host (Railway, Render, or any Docker-capable host). Requires PostgreSQL access and an Anthropic API key. Redis is optional.

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Author

**Sammoo-25** · [github.com/Sammoo-25](https://github.com/Sammoo-25)

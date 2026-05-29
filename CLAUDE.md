# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Life RPG Planner** — a gamified task management app (quests, XP, leveling, focus sessions). Three independent services: Next.js frontend, Express.js backend, and a Python AI agent pipeline.

---

## Commands

### Frontend (`task-tracker/`)
```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (`backend/`)
```bash
npm run dev      # nodemon dev server at localhost:5005
npm start        # Production server
```

### AI Agents (`ai-agents/`)
```bash
python orchestrator.py --project /path/to/Planner
python orchestrator.py --project /path/to/Planner --agents analyzer bugfix
python orchestrator.py --project /path/to/Planner --skip-agents feature
```

There is **no test suite** in any service.

---

## Environment Variables

### `backend/.env`
```
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planer          # intentional misspelling — must match PostgreSQL DB name
JWT_SECRET=supersecretkey123
PORT=5005
DATABASE_URL=           # optional — overrides DB_* vars in production
```

### Frontend (set in hosting/shell)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:5005/api   # defaults to this if unset
```

### `ai-agents/.env` (copy from `.env.example`)
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Root `.env`
```
ANTHROPIC_API_KEY=      # for local AI agent testing
```

---

## Architecture

### Service Boundaries
- **Frontend** (`task-tracker/`) — Next.js App Router, React 19, TypeScript, Tailwind CSS v4
- **Backend** (`backend/`) — Express.js, PostgreSQL via raw SQL (`pg` driver), CommonJS
- **AI Agents** (`ai-agents/`) — Python, Anthropic SDK, sequential orchestration

Netlify deploys only the frontend (`netlify.toml` sets `base = "task-tracker"`). The backend is a separate service requiring its own host and a PostgreSQL database named `planer`.

### Frontend State Model
Four nested React Contexts in `layout.tsx` (outermost to innermost):
`AuthContext` → `TaskContext` → `GamificationContext` → `FocusContext`

Each context has a companion hook (`useAuth`, `useTasks`, `useGamification`, `useFocus`). All API calls go through `lib/api.ts`, which injects the JWT from localStorage and redirects to `/signin` on 401/403.

**Gamification loop:** completing a task calls `addExp(xpAmount)` in `GamificationContext`. XP accumulates; `maxExp` is calculated per level via `hero-rank-utils.ts`. Stats sync to `player_stats` table in the backend.

### Backend
All routes live in `backend/server.js` (single file). Key route groups:
- `/api/signup`, `/api/signin` — auth, returns JWT (1h expiry, no refresh token)
- `/api/tasks`, `/api/tasks/:id` — CRUD, owner-scoped by `user_id` from JWT
- `/api/subtasks` — CRUD, parent task must belong to authenticated user
- `/api/stats` — read/write `player_stats` row (one per user)
- `/api/focus-sessions` — POST to record a completed session

`authenticateToken` middleware runs on all non-auth routes, attaches `req.user`.

The database schema is auto-created on startup via `db.js` (`CREATE TABLE IF NOT EXISTS`). There is no migration system — schema changes must be made carefully to avoid breaking existing tables.

### AI Agent Pipeline
`orchestrator.py` runs four agents sequentially: **Analyzer → BugFix → Feature → Review**. Each agent inherits from `BaseAgent`, implements `build_prompt()`, and receives a shared `context` dict. System prompts are `.txt` files in `prompts/`. Output reports are saved as `.md` + `.json` in `reports/` (git-ignored). Model: `claude-sonnet-4-6`, max_tokens: 4096.

### Type Definitions
All shared frontend types are in `task-tracker/types/index.ts`: `Task`, `PlayerStats`, `Achievement`, `FocusSession`. Backend returns camelCase field names (mapped from snake_case in SQL). The backend has no TypeScript.

---

## Key Constraints

- **JWT tokens expire in 1 hour** with no refresh mechanism — users can be silently logged out mid-session.
- **`DB_NAME=planer`** — this intentional misspelling is baked into both the backend env and the auto-create SQL; don't "fix" it without migrating the actual database.
- **CORS is fully open** (`cors()` with no origin restriction) — don't assume it is locked down.
- **No input validation library** — backend uses manual checks only; no Zod, Joi, or express-validator.
- The `Planner/` directory at root is a legacy nested copy of the repo — ignore it.

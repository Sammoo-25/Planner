# CLAUDE.md — Life RPG Planner

Gamified task manager: quests, XP/levels, health, focus sessions, AI features (served entirely by the external agent service).
This repo holds the frontend and backend. The AI agent service is optional and external (not in this repo; not decided yet).

## Stack
- **Frontend** `task-tracker/`: Next 16.1.1, React 19.2.3, TypeScript 5, Tailwind 4, zustand 5, ESLint 9.
- **Backend** `backend/`: Express 5, CommonJS, `pg` 8 (raw SQL), jsonwebtoken 9, bcryptjs 3.
- **Database**: PostgreSQL (12 tables, created on boot). **Root**: Playwright devDependency (E2E only).
- **Node**: 24 LTS (`.nvmrc`, `engines` in every `package.json`, `NODE_VERSION` in `netlify.toml`).
- **Hosting**: frontend on Netlify (`netlify.toml`, base `task-tracker`). Backend host: decide later.

## Commands
```bash
# Frontend (task-tracker/)
npm run dev        # http://localhost:3000
npm run build && npm start   # production build + serve
npm run lint

# Backend (backend/)
npm run dev        # nodemon, http://localhost:5005   (npm start: no reload)

# Whole stack (repo root; needs .env from .env.example)
docker compose up -d --build   # :3000 web, :5005 api, Postgres
docker compose logs -f backend; docker compose down   # down -v wipes DB

# E2E (repo root; frontend must be running on :3000)
node test_app.js
```
- Backend `npm test` is a placeholder that exits 1. No unit test suite exists. No migrations: `backend/db.js` creates tables on boot.

## Layout
- `backend/server.js` — all routes, mounted at `/api`. `backend/db.js` — pool and schema.
- `task-tracker/app/` — pages (dashboard `page.tsx`, board, calendar, planner, settings, signin, signup, stats).
- `task-tracker/context/` — Auth → Task → Gamification → Focus → Agent providers (`app/layout.tsx`).
- `task-tracker/lib/api.ts` — single HTTP client; injects JWT, redirects to `/signin` on 401/403.
- `task-tracker/types/index.ts` — shared types. `task-tracker/components/agent/` — AgentChat, CompanionBadge, DailyQuestBoard, InsightsPanel.

## Environment variables (names and defaults only; values go in root `.env` for compose or `backend/.env` for bare npm; both gitignored)
- **Backend**: `PORT` (5005), `JWT_SECRET`, `DATABASE_URL` or `DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`/`DB_NAME`, `AGENT_SERVICE_URL` (`http://localhost:8000`), `AGENT_SERVICE_SECRET`.
- **Frontend**: `NEXT_PUBLIC_API_URL` (`http://127.0.0.1:5005/api`).
- Compose reads root `.env` (see `.env.example`); it uses `DB_*`, not `DATABASE_URL` (no local SSL).

## Gotchas
- **AI service is optional and external.** `/api/agent/*` proxies to a FastAPI service on :8000 not in this repo. When it is down, the backend returns 503 `{fallback: true}` — expected, the UI degrades. Do not add LLM calls here.
- **Netlify needs `NEXT_PUBLIC_API_URL`.** `netlify.toml` doesn't set it, and `lib/api.ts` falls back to `http://127.0.0.1:5005/api`, which breaks in prod. It's inlined at build time, so set it in Netlify site env vars (Builds scope) and redeploy after changing it.
- **DB name is intentionally misspelled.** `db.js` creates database `planer` (hardcoded) but creates tables in `DB_NAME`. Keep `DB_NAME=planer`. `DATABASE_URL` enables SSL with `rejectUnauthorized: false`; the `DB_*` path uses no SSL.
- **Unauthenticated routes:** `POST /api/events` (guarded only by `x-internal-secret` = `AGENT_SERVICE_SECRET`) and `GET /api/health`.
- **Auth:** JWT expires in 1h with no refresh, so users can be logged out mid-session. Middleware also checks the user still exists.
- **CORS** is fully open (`cors()`, no origin restriction). No input validation library; manual checks only.
- **`test_app.js` is not a reliable gate.** It hardcodes a Windows screenshot path, runs headed, creates real signups, and many checks pass unconditionally.
- **No CI yet.** Docker Compose exists for local runs.

## AI budget
n/a — Planer makes no LLM calls.

## Unknowns / TODO
- `ai-agents/` service: not decided (keep it optional).
- Backend hosting target: decide later.
- Whether `NEXT_PUBLIC_API_URL` is set in Netlify. Keep prod hostnames out of this file.

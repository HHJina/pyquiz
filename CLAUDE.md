# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PyQuiz is a full-stack Python interview prep platform. Users select a category/difficulty/count, the backend generates questions via Google Gemini AI, and Gemini also evaluates free-form answers to produce per-question scores and feedback.

**Deployment:** Backend → Railway, Frontend → Vercel (Vercel rewrites `/api/*` to Railway).

## Development Setup

### Backend (Django + DRF)

```bash
cd backend
uv sync
cp .env.example .env          # fill in DJANGO_SECRET_KEY, GEMINI_API_KEY
uv run python manage.py migrate
uv run python manage.py runserver   # http://localhost:8000
```

Required env vars (`backend/.env`):
- `DJANGO_SECRET_KEY`
- `GEMINI_API_KEY` — Google Gemini 1.5 Flash
- `DEBUG`
- `CORS_ALLOWED_ORIGINS` — comma-separated frontend URLs
- `DATABASE_URL` — PostgreSQL in production; SQLite used locally

### Frontend (Next.js 14)

```bash
cd frontend
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                   # http://localhost:3000
```

## Common Commands

### Backend

| Task | Command |
|------|---------|
| Lint | `uv run ruff check .` |
| Run tests | `uv run pytest` |
| Single test | `uv run pytest path/to/test_file.py::test_name` |
| Make migrations | `uv run python manage.py makemigrations` |

### Frontend

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Production build | `npm run build` |

## Architecture

### Backend (`backend/`)

- `config/` — Django project settings, URL root, WSGI/ASGI
- `quiz/` — single Django app containing all business logic
  - `models.py` — `Question`, `QuizSession`, `QuizAnswer`, `LeaderboardEntry`
  - `views.py` — DRF APIViews for all endpoints
  - `ai_service.py` — Gemini calls: question generation + answer evaluation
  - `serializers.py` — DRF serializers
  - `urls.py` — app-level URL routing

**API endpoints:**
- `POST /api/quiz/generate/` — creates a `QuizSession`, generates questions via Gemini
- `POST /api/quiz/answer/` — evaluates a submitted answer, updates `QuizAnswer`
- `POST /api/quiz/complete/` — finalises session, optional leaderboard entry
- `GET /api/leaderboard/` — top 20 entries, filterable by category/difficulty
- `GET /api/health/` — health check

**Scoring:** Gemini returns a `score_ratio` (0–1); backend maps it to points: 10/20/30 × score_ratio depending on difficulty.

### Frontend (`frontend/src/`)

- `app/` — Next.js App Router pages: `/` (setup), `/quiz` (questions), `/quiz/result` (score), `/leaderboard`
- `store/` — Zustand store (`useQuizStore`) holds `sessionKey`, `questions`, `currentIndex`, `totalScore`, `history`
- `components/` — shared UI components
- `lib/api.ts` — Axios instance; all API calls go through here

**Quiz flow:** Home → `POST /generate` → Quiz page loops `POST /answer` per question → `POST /complete` → Result page → optional leaderboard.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push to `main`/`develop`:
1. Backend: `ruff check`, migration consistency check, `pytest`
2. Frontend: `npm run lint`, `npm run build`

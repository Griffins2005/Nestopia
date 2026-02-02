# Nestopia

Nestopia is a full-stack rental housing platform that matches renters with landlords using preference-based compatibility scoring. It supports role-based accounts, listing management, and daily matching with optional ML enhancements.

## Documentation

- [`frontend/README.md`](frontend/README.md) — Frontend architecture, directory layout, and build details
- [`backend/README.md`](backend/README.md) — Backend architecture, directory layout, API notes, and runtime details
- [`PROJECT_TECHNICAL_OVERVIEW.md`](PROJECT_TECHNICAL_OVERVIEW.md) — Technical documentation, decisions, and tradeoffs

## Technology Stack

- **Frontend**: React 19, React Router, Vite, Axios
- **Backend**: FastAPI, SQLAlchemy, Alembic, Celery, Redis
- **Data**: PostgreSQL

## Quickstart

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` and set required variables. Use `backend/README.md` for the full list and defaults.

Run migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Create `.env.local` with the API base URL. See `frontend/README.md` for full details.

## Deployment Notes

Use `PROJECT_TECHNICAL_OVERVIEW.md` for deployment topology, background workers, and production tradeoffs. The backend is intended to run behind a reverse proxy, and the frontend is deployed as a static build from Vite (`dist/`).

If you are not running Celery, daily matches will not be computed. Core listing and profile workflows remain functional.

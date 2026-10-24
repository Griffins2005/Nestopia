# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

Nestopia is a full-stack rental housing platform: **FastAPI backend** (Python) + **React frontend** (JavaScript).

- **Backend**: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload` (port 8000)
- **Frontend**: `cd frontend && npm start` (port 3000, proxies API calls to backend via `package.json` proxy setting)
- **Redis/Celery**: Optional; only needed for background matching jobs

Standard commands for lint/test/build are documented in the project `README.md`.

### Non-obvious caveats

- **SQLite for dev**: Set `DATABASE_URL=sqlite:///dev.db` in `backend/.env` to avoid requiring PostgreSQL. The session layer auto-detects SQLite vs Postgres. A fresh `dev.db` is created on startup via `Base.metadata.create_all()`.
- **bcrypt/passlib compatibility**: `bcrypt>=5.0` is incompatible with `passlib 1.7.4`. Pin `bcrypt<5` (e.g. `bcrypt==4.2.1`) or password hashing will fail with "password_too_long" errors.
- **Google OAuth placeholders**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required env vars (no defaults). Use placeholder values in `.env` for local dev if you only need email/password auth.
- **Listing creation requires user name**: The `LandlordOut` schema rejects `None` for the `name` field. After signup, update the user profile name via `PATCH /api/users/me` before creating listings, or listing serialization will fail with a 500 error.
- **No test suites**: The repository has no existing backend or frontend tests. `pytest` and `npm test` both report no tests found.
- **Frontend proxy**: `package.json` sets `"proxy": "http://localhost:8000"` so API calls from the React dev server are forwarded to the backend automatically.

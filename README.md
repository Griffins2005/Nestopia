# Nestopia

Nestopia is a full-stack rental housing platform that matches renters with landlords based on housing preferences, property features, and per-listing tenant requirements. Compatibility is shown as a percentage on listings, detail pages, and a daily matches feed.

**Live:** [nestopia-rental.vercel.app](https://nestopia-rental.vercel.app) · API: `https://nestopia-production.up.railway.app`

## Quick start

### Backend (SQLite, local)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000` · Docs: `/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

App: `http://localhost:3000` — CRA proxies `/api` to port 8000. No `.env` needed locally.

Copy `frontend/.env.example` → `frontend/.env` only if you need overrides (e.g. Stripe keys).

## Architecture

```
Browser (React)  →  /api/* proxy (dev)  →  FastAPI
                         ↓
              PostgreSQL or SQLite
              uploads/ (images, profile pics)
              Redis + Celery (optional daily matching jobs)
```

| Layer | Stack |
|-------|--------|
| Frontend | React 19, React Router 7, Axios + httpOnly cookies, Leaflet/OSM |
| Backend | FastAPI, SQLAlchemy, Alembic, Authlib (Google OAuth), optional Celery |

## Features

- **Auth** — email/password, Google OAuth, roles (renter/landlord), TOTP 2FA, httpOnly session cookie
- **Renter preferences** — budget, locations (OSM), move-in window, amenities, lifestyle fields → **property fit**
- **Listings** — CRUD, photos, geocoding; **per-listing tenant requirements** → **tenant fit**
- **Compatibility** — 72% property fit + 28% tenant fit; breakdown on cards and detail pages
- **Matches** — `/matches` daily ranked feed for renters with preferences set
- **Applications** — contact host → rental application workflow with tours and move-in
- **Maps** — browse map, mini-map, Nominatim search via backend proxy

Tenant requirements are **listing-specific** (not global landlord prefs).

## Project structure

```
Nestopia/
├── backend/          # FastAPI — app/, alembic/, Dockerfile, railway.toml
├── frontend/         # React — src/, vercel.json
├── backend/.env.example
└── frontend/.env.example
```

## Frontend routes

| Route | Description |
|-------|-------------|
| `/`, `/login`, `/signup` | Home, auth |
| `/onboarding` | Renter prefs or landlord → create listing |
| `/listings`, `/listing/:id` | Browse + detail (match %, tenant requirements) |
| `/listing/new`, `/listing/edit/:id` | Landlord listing form |
| `/matches`, `/saved`, `/preferences` | Matches, saved homes, edit prefs |
| `/profile`, `/users/:id` | Profile, activity, security; public profiles |

## Environment

| File | Use |
|------|-----|
| `backend/.env.example` | Copy to `backend/.env` for local dev; production vars go in **Railway** |
| `frontend/.env.example` | Optional local overrides; production: **Vercel** `REACT_APP_API_BASE_URL` |

Never commit `.env` files.

### Production (Railway + Vercel)

**Railway** (root directory `backend`, PostgreSQL required):

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<random 32+ chars>
SESSION_SECRET_KEY=<random 32+ chars>
FRONTEND_URL=https://nestopia-rental.vercel.app
CORS_ORIGINS=https://nestopia-rental.vercel.app
API_PUBLIC_URL=https://nestopia-production.up.railway.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://nestopia-production.up.railway.app/api/auth/google/callback
```

Use `backend/Dockerfile` + `backend/railway.toml`. Clear custom start commands. After deploy: `alembic upgrade head`.

**Vercel** (root directory `frontend`):

```env
REACT_APP_API_BASE_URL=https://nestopia-production.up.railway.app
```

**Google OAuth** — JavaScript origins: Vercel URL + `http://localhost:3000`. Redirect URI on the **API**: `/api/auth/google/callback`.

## API overview

Prefix: `/api`. Session cookie: `nestopia_session`. Full interactive docs at `/docs`.

| Area | Key endpoints |
|------|----------------|
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/logout`, `GET /auth/google/login` |
| Users | `GET/PATCH /users/me`, profile upload, public `/users/profile/{id}` |
| Preferences | `GET/POST /preferences/renter` |
| Listings | `GET/POST/PUT/DELETE /listings`, saved, upload-image |
| Matches | `GET /matches/daily` |
| Applications | activity feed, contact, tours, accept/reject |
| Geo | `GET /geo/search?q=…` |

## Database

PostgreSQL in production; SQLite for local dev (tables auto-created on startup).

```bash
cd backend && alembic upgrade head
```

## Testing

```bash
cd backend && pytest
cd frontend && npm test
```

## Optional: Celery + Redis

```bash
redis-server
cd backend
celery -A celery_app.celery worker -l info
celery -A celery_app.celery beat -l info
```

Set `USE_ML_MATCHING=true` only if workers are running.

## Security notes

- Rotate secrets in production; use HTTPS cookies (`COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` for split deploy)
- Do not commit `.env`, `nestopia_dev.db`, or `uploads/`
- Plan object storage for uploads on PaaS (local disk is ephemeral)

## Known limitations

- Semantic matching needs heavy optional ML deps
- Minimal test coverage
- Payment/wallet/blockchain routers exist but are not wired in the UI

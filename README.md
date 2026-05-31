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
├── frontend/         # React — src/api/endpoints.js = canonical API paths
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
UPLOADS_DIR=/data/uploads
```

**Persistent uploads (Railway volume — no third-party storage):**

1. Railway project → your API service → **Volumes** → **Add volume**
2. Set **Mount path** to `/data/uploads`
3. Ensure `UPLOADS_DIR=/data/uploads` (set in Dockerfile by default; optional in Variables)
4. Redeploy, then re-upload listing photos / profile pics once (files from before the volume are gone)

Use `backend/Dockerfile` + `backend/railway.toml`. Clear custom start commands. After deploy: `alembic upgrade head`.

**Vercel** (root directory `frontend`):

```env
REACT_APP_API_BASE_URL=https://nestopia-production.up.railway.app
```

Include `https://` — without it, requests incorrectly go to `vercel.app/nestopia-production...` and return **405**.

**Google OAuth** — JavaScript origins: Vercel URL + `http://localhost:3000`. Redirect URI on the **API**: `/api/auth/google/callback`.

### After deploy — verify

```bash
curl https://nestopia-production.up.railway.app/health
curl -sI -X OPTIONS 'https://nestopia-production.up.railway.app/api/listings/' \
  -H 'Origin: https://nestopia-rental.vercel.app' \
  -H 'Access-Control-Request-Method: GET'
# Expect: access-control-allow-origin: https://nestopia-rental.vercel.app
```

In the browser (DevTools → Network):

1. API calls go to `https://nestopia-production.up.railway.app/...` (not under `vercel.app/...`)
2. `POST /api/auth/login` → 200, then `GET /api/users/me` → 200
3. `PATCH /api/users/me` → 200 when saving profile
4. Cookie `nestopia_session` appears under the Railway domain after login

## API reference

All routes use prefix `/api` unless noted. Session cookie: `nestopia_session`. Interactive docs: `/docs` on the backend.

Canonical frontend paths live in `frontend/src/api/endpoints.js` — keep in sync with `backend/app/routers/`.

### Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Create account |
| POST | `/login` | Email login (may return 2FA challenge) |
| POST | `/verify-2fa` | Complete login with TOTP |
| POST | `/logout` | Clear session |
| GET | `/session` | Check session |
| POST | `/password-reset/request` | Request reset token |
| POST | `/password-reset/confirm` | Set new password |
| GET | `/google/login` | Start Google OAuth |
| GET | `/google/callback` | Google OAuth callback (API host) |

### Users (`/api/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user |
| PATCH | `/me` | Update profile |
| GET | `/profile/{id}` | Public profile (optional auth) |
| POST | `/profile/{id}/reviews` | Submit review |
| POST | `/upload-profile-doc` | Profile photo upload |
| POST | `/change-password` | Change password |
| POST | `/link-wallet` | Link wallet address |

### Preferences (`/api/preferences`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/renter` | Renter housing preferences |
| GET/POST | `/landlord` | Legacy landlord prefs |

### Listings (`/api/listings`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/`, `` | List listings (optional auth, match scores for renters) |
| POST | `/` | Create listing (landlord) |
| GET | `/owned` | Landlord's listings |
| GET | `/{id}` | Listing detail |
| PUT | `/{id}` | Update listing |
| DELETE | `/{id}` | Delete listing |
| POST | `/upload-image` | Upload listing image |
| GET | `/saved/` | Saved listings |
| POST/DELETE | `/saved/{id}` | Save / unsave |

### Matches, applications, geo, security, stats

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/matches/daily` | Daily ranked matches (renter) |
| GET | `/api/applications/activity` | Activity feed |
| POST | `/api/applications/from-contact` | Apply from listing contact |
| POST | `/api/applications/{id}/*` | Withdraw, accept, reject, tours, move-in |
| GET | `/api/geo/search` | Location search (Nominatim proxy) |
| GET | `/api/security/status` | 2FA status |
| POST | `/api/security/totp/*` | TOTP setup, confirm, disable |
| GET | `/api/stats/summary` | Platform stats |

### Optional (not wired in main UI)

Payments (`/api/payments`), tokens (`/api/tokens`), wallet (`/api/wallet`), blockchain (`/api/blockchain`).

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
- On Railway, attach a volume at `/data/uploads` so uploads survive redeploys (see Production section)

## Known limitations

- Semantic matching needs heavy optional ML deps
- Minimal test coverage
- Payment/wallet/blockchain routers exist but are not wired in the UI

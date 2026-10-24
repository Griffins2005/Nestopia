# Nestopia

Nestopia is a full-stack rental housing platform that matches renters with landlords based on housing preferences, property features, and per-listing tenant requirements. Compatibility is shown as a percentage on listings, detail pages, and a daily matches feed.

**Live:** [nestopia-rental.vercel.app](https://nestopia-rental.vercel.app) · API: Render web service (`nestopia-api`, see Production)

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
├── backend/          # FastAPI — app/, alembic/, Dockerfile
├── render.yaml       # Render Blueprint (free API + free Postgres)
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
| `backend/.env.example` | Copy to `backend/.env` for local dev; production vars go in **Render** |
| `frontend/.env.example` | Optional local overrides; production: **Vercel** `REACT_APP_API_BASE_URL` |

Never commit `.env` files.

### Production (Render + Vercel)

The API runs as a **free Render web service**. Vercel stays the frontend host. No payment method is required.

`render.yaml` at the repo root defines:

- Web service `nestopia-api` on the free plan — Docker build from `backend/`, health check `/health`. On an empty database, `start.sh` creates tables from the models and stamps Alembic at head. Later deploys run new Alembic revisions.
- Postgres `nestopia-db` on the free plan

Free-tier limits:

- The API sleeps after 15 minutes with no traffic. The next request takes about a minute while it wakes up.
- Photos and profile pictures live on the instance filesystem and disappear when the service sleeps or redeploys. Accounts and listings stay in Postgres.
- The free database expires 30 days after creation. Render then gives 14 days to upgrade before it deletes the data.
- A workspace gets 750 free instance hours per month. Sleeping time does not count.

**Deploy**

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com), choose **New → Blueprint** and select the repo. Do not add a card.
3. When prompted, paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (leave them blank only if you are not using Google login).
4. Apply the Blueprint. Render creates the API and database and sets `DATABASE_URL`, `SECRET_KEY`, and `SESSION_SECRET_KEY`.
5. Open the `nestopia-api` service and copy its URL, for example `https://nestopia-api.onrender.com`.

The database and uploads start empty. Sign up again. Re-upload photos after the service has been asleep or redeployed.

**Vercel** (root directory `frontend`). `REACT_APP_*` is baked in at build time, so change the variable and redeploy:

```env
REACT_APP_API_BASE_URL=https://nestopia-api.onrender.com
```

Include `https://`. Without it, the browser requests `vercel.app/nestopia-api...` and gets **405**.

**Google OAuth** — JavaScript origins: the Vercel URL and `http://localhost:3000`. Authorized redirect URI: `https://<your-onrender-host>/api/auth/google/callback`. The API builds that callback from `RENDER_EXTERNAL_URL` when `GOOGLE_REDIRECT_URI` is unset.

### After deploy — verify

```bash
curl https://nestopia-api.onrender.com/health
curl -sI -X OPTIONS 'https://nestopia-api.onrender.com/api/listings/' \
  -H 'Origin: https://nestopia-rental.vercel.app' \
  -H 'Access-Control-Request-Method: GET'
# Expect: access-control-allow-origin: https://nestopia-rental.vercel.app
```

In the browser (DevTools → Network):

1. API calls go to `https://nestopia-api.onrender.com/...` (not under `vercel.app/...`)
2. `POST /api/auth/login` → 200, then `GET /api/users/me` → 200
3. `PATCH /api/users/me` → 200 when saving profile
4. Cookie `nestopia_session` appears under the Render domain after login

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

PostgreSQL in production; SQLite for local dev. Both create tables from the SQLAlchemy models on startup. The checked-in Alembic revisions alter an older schema, so they are applied only after that schema already exists.

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
- On Render free, `/data/uploads` is wiped when the service sleeps or redeploys (see Production section)

## Known limitations

- Semantic matching needs heavy optional ML deps
- Minimal test coverage
- Payment/wallet/blockchain routers exist but are not wired in the UI

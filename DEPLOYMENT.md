# Deploying Nestopia (monorepo)

## How this works (read this first)

You have **one GitHub repo** with two folders. You create **two separate projects** on **two platforms** — not two copies of the whole repo on Railway.

```
GitHub: Nestopia/
├── frontend/   →  Vercel project #1   (Root Directory: frontend)
└── backend/    →  Railway project #1  (Root Directory: backend)
```

| What | Where | How many deploys |
|------|--------|------------------|
| React UI | **Vercel** | 1 Vercel project |
| FastAPI API | **Railway** (or Render) | 1 Railway service |

You do **not** deploy the monorepo twice on Railway. Railway only runs the **backend**. Vercel only runs the **frontend**. Both connect to the same GitHub repo; each platform is told which subfolder to use.

After both are live, the frontend calls the backend via `REACT_APP_API_BASE_URL`.

---

## Why not Vercel for the backend?

Vercel is built for **static sites** (your React build) and **short-lived serverless functions**. Nestopia’s API is different:

| Nestopia backend needs | Vercel serverless |
|------------------------|-------------------|
| Always-on Python process (FastAPI) | Functions spin up per request, time limits |
| PostgreSQL connection pool | Cold starts, connection limits |
| File uploads to `uploads/` | Ephemeral filesystem — files disappear |
| HttpOnly session cookies + CORS | Possible but awkward cross-domain |
| Optional Celery + Redis workers | Not supported on Vercel |

You *could* force FastAPI onto Vercel as serverless, but you’d rewrite uploads, sessions, and the database layer. **Railway/Render run a normal server** — same as `uvicorn` on your laptop, which matches how the app is built.

**Summary:** Vercel = frontend. Railway = backend. That’s the standard split for React + FastAPI apps.

---

Nestopia is a **monorepo** with two deployable apps:

| App | Folder | Recommended host |
|-----|--------|------------------|
| **Frontend** (React) | `frontend/` | [Vercel](https://vercel.com) |
| **Backend** (FastAPI) | `backend/` | [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io) |

---

## 1. Deploy the backend (Railway — one service)

### Step-by-step in Railway UI

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `Nestopia`.
2. Railway creates a service. Open it → **Settings** → **Root Directory** → set to `backend` (not the repo root).
3. **Variables** tab → add env vars (see below). Add **PostgreSQL** from Railway’s **+ New** menu; link `DATABASE_URL` to the service.
4. Deploy. Railway builds `backend/Dockerfile` and gives you a URL like `https://nestopia-api-production.up.railway.app`.
5. Test: open `https://YOUR-RAILWAY-URL/health` → should show `{"status":"ok"}`.

That’s **one** Railway project, **one** service, **one** root folder (`backend`).

### Railway Settings panel (copy these values)

Use this if you’re on the **Settings** tab for your `nestopia` service:

| Section | Field | Value |
|---------|--------|--------|
| **Source** | Root directory | `backend` (with or without `/` is fine) |
| **Source** | Branch | `main` |
| **Networking** | Public Networking | **Generate Domain** ← do this first; copy the URL |
| **Build** | Config-as-code → Railway Config File | `backend/railway.toml` |
| **Build** | Builder | **Dockerfile** (via `railway.toml`) — or Railpack if Docker disabled |
| **Deploy** | Custom Start Command | **Clear / empty** — do NOT use `--port $PORT` (Railway won't expand `$PORT` without a shell) |
| **Deploy** | Healthcheck Path | `/health` |
| **Deploy** | Serverless | **Off** (keep container always on) |
| **Deploy** | Restart Policy | On Failure |

**Fix for `'$PORT' is not a valid integer`:** Your Custom Start Command is overriding Docker. **Delete** the start command field entirely and redeploy. The repo's `start.sh` / Dockerfile handles `PORT` correctly.

If you must use Railpack (no Docker), set Start Command to:

```bash
sh start.sh
```

**Do not use:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` — `$PORT` is passed literally and crashes.

Then open the **Variables** tab (not Settings). **Delete any local-dev values** — these will not work on Railway:

| Wrong (local) | Fix |
|---------------|-----|
| `DATABASE_URL=sqlite:///./nestopia_dev.db` | Add **PostgreSQL** plugin → `DATABASE_URL=${{Postgres.DATABASE_URL}}` |
| `SECRET_KEY=change-me-long-random-string` | Run `python backend/scripts/generate_secrets.py` and paste both keys |
| `SESSION_SECRET_KEY=change-me-session-secret` | Same script |
| `REDIS_URL=redis://localhost:6379/0` | **Remove** — not needed unless you run Celery |
| `COOKIE_SECURE=false` | Use `true`, or omit if `FRONTEND_URL` is `https://` (auto-set) |
| `COOKIE_SAMESITE=lax` | Use `none` for Vercel + Railway split deploy (auto-set when URLs differ) |

**Minimum Railway variables:**

1. In your Railway **project**, click **+ New** → **Database** → **PostgreSQL** (if you haven't).
2. Open your **API service** (nestopia) → **Variables** tab.
3. Click **New Variable** → **Add Reference** (not raw text):
   - Variable: `DATABASE_URL`
   - Source: your Postgres service → `DATABASE_URL`

Do **not** type `${{Postgres.DATABASE_URL}}` by hand — use the Reference button so Railway injects the real URL.

```env
DATABASE_URL=<Reference → Postgres → DATABASE_URL>
SECRET_KEY=<from generate_secrets.py>
SESSION_SECRET_KEY=<from generate_secrets.py>
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
API_PUBLIC_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
USE_ML_MATCHING=false
```

Generate secrets locally:

```bash
python backend/scripts/generate_secrets.py
```

(Railway’s PostgreSQL plugin — `postgres://` URLs are auto-converted for SQLAlchemy.)

```env
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

Replace `API_PUBLIC_URL` with the domain from **Generate Domain**. Update `FRONTEND_URL` / `CORS_ORIGINS` after Vercel deploy.

**Watch Paths** (optional): add `backend/**` so only backend changes trigger redeploys.

5. Railway uses `backend/Dockerfile` and `backend/railway.toml` when config-as-code is linked.
6. After deploy, verify: `https://YOUR-RAILWAY-DOMAIN/health` → `{"status":"ok"}`.

### Environment variables (reference)

```env
DATABASE_URL=postgresql+psycopg2://...
SECRET_KEY=<long-random-string>
SESSION_SECRET_KEY=<long-random-string>
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
API_PUBLIC_URL=https://your-api.up.railway.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
USE_ML_MATCHING=false
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-api.up.railway.app/api/auth/google/callback
```

### Render

1. New **Web Service** → connect repo, **Root Directory** = `backend`.
2. Runtime: **Docker** (uses `backend/Dockerfile`) or use `backend/render.yaml` as a Blueprint.
3. Add a Render PostgreSQL instance and set the same env vars as above.

### Notes

- Run migrations after first deploy: `alembic upgrade head` (Railway/Render shell or one-off job).
- **Uploads** (`uploads/`) are ephemeral on most PaaS hosts — use S3/R2 for production images.
- **Celery/Redis** is optional; set `USE_ML_MATCHING=false` unless you run workers.

---

## 2. Deploy the frontend (Vercel — one project)

### Step-by-step in Vercel UI

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the **same** `Nestopia` repo.
2. **Root Directory** → click Edit → select `frontend`.
3. **Environment Variables** → add:
   - `REACT_APP_API_BASE_URL` = your Railway URL from step 1 (e.g. `https://nestopia-api-production.up.railway.app`)
4. Deploy. You get a URL like `https://nestopia.vercel.app`.
5. Go back to Railway → update `FRONTEND_URL` and `CORS_ORIGINS` to your Vercel URL → redeploy backend.

That’s **one** Vercel project, separate from Railway. Same repo, different folder.

### Environment variables

| Variable | Example |
|----------|---------|
| `REACT_APP_API_BASE_URL` | `https://your-api.up.railway.app` |

No trailing slash on the API URL.

5. Deploy. Vercel runs `npm run build` and serves `build/` with SPA rewrites from `vercel.json`.

### Custom domain

- Point your domain to Vercel for the frontend.
- Update backend `FRONTEND_URL` and `CORS_ORIGINS` to match.
- Add the custom domain to Google OAuth **Authorized JavaScript origins** and keep redirect URI on the **API** host.

---

## 3. Cross-origin auth (split deploy)

When the frontend (`*.vercel.app`) and API (`*.railway.app`) are on **different domains**:

| Setting | Value | Why |
|---------|-------|-----|
| `COOKIE_SECURE` | `true` | HTTPS only |
| `COOKIE_SAMESITE` | `none` | Browser sends cookie on cross-origin XHR |
| `CORS_ORIGINS` | Your Vercel URL | Required with `allow_credentials` |
| `withCredentials` | already `true` in axios | Sends API-domain cookie |

Session cookies are stored for the **API domain**; axios calls the API with credentials. This is already configured in code.

**Local dev** keeps `COOKIE_SAMESITE=lax` and an empty `REACT_APP_API_BASE_URL` so the CRA proxy stays same-origin.

---

## 4. Google OAuth checklist

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. **Authorized JavaScript origins:** `https://your-app.vercel.app`
2. **Authorized redirect URIs:** `https://your-api.up.railway.app/api/auth/google/callback`
3. Backend env: `GOOGLE_REDIRECT_URI` = same redirect URI (or rely on `API_PUBLIC_URL`).

---

## 5. Quick verification

```bash
# API health
curl https://your-api.up.railway.app/health

# CORS preflight (replace origins)
curl -I -X OPTIONS https://your-api.up.railway.app/api/listings \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

In the browser: open the Vercel URL → sign up → browse listings → check Network tab that API calls go to your Railway URL and return 200.

---

## File reference

| File | Purpose |
|------|---------|
| `frontend/vercel.json` | CRA build + SPA rewrites |
| `frontend/.env.example` | Frontend env template |
| `backend/.env.example` | Backend env template |
| `backend/Dockerfile` | Container image for API hosts |
| `backend/railway.toml` | Railway deploy config |
| `backend/render.yaml` | Render Blueprint (optional) |

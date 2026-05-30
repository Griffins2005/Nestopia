# Nestopia

Nestopia is a full-stack rental housing platform that matches renters with landlords based on housing preferences, property features, and per-listing tenant requirements. Compatibility is shown as a percentage on listings, detail pages, and a daily matches feed. Renters can save homes, contact hosts, and track rental applications through a built-in activity workflow.

## Architecture

The application consists of a React frontend and a FastAPI backend. PostgreSQL is supported for production; local development can use SQLite (`DATABASE_URL=sqlite:///./nestopia_dev.db`). The frontend proxies API calls in dev and uses httpOnly cookie sessions for authentication.

```
Browser (React)  →  /api/* proxy (dev)  →  FastAPI
                         ↓
              PostgreSQL or SQLite
              uploads/ (images, profile pics)
              Redis + Celery (optional daily matching jobs)
```

## Features

### Authentication and User Management

- Email/password signup and login with bcrypt hashing
- Google OAuth (renter or landlord role at signup)
- Role-based access: **renter** or **landlord**
- HttpOnly session cookie (`nestopia_session`) — no JWT in `localStorage`
- Optional TOTP two-factor authentication (Security tab in profile)
- Password strength policy at signup and password change
- Profile: name, about, photo upload, phone, location, contact preference (`email` | `phone` | `text`)
- Public profile pages at `/users/:id` with optional peer reviews

### Renter Housing Preferences

Renters set preferences during onboarding or at `/preferences`:

- Budget range, bedrooms, bathrooms, household size
- Preferred locations via OpenStreetMap search (`{ label, lat, lng }[]`)
- Move-in window (date range)
- Lease length, unit amenities, building amenities
- Pet policy, smoking preference, noise tolerance, visitor flexibility
- Custom preference tags

These drive **property fit** in compatibility scoring.

### Listings and Tenant Requirements

**Landlords** create and manage listings at `/listing/new` and `/listing/edit/:id`:

- Title, description, rent, beds/baths, sqft, photos
- Location with geocoding (lat/lng stored on listing)
- Amenities, building features, custom tags, house rules
- Pet policy, lease length, available-from date, max occupants
- **Per-listing tenant requirements** — what the host expects from tenants for that property:
  - Preset tenant requirements (`tenant_preferences`)
  - Custom rules (`tenant_custom_requirements`)
  - Import/copy requirements from another owned listing when creating or editing

**Renters** browse at `/listings`, view detail at `/listing/:id`, save homes, and see:

- Property amenities and features
- **What the host expects from tenants** (listing-specific requirements)
- Compatibility percentage and breakdown (when logged in as renter with preferences)

Tenant requirements are **listing-specific**. They are not set globally on the landlord profile and are not used from legacy `landlord_preferences` for matching.

### Compatibility Scoring

Scores compare **renter preferences** against **what the listing offers** and **what the host expects from tenants**.

| Component | Weight | What it measures |
|-----------|--------|------------------|
| **Property fit** | 72% | Budget, location (distance when lat/lng available), beds/baths, unit & building amenities, lease, move-in timing, pets, household vs max occupants, custom tags |
| **Tenant fit** | 28% | Renter lifestyle profile vs listing `tenant_preferences`, `tenant_custom_requirements`, and `house_rules` |

The API returns:

- `match_score` — overall compatibility (0–1)
- `match_breakdown` — `overall_percent`, `property_fit_percent`, `tenant_fit_percent`, and per-factor `property_breakdown`

Displayed as **0–100%** on listing cards, map pins, listing detail sidebar, and `/matches`.

Daily matches (`GET /api/matches/daily`) rank top homes for the logged-in renter. If no daily job has run, scores are computed live. Live breakdown always wins over any stale stored daily-match score.

Optional ML enhancement (`USE_ML_MATCHING=true`) adds behavioral and collaborative signals on top of the rule-based base score.

### Matches Page

`/matches` (renters only) shows:

- Top match hero with overall % and property/tenant fit split
- Ranked grid of additional homes
- Requires renter preferences to be set

### Contact and Applications

- Listing detail shows host contact based on their **contact preference**
- Contact opens email/SMS with a pre-written intro about the listing
- Contacting a listing as a renter creates a **rental application** (`POST /api/applications/from-contact`)
- Profile **Activity** tab tracks applications and tour requests:
  - Landlord accept/reject, tenant confirm, withdraw
  - Propose/accept/reject/counter tour times
  - Set move-in date; accepted applications activate on move-in date

### Maps and Location

- Leaflet + OpenStreetMap tiles on browse map and listing mini-map
- Backend geocoding via Nominatim (`GET /api/geo/search`)
- Location scoring uses haversine distance when coordinates are present

### Optional Authentication

- Listings can be browsed without logging in (no match scores)
- Match scores, saved listings, matches, preferences, and contact require authentication
- Landlords can use `view_as_renter=true` on `GET /api/listings` to browse all listings with renter-style scoring

## Technology Stack

### Frontend

- React 19 with React Router 7
- Context API (`AuthProvider`, `NestopiaProvider`)
- Axios with `withCredentials` (httpOnly session cookie)
- Leaflet + OpenStreetMap; Nominatim via backend proxy
- CSS custom properties in `index.css` (no CSS-in-JS)

### Backend

- FastAPI (Python 3.11+)
- SQLAlchemy ORM (PostgreSQL or SQLite)
- Alembic migrations + lightweight dev column patches (`app/db/dev_migrations.py` for SQLite)
- Authlib for Google OAuth
- HttpOnly cookie sessions (signed JWT payload in cookie)
- Celery + Redis for optional daily matching jobs
- bcrypt, pyotp, qrcode for auth and 2FA

## Project Structure

```
Nestopia/
├── backend/
│   ├── app/
│   │   ├── routers/       # auth, users, listings, preferences, matches, geo,
│   │   │                  # applications, security, stats, payments, …
│   │   ├── crud/          # Database operations
│   │   ├── db/            # Models, session, dev_migrations
│   │   ├── core/          # Config, security, cookies, TOTP, password policy
│   │   ├── schemas/       # Pydantic models
│   │   ├── services/      # Celery matching jobs
│   │   └── utils/         # match, geo, listing_helpers, application_helpers, …
│   ├── alembic/
│   ├── uploads/           # listing_images/, profile_pics/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/           # axios clients (auth, listings, matches, geo, applications, …)
│   │   ├── components/    # UI including matches/MatchBreakdown, preferences/, profile/
│   │   ├── context/       # authContext, NestopiaContext
│   │   ├── pages/         # Route screens
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/login`, `/signup` | Authentication |
| `/onboarding` | Renter preference setup; landlord welcome → create listing |
| `/listings` | Browse all listings (map + grid) |
| `/listing/:id` | Listing detail with compatibility breakdown |
| `/listing/new`, `/listing/edit/:id` | Landlord listing form (incl. tenant requirements) |
| `/matches` | Daily ranked matches (renters) |
| `/saved` | Saved listings |
| `/preferences` | Edit renter housing preferences |
| `/profile` | Profile, listings (landlords), activity, security |
| `/users/:id` | Public user profile and reviews |

## Installation and Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (production) or SQLite (local dev)
- Redis (optional — Celery daily matching only)

### Backend Setup

**Quick start (SQLite):**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cat > .env << 'EOF'
DATABASE_URL=sqlite:///./nestopia_dev.db
SECRET_KEY=dev-secret-change-in-production
SESSION_SECRET_KEY=dev-session-secret-change-in-production
FRONTEND_URL=http://localhost:3000
USE_ML_MATCHING=false
EOF

uvicorn app.main:app --reload
```

Tables and dev column patches run automatically on startup for SQLite.

**Production-style (PostgreSQL):**

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/nestopia
SECRET_KEY=your_64_character_secret_key_here
SESSION_SECRET_KEY=your_session_secret_key
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=1440
COOKIE_SECURE=true

USE_ML_MATCHING=true
USE_SEMANTIC_MATCHING=false
REDIS_URL=redis://localhost:6379/0

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000` · Docs: `http://127.0.0.1:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

App: `http://localhost:3000` — CRA dev server proxies `/api` to port 8000.

Production build:

```bash
REACT_APP_API_BASE_URL=https://your-api.example.com npm run build
```

### Background Workers (optional)

```bash
redis-server

cd backend
celery -A celery_app.celery worker -l info
celery -A celery_app.celery beat -l info

# Manual daily match run:
celery -A celery_app.celery call app.services.matching.compute_daily_matches
```

## Compatibility Scoring Details

### Property fit factors (weighted internally, combined to 0–1)

| Factor | Weight |
|--------|--------|
| Budget | 18 |
| Location | 14 |
| Bedrooms | 10 |
| Bathrooms | 8 |
| Unit amenities | 12 |
| Building amenities | 6 |
| Lease length | 6 |
| Move-in timing | 6 |
| Pets | 8 |
| Household vs max occupants | 4 |
| Custom tags | 4 |

### Tenant fit

Averages fuzzy matches between each listing tenant requirement (presets, custom rules, house rules) and the renter profile (pets, smoking, noise tolerance, lease preference, custom tags, etc.).

### Machine learning (optional)

When `USE_ML_MATCHING=true`, `SmartMatcher` blends the rule-based score with behavioral signals (saved listings, visits) and optional collaborative filtering. When `USE_SEMANTIC_MATCHING=true`, sentence embeddings compare free-form text (requires `sentence-transformers` and `torch`).

## API Reference

All endpoints are prefixed with `/api`. Authenticated requests use the `nestopia_session` httpOnly cookie. Interactive docs: `/docs`.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account (renter or landlord) |
| POST | `/api/auth/login` | Login (may return 2FA challenge) |
| POST | `/api/auth/verify-2fa` | Complete login with TOTP |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/google/login?role=renter\|landlord` | Start Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |

### Users and Security

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update profile |
| POST | `/api/users/change-password` | Change password |
| POST | `/api/users/upload-profile-doc` | Upload profile photo |
| GET | `/api/users/profile/{user_id}` | Public profile |
| POST | `/api/users/profile/{user_id}/reviews` | Submit profile review |
| GET | `/api/security/status` | 2FA status |
| POST | `/api/security/totp/setup` | Begin TOTP setup |
| POST | `/api/security/totp/confirm` | Enable TOTP |
| POST | `/api/security/totp/disable` | Disable TOTP |

### Preferences

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/preferences/renter` | Renter housing preferences |
| GET/POST | `/api/preferences/landlord` | Legacy landlord prefs (not used for matching) |

### Listings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | All listings; match scores for authenticated renters |
| GET | `/api/listings/{id}` | Listing detail; score + breakdown for renters |
| GET | `/api/listings/owned` | Landlord's own listings |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/{id}` | Update listing |
| DELETE | `/api/listings/{id}` | Delete listing |
| POST | `/api/listings/upload-image` | Upload listing image |
| GET | `/api/listings/saved/` | Saved listings |
| POST/DELETE | `/api/listings/saved/{id}` | Save / unsave |

Listing payloads include `tenant_preferences`, `tenant_custom_requirements`, `latitude`, `longitude`, and `match_breakdown` when scored.

### Matching

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/matches/daily` | Top ranked matches for current renter |

### Applications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/applications/activity` | Activity feed + applications |
| POST | `/api/applications/from-contact` | Create application when contacting host |
| POST | `/api/applications/{id}/withdraw` | Tenant withdraws |
| POST | `/api/applications/{id}/landlord-accept` | Landlord accepts |
| POST | `/api/applications/{id}/landlord-reject` | Landlord rejects |
| POST | `/api/applications/{id}/tenant-confirm` | Tenant confirms |
| POST | `/api/applications/{id}/move-in` | Set move-in date |
| POST | `/api/applications/{id}/tours` | Propose tour |
| POST | `/api/applications/tours/{id}/accept` | Accept tour |
| POST | `/api/applications/tours/{id}/reject` | Reject tour |
| POST | `/api/applications/tours/{id}/counter` | Counter-propose tour time |

### Geo

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/geo/search?q=…` | Nominatim place search |

### Stats

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats/summary` | Platform statistics |

### Payments, Wallet, Blockchain

Backend routers exist for payments (`402pay` / h402), wallet connection, and blockchain transaction logging. These are **not wired into the main UI** and are reserved for future integration.

## Database Schema

Main tables:

| Table | Purpose |
|-------|---------|
| `users` | Accounts, profile, TOTP, contact preference |
| `listings` | Properties incl. tenant requirements, coordinates |
| `renter_preferences` | Renter housing preferences |
| `landlord_preferences` | Legacy; not used for tenant-requirement matching |
| `saved_listings` | User ↔ listing saves |
| `daily_matches` | Cached daily compatibility rankings |
| `rental_applications` | Contact/application workflow |
| `tour_requests` | Tour scheduling on applications |
| `listing_occupants` | Active tenants after move-in |
| `profile_reviews` | Peer reviews on public profiles |
| `visit_requests` | Legacy visit requests |
| `payment_records`, `blockchain_transactions` | Future payment/on-chain features |

Migrations:

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

## Deployment

This monorepo deploys as **two separate apps**. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide.

| Part | Directory | Host |
|------|-----------|------|
| Frontend | `frontend/` | **Vercel** — set Root Directory to `frontend`, add `REACT_APP_API_BASE_URL` |
| Backend | `backend/` | **Railway / Render / Fly** — PostgreSQL required; use `backend/Dockerfile` |

**Production checklist**

- Backend: `DATABASE_URL`, `SECRET_KEY`, `SESSION_SECRET_KEY`, `FRONTEND_URL`, `CORS_ORIGINS`, `API_PUBLIC_URL`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`
- Frontend (Vercel): `REACT_APP_API_BASE_URL=https://your-api-host`
- Google OAuth redirect URI points at the **API** host (`/api/auth/google/callback`)
- Run `alembic upgrade head` on PostgreSQL
- Plan object storage for `uploads/` (PaaS disks are ephemeral)

**Not recommended:** deploying the FastAPI backend on Vercel serverless (file uploads, DB, Celery).

## Security Considerations

- Rotate `SECRET_KEY` and `SESSION_SECRET_KEY` in production
- Never commit `.env`, `nestopia_dev.db`, or `uploads/` user content
- Enforce HTTPS for session cookies (`COOKIE_SECURE=true`)
- Restrict `POST /api/listings/upload-image` in production (auth + rate limits)
- Nominatim usage should respect OSM tile/usage policy; set a proper User-Agent in production

## Known Limitations

- Semantic matching requires optional heavy ML dependencies
- Test coverage is minimal
- Local filesystem uploads (not object storage)
- No real-time notifications
- Payment/wallet/blockchain UI not integrated

## License

MIT License — see LICENSE file.

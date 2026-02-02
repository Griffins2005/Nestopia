# Nestopia Backend

This directory contains the FastAPI backend for Nestopia, including API routes, data models, matching logic, and background jobs.

## Directory Layout

```
backend/
├── app/
│   ├── core/                 # Settings and security helpers
│   │   ├── config.py          # Environment configuration
│   │   └── security.py        # Password hashing, tokens, reset flow
│   ├── crud/                 # DB access helpers per domain
│   ├── db/                   # SQLAlchemy models and session setup
│   ├── routers/              # FastAPI route modules
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/             # Background tasks and domain services
│   ├── utils/                # Matching and ML helpers
│   └── utilis/               # Geo utilities (legacy naming)
├── alembic/                  # Migration scripts
├── alembic.ini
├── celery_app.py             # Celery application instance
├── requirements.txt
└── uploads/                  # Local media storage (dev only)
```

## Configuration

Configuration is read from `backend/.env` via `app/core/config.py`. Core variables:

```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/nestopia
SECRET_KEY=your_secret
FRONTEND_URL=http://localhost:3000
SESSION_SECRET_KEY=your_session_secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
AUTO_CREATE_TABLES=false

USE_ML_MATCHING=true
USE_SEMANTIC_MATCHING=false

REDIS_URL=redis://localhost:6379/0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Notes:
- `AUTO_CREATE_TABLES` is intended for development only. Production should rely on Alembic migrations.
- Semantic matching requires `sentence-transformers` and `torch` (optional; not installed by default).

## Key Modules

### Routers (`app/routers`)
- `auth.py`: signup/login, Google OAuth, password reset.
- `users.py`: profile read/update, password change, wallet link.
- `preferences.py`: renter/landlord preferences.
- `listing.py`: listing CRUD, saved listings, image upload (landlord-only).
- `matches.py`: daily match retrieval.
- `payments.py`, `wallet.py`, `blockchain.py`: reserved for future integrations.

### Matching (`app/utils` and `app/services`)
- `utils/match.py`: rule-based compatibility scoring.
- `utils/ml_match.py`: hybrid ML-enhanced scoring with behavioral and semantic signals.
- `services/matching.py`: daily batch matching job via Celery.

### Schemas (`app/schemas`)
Pydantic models define request and response contracts for:
- Auth flows
- Listings and saved listings
- Preferences and matches
- Payments and wallet (future)

### Data (`app/db`)
- `models.py`: SQLAlchemy models for users, listings, preferences, matches, and planned payment/blockchain entities.
- `session.py`: database session configuration.

## Running Locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000` with docs at `/docs`.

## Background Workers

Start Redis and Celery to enable daily matching:

```bash
redis-server
cd backend
celery -A celery_app.celery worker -l info
celery -A celery_app.celery beat -l info
```

If you do not run Celery, daily matches will not be computed. The API will still function for listings, profiles, and manual browsing.

## File Storage

`uploads/` stores listing images and profile media on disk. Subdirectories include `listing_images/` and `profile_pics/`. For production, move to object storage and configure static file serving accordingly.

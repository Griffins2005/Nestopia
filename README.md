# 🏡 Nestopia – Smart Rental Matching Platform

**Nestopia** is a full-stack rental housing platform that leverages **landlord/renter preferences** and **property features** to calculate compatibility scores, surface verified contact info, and make renting a home feel personal.

The system is built with **React (frontend)** and **FastAPI + PostgreSQL (backend)**. It allows renters and landlords to connect through personalized listings, intelligent matching, and an intuitive user experience that now prioritizes direct email/phone introductions.

---

## ✨ Features

### 👤 Authentication & User Management

* **Email & Password login** with hashed storage (bcrypt + JWT)
* **Google OAuth login**
* **Role-based accounts**: Renter or Landlord
* **Profile management**: name, bio, picture, phone, location
* Secure JWT tokens

### 🏘 Listings

* **Landlords**:

  * Create, edit, delete property listings
  * Add images, amenities, house rules, pets policy, and lease terms
* **Renters**:

  * Browse all available listings
  * **Save/favorite** listings
* **Detail pages** with property carousel, specs, landlord info, and availability

### 🤝 Compatibility Scoring

* Uses **renter preferences** (budget, bedrooms, amenities, pets, etc.) compared with:

  * **Landlord preferences**
  * **Property features**
* Produces a **compatibility score (%)**
* Partial mismatches subtract points (not zeroed out)

### 🔗 Direct Contact & Profile Sharing

* Listing detail pages show **verified landlord email + phone**
* Renters can launch pre-filled `mailto:` links that include the listing name
* Hosts see condensed renter profiles (role, preferences, phone) before replying
* Optional Calendly links keep tour scheduling in one place

### 🎨 UI/UX

* **Responsive design**
* Pure **CSS styling** (no inline React CSS)
* **Grid layout** for listings
* Match score badge, save & share buttons
* Accessibility-friendly markup

### 🔒 Security

* JWT authentication
* CSRF/OAuth state handling
* Pydantic schema validation
* PostgreSQL with SQLAlchemy ORM

### 💸 Payments & Web3

* Wallet connect endpoint persists renter/landlord wallet addresses
* Blockchain route logs visit scheduling/deposit confirmations with generated tx hashes
* Payment API simulates 402pay charges, stores receipts, and exposes a history endpoint

---

## 🛠 Tech Stack

### Frontend

* React.js + React Router
* Context API (Auth state management)
* Axios (API requests)
* CSS (global styles)
* React Icons

### Backend

* FastAPI (Python)
* PostgreSQL + SQLAlchemy ORM
* Alembic (DB migrations)
* Authlib (Google OAuth)
* python-jose (JWT tokens)

---

## 📂 Project Structure

```
Nestopia/
│
├── backend/
│   ├── app/
│   │   ├── routers/        # API routes
│   │   ├── crud/           # DB operations
│   │   ├── db/             # Models & session
│   │   ├── core/           # Security & config
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py         # FastAPI entrypoint
│   ├── alembic/            # DB migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Listings, Profile, Auth flows
│   │   └── index.css       # Global styles
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 18
* Python ≥ 3.11
* PostgreSQL

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Apply DB migrations
alembic upgrade head

# Run backend
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### Environment Configuration

Create a `.env` file inside `backend/` (or export the variables) so every service advertised above can actually start. The following template covers everything the code expects:

```env
DATABASE_URL=postgresql+psycopg2://nestopia:nestopia@localhost:5432/nestopia
SECRET_KEY=generate_a_64_char_random_string
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Matching flags (see details below)
USE_ML_MATCHING=true
USE_SEMANTIC_MATCHING=false

# 402pay integration
PAYMENT_PROVIDER=402pay
PAYMENT_API_KEY=sandbox_402pay_key
PAYMENT_WEBHOOK_SECRET=sandbox_webhook_secret

# h402 paywall defaults (BSC test wallet)
H402_ENABLED=true
H402_FACILITATOR_URL=http://localhost:9402
H402_NAMESPACE=evm
H402_NETWORK_ID=56
H402_TOKEN_ADDRESS=0x55d398326f99059fF775485246999027B3197955
H402_TOKEN_SYMBOL=USDT
H402_TOKEN_DECIMALS=6
H402_AMOUNT_FORMAT=humanReadable
H402_PAY_TO_ADDRESS=0xd78d20FB910794df939eB2A758B367d7224733bc
H402_RPC_URL=https://bsc-dataseed.binance.org
H402_CHAIN_NAME=Binance Smart Chain
H402_RESOURCE_BASE=http://localhost:3000/payments

# Background workers
REDIS_URL=redis://localhost:6379/0

# OAuth + sessions
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET_KEY=another_random_string
```

Notes:

- `USE_SEMANTIC_MATCHING=true` requires the optional dependencies shown in `backend/requirements.txt` (uncomment `sentence-transformers` and `torch`) and downloads an ~80 MB model at startup.
- `SECRET_KEY` and `SESSION_SECRET_KEY` should both be unique; rotate them whenever credentials are compromised.
- For production deployments, point `DATABASE_URL`, `REDIS_URL`, and the 402pay API credentials at managed services instead of localhost.

#### Frontend Environment

Inside `frontend/`, create a `.env.local` to keep API URLs in sync with your backend:

```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
REACT_APP_H402_RPC_URL=https://bsc-dataseed.binance.org
REACT_APP_ENABLE_H402=false
```

The first variable drives Axios + Google OAuth redirects, while `REACT_APP_API_URL` is used only for building absolute asset URLs (profile pictures, images).
Set `REACT_APP_ENABLE_H402=true` only after the facilitator + wallet flow is healthy; otherwise the UI hides the paywall card.

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:3000`

### Background Workers & Match Jobs

The daily match pipeline is delivered through Celery + Redis. In development you can run everything from the `backend/` directory once Redis is available locally:

```bash
redis-server --daemonize yes               # or use Docker
celery -A celery_app.celery worker -l info &
celery -A celery_app.celery beat -l info
```

`celery_app.py` schedules `compute_daily_matches` every 24 h, but you can also run it manually via `celery -A celery_app.celery call app.services.matching.compute_daily_matches`.

### h402 Facilitator (402pay rail)

The FastAPI backend relays payment headers to a lightweight TypeScript facilitator so we can verify/settle transactions using [`@bit-gpt/h402`](https://github.com/bit-gpt/h402). Spin it up next to your backend:

```bash
git clone https://github.com/bit-gpt/h402 vendor/h402   # one-time setup
cd vendor/h402
pnpm install
PORT=9402 PRIVATE_KEY=0xyourLandlordWallet pnpm --filter facilitator dev
```

`PRIVATE_KEY` signs settlement transactions and should point to the landlord wallet you advertised in `H402_PAY_TO_ADDRESS`. The facilitator exposes `/verify` and `/settle` over HTTP; the backend calls `/verify` during `POST /api/payments/confirm`.

---

## 📊 Compatibility Score

The **compatibility score** compares renter needs vs landlord listings and preference rules:

* ✅ Budget range vs. rent price
* ✅ Bedrooms / Bathrooms vs. listing specs
* ✅ Renter unit amenities vs. property amenities
* ✅ Renter building amenities vs. building features
* ✅ Pets, smoking, visitor policies vs. landlord requirements
* ✅ Lease length and move-in timing vs. availability
* ✅ Household size vs. max occupants
* ✅ Custom preference tags vs. listing tags

Even if some fields don’t match, a listing is not excluded — points are deducted instead of forcing a **0%** score. The score is normalized (0–1) after weighting each category.

### Weighting Matrix

The rule-based scorer (`backend/app/utils/match.py`) uses the following weights before normalization:

| Category | Weight |
| --- | --- |
| Budget fit | 20 |
| Location & neighborhood | 15 |
| Bedrooms | 10 |
| Bathrooms | 8 |
| Unit amenities | 10 |
| Building amenities | 5 |
| Lease length | 8 |
| Move-in timing | 7 |
| Pets policy | 7 |
| Landlord tenant policies | 5 |
| Household size vs occupants | 3 |
| Custom tags | 4 |
| Landlord requirements enforcement | 8 |

Because the scorer subtracts proportional penalties instead of hard-failing checks, contributors can experiment safely by tweaking these weights—remember to keep their sum at 100 before normalization.

### Preference Schemas

**Renters store:**

- Housing basics: budget min/max, bedrooms, bathrooms, household size, preferred locations, move-in date, lease length
- Property amenities (`amenities`) and building amenities (`building_amenities`)
- Policies: pets allowed, smoking preference, noise tolerance, visitor flexibility
- Custom preference tags (`custom_preferences`)

**Landlords store:**

- Tenant requirements (`tenant_preferences`) and optional custom rules (`custom_requirements`)
- Default lease length and pet policy
- Listings extend this profile with property details, neighborhood profile, building features, and custom tags for matching.

### ML & Semantic Matching Modes

- `USE_ML_MATCHING=true` spins up the `SmartMatcher` pipeline (`backend/app/services/matching.py`) which layers collaborative filtering signals (saved listings, visit activity) on top of the deterministic weights shown above.
- `USE_SEMANTIC_MATCHING=true` additionally loads sentence embeddings (via `sentence-transformers` + `torch`) so free-form descriptions and tags can be compared. Expect a one-time model download on first boot.
- When both flags are `false`, Celery falls back to the pure rule-based scorer. Use this mode for lightweight environments or unit tests.

---

## 📜 License

Nestopia is released under the **MIT License**.
See the `LICENSE` file for details.

## 📡 API Reference

All endpoints are grouped under the `/api` prefix and require `Authorization: Bearer <JWT>` unless noted. Interactive OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

**Authentication & Accounts**
- `POST /api/auth/signup`, `POST /api/auth/login` – email/password flows for renters & landlords.
- `GET /api/auth/google/login?role={renter|landlord}` → `GET /api/auth/google/callback` – Google OAuth handoff (uses `FRONTEND_URL` for redirects).
- `GET /api/users/me`, `PATCH /api/users/me` – fetch/update profile basics; `POST /api/users/change-password` enforces the bcrypt hash update.

**Preferences, Listings & Matches**
- `POST/GET /api/users/preferences/renter|landlord` – store normalized preference payloads referenced by the matcher.
- `POST /api/listings` (landlords only), `PUT/DELETE /api/listings/{id}`, `POST /api/listings/upload-image` – CRUD + asset uploads (saved under `backend/uploads`).
- `GET /api/listings` – renters receive compatibility scores per listing; landlords see only their inventory.
- `POST/DELETE /api/listings/saved/{listing_id}`, `GET /api/listings/saved` – favorites + share cards.
- `GET /api/matches/daily` – latest Celery-produced matches (top 3 by default).

**Tokens & Credits**
- `GET /api/tokens/balance`, `POST /api/tokens/spend` – feature gating for premium flows (matching boosts, early tour access, etc.).

**Payments, Wallets & Blockchain Log**
- `POST /api/payments/initiate` – creates a payment intent and returns the h402 payment requirements document (include `amount` in cents). The React client uses this payload with `@bit-gpt/h402` + `viem` to sign a transaction in the renter’s wallet.
- `POST /api/payments/confirm` – accepts the base64 payment header returned by `createPaymentHeader`, relays it to the facilitator, and marks the receipt `completed` when on-chain verification succeeds.
- `GET /api/payments`, `GET /api/payments/{id}` – fetch historical receipts along with blockchain references.
- `POST /api/wallet/connect`, `GET /api/wallet` – stores EVM-style addresses (basic validation only).
- `POST /api/blockchain/schedule-visit`, `POST /api/blockchain/deposit`, `GET /api/blockchain/transactions` – append-only log with generated tx hashes to audit visit scheduling and deposits.

## ✅ Testing & Quality

- **Backend**: once dependencies are installed, run `pytest` from `backend/` (tests live under `backend/tests/`, add suites as you touch modules). Pair with `ruff` or `black` if you add new linters.
- **Database migrations**: use `alembic revision --autogenerate -m "describe change"` then `alembic upgrade head`. Keep migration files in `backend/alembic/versions`.
- **Frontend**: `npm test` for Jest + React Testing Library suites, `npm run build` before pushing to CI/CD.
- **Type/lint checks**: `npm run lint` isn’t defined, so rely on the default CRA ESLint config (runs automatically during `npm start` / `npm test`); add a script if stricter linting is needed.

## 🚢 Deployment Checklist

- Backend: `uvicorn app.main:app` works for dev; prefer `gunicorn -k uvicorn.workers.UvicornWorker app.main:app` behind an HTTPS reverse proxy in production.
- Database: provision PostgreSQL 14+ with automated backups; run Alembic migrations on boot (e.g., via entrypoint script).
- Frontend: `npm run build` then host the `frontend/build` directory on the same domain or a CDN; set `REACT_APP_API_BASE_URL` to the public API URL before building.
- Background jobs: deploy Redis (or another Celery broker) and run `celery worker` + `celery beat` as dedicated processes/containers; monitor for failures.
- Static uploads: `uploads/` currently writes to disk; for production, mount persistent storage or swap in S3/GCS to avoid losing avatars and listing photos.
- Payments: keep the h402 facilitator close to FastAPI (same VPC) and protect it with ACLs—its private key can release funds. Rotate `H402_PAY_TO_ADDRESS`/`PRIVATE_KEY` pairs as you onboard new landlord wallets.

## 🔐 Security & Ops Notes

- Rotate `SECRET_KEY`, OAuth secrets, and 402pay API keys via your secrets manager; never commit `.env` files.
- Enforce HTTPS/TLS termination (Caddy, Nginx, or a cloud load balancer) so JWTs aren’t sent in clear text.
- Add rate limiting and IP throttling in front of FastAPI (e.g., `slowapi`) to protect auth and contact endpoints.
- Centralize logging/monitoring (OpenTelemetry, Sentry, or Logtail) to observe contact handoff errors, payment errors, and Celery retries.
- Plan for privacy: purge personal data on user deletion and scrub logs of PII where possible.

## 🗺️ Roadmap & Known Gaps

- Real payment rails (402pay webhooks + token crediting) are scaffolded but commented out—finish implementation before charging real customers.
- Semantic matching defaults to off and requires additional dependencies; document the model checkpoint you standardize on once validated.
- Automated test coverage is minimal today; prioritize smoke tests for auth, listings CRUD, and contact workflows.
- Push notifications / SMS / real-time contact status indicators are not yet implemented; current UX relies on email + manual follow-up.
- File storage, rate limiting, and audit logs need production-ready replacements to meet compliance requirements.

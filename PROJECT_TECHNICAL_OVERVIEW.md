# Nestopia — Technical Project Overview

## Executive Summary
Nestopia is a full-stack rental housing platform that matches renters with landlords through preference-based compatibility scoring. The system delivers a React single-page application (SPA) backed by a FastAPI API with PostgreSQL storage, background matching via Celery, and an extensible matching pipeline that can be rule-based or ML-enhanced. The platform supports distinct renter/landlord roles, optional unauthenticated browsing, and a direct contact workflow for listings.

This document describes the current state of the project, design decisions, and tradeoffs, based on the implemented code and configuration.

## Current Scope and Status
Implemented and operational:
- Role-based authentication (email/password and Google OAuth) with JWT sessions.
- Renter and landlord preference profiles.
- Listing creation, editing, image upload, browsing, and saving.
- Compatibility scoring and daily match generation.
- Background workers (Celery + Redis) for scheduled matching.
- Basic profile management and password reset flow.

Planned but not active:
- Payments and wallet features (endpoints and models are present but inactive).
- Blockchain transaction logging (models and endpoints exist but are not production-ready).

## Architecture Overview
### High-Level Components
- **Frontend**: React SPA with React Router, Vite build pipeline, Context API for auth, Axios for API calls.
- **Backend**: FastAPI service with REST endpoints, SQLAlchemy ORM, Alembic migrations.
- **Data Store**: PostgreSQL for core entities and matching data.
- **Background Processing**: Celery workers + beat scheduler for daily match computation.
- **Static Files**: Local file storage under `backend/uploads/` for listing images and profile media.

### Rationale and Tradeoffs
- **SPA + REST**: Keeps frontend and backend decoupled, enabling independent iteration and deployment. Tradeoff is duplicated validation rules between client and server.
- **FastAPI + SQLAlchemy**: Strong typing, automatic API docs, and a mature ORM. Tradeoff is boilerplate around models/schemas and session management.
- **Celery for matching**: Heavy compute is moved off request paths. Tradeoff is operational complexity (Redis, worker monitoring).

## Backend Design
### Application Entry and Middleware
The backend is initialized in `app.main` and sets up:
- CORS for the frontend origin.
- Session middleware for OAuth flows.
- Static file serving for uploaded assets.
- Router inclusion for all API modules.

On startup, the app can create tables automatically when `AUTO_CREATE_TABLES=true`. This is intended for development only; production should rely on explicit migrations to avoid schema drift and untracked changes.

### Request Lifecycle and Dependency Model
The API relies on FastAPI dependency injection for:
- Database session management (`get_db`).
- Current user resolution and role enforcement (`get_current_user`, `get_optional_user`).

This yields consistent authorization checks and session handling with minimal duplication in routers. The tradeoff is that runtime errors can be harder to trace when dependency chains become complex, and care must be taken to avoid session leaks in long-running background contexts.

### Authentication and Security
Authentication is implemented in `app/routers/auth.py` with:
- Email/password signup and login.
- Google OAuth integration (separate router).
- Password reset via signed, time-limited tokens.

Password handling uses a two-step approach:
- Client password is pre-hashed using SHA-256.
- Hash is stored with bcrypt for long-term storage and verification.

Rationale: pre-hash stabilizes input length and reduces bcrypt’s exposure to extremely long inputs. Tradeoff is reduced entropy at the bcrypt layer, which is acceptable given SHA-256 is collision resistant and the bcrypt hash remains the primary verification step.

JWT tokens embed user id and role and are validated on protected routes via dependency injection. The design allows role-based access control without duplicating endpoint logic. The tradeoff is that role changes require token re-issuance or refresh to take effect.

#### Auth Flow Details
1. **Signup**: client posts email, password, role → backend creates user and returns JWT.
2. **Login**: client posts credentials → backend verifies bcrypt hash and returns JWT.
3. **Profile bootstrap**: frontend calls `GET /api/users/me` immediately after login to hydrate UI state and determine onboarding path.
4. **Role gating**: routes are protected using `RequireAuth` in the UI and `get_current_user` in the API.

Tradeoffs:
- **JWT-only sessions** are simple and stateless, but token revocation requires additional infrastructure (deny lists, short TTL + refresh).
- **Role embedded in JWT** avoids extra DB calls for access checks, but becomes stale if roles change mid-session.

### Data Model
Core SQLAlchemy models are defined in `app/db/models.py`, including:
- `users`, `listings`, `renter_preferences`, `landlord_preferences`.
- `saved_listings` (many-to-many), `daily_matches`.
- `visit_requests`, `tokens`, and planned `payment_records` and `blockchain_transactions`.

Rationale: Keep preferences separate from users to allow distinct renter/landlord flows and reduce null-heavy user rows. Tradeoff is extra joins and more complex onboarding logic.

#### Schema Decisions and Constraints
- `users` enforces a unique constraint on `(email, role)` to allow the same email to operate in two different roles without collision.
- `listings` and preferences rely on JSON columns for amenity lists and tags, trading relational integrity for flexible, schema-light attributes.
- `daily_matches` stores computed scores by date, enabling reproducible daily recommendations but requiring cleanup and recomputation logic.

Tradeoffs:
- **JSON fields** simplify iteration and avoid join explosion, but limit indexing and make complex filters harder.
- **Role-specific preferences** avoid sparse user records but increase the number of reads needed to render a user profile.

### Listings and Files
Listings are managed via `app/routers/listing.py`:
- Landlords can create/edit/delete listings.
- All users can browse; renters receive match scores.
- Images are uploaded through a dedicated endpoint and stored on disk.

Tradeoffs:
- **Local file storage** is simple and fast for development, but non-durable and not horizontally scalable. Production should move to object storage (S3/GCS) or durable volumes.
- **Match scoring on listing read** provides immediate feedback but increases computation for large result sets.

#### Listing Retrieval Behavior
`GET /api/listings` behaves differently based on authentication:
- Unauthenticated: all listings, no match score.
- Renter: all listings, each scored against preferences.
- Landlord: own listings only (or all listings if `view_as_renter=true`).

This supports a low-friction browse experience while still enabling personalized ranking. The tradeoff is that the same endpoint has multiple behavior modes, which increases test surface area and makes caching less effective.

### Matching System
The matching engine has two modes:

1. **Rule-based scoring** (`app/utils/match.py`): A weighted criteria model that scores listings based on budget, location, amenities, lease length, timing, pets, and landlord policies.
2. **ML-enhanced scoring** (`app/utils/ml_match.py`): A hybrid approach that preserves the rule-based score while adding behavioral signals, semantic text similarity, collaborative filtering, and improved location/time heuristics.

The daily matching task runs in a Celery job (`app/services/matching.py`) and stores the top matches per renter in `daily_matches`.

#### Matching Inputs and Feature Sources
The score derives from three primary sources:
- **Renter preferences**: budget, bedrooms, locations, move-in date, amenities, pets, and custom tags.
- **Listing attributes**: rent, location, amenities, availability, maximum occupants, and text fields (description, tags).
- **Landlord preferences**: tenant requirements and policies that gate eligibility or impose penalties.

This separation allows listings and preferences to evolve independently while keeping scoring consistent across daily matching and live listing views.

#### Rule-Based Scoring Details
The rule-based matcher uses a fixed weight matrix and computes normalized scores:
- **Budget**: full score inside range, proportional penalty outside range.
- **Location**: string inclusion and neighborhood profile overlap; partial credit if weak match.
- **Bedrooms/Bathrooms**: proportional penalties for deficits rather than hard rejections.
- **Amenities**: overlap ratio between desired and available amenities.
- **Move-in timing**: simple string and “ASAP” matching.
- **Tenant policies**: landlord requirements apply penalties rather than exclusions.

Key tradeoff: partial credit reduces false negatives but can surface listings that violate hard constraints. The system assumes that users prefer ranked options over binary filtering.

#### Rule-Based Scoring Tradeoffs
- **Pros**: Deterministic, explainable, fast, and easy to debug.
- **Cons**: Fixed weights do not adapt to individual user preferences and can underrepresent nuanced intent.

#### ML-Enhanced Scoring Tradeoffs
- **Pros**: Learns from user behavior, improves personalization, and can understand free-text preferences.
- **Cons**: Higher compute cost, requires additional dependencies, and is harder to fully explain or audit.

The current system defaults to ML-enhanced scoring when enabled via environment variables, but retains the rule-based fallback. This makes it safe to ship an MVP while allowing incremental improvement as data volume grows.

#### ML-Enhanced Scoring Components
The ML-enhanced score combines multiple signals:
- **Behavioral signal**: boosts based on saved listings or visit requests and penalizes ignored items.
- **Semantic text matching**: optional sentence embeddings for free-text fields (descriptions, tags).
- **Collaborative filtering**: similarity-based recommendations from users with overlapping preferences.
- **Enhanced location/timing**: heuristics that approximate distance and date proximity where possible.

The final score is a weighted ensemble, with the rule-based score remaining the dominant component. This preserves explainability and protects against overfitting early data.

#### Configuration and Feature Flags
Matching mode is controlled via environment variables:
- `USE_ML_MATCHING`: enables the hybrid scorer.
- `USE_SEMANTIC_MATCHING`: enables embeddings if dependencies are installed.

Tradeoff: feature flags allow safe rollout but can lead to divergent user experiences if not carefully staged and measured.

#### Matching Pipeline (Daily Batch)
1. Load all renters and listings.
2. Precompute similar user signals for each renter (collaborative filtering).
3. For each renter-listing pair, compute either rule-based or ML-enhanced scores.
4. Sort by score, persist top N to `daily_matches`.

Tradeoffs:
- **Batch computation** is predictable and cacheable, but can be slow with large datasets.
- **Top-N storage** reduces query load, but creates lag for newly added listings until the next run.

#### Real-Time Scoring vs Daily Matches
The system computes match scores in two contexts:
- **Live listing feeds**: computed on read for renter views.
- **Daily recommendations**: computed in batch and stored.

This allows instant personalization without waiting for the daily job, but duplicates computation paths. Long term, precomputed scores or incremental updates would reduce repeated scoring work.

#### Explainability and Auditability
The ML matcher returns a breakdown of sub-scores (base score, behavioral boost, semantic score, etc.). This supports:
- Debugging score anomalies.
- Building user-facing explanations later.

Tradeoff: explanations are approximate when multiple signals are combined, so they must be framed as “contributors” rather than deterministic reasons.

#### Data Quality and Cold Start
Behavioral and collaborative signals are sparse for new users. The hybrid design mitigates this by:
- Falling back to rule-based scoring when no behavioral data exists.
- Using similarity on declared preferences rather than only historical behavior.

Tradeoff: early recommendations are less personalized but stable and predictable.

#### Performance Considerations
- Embedding generation is the most expensive operation and is disabled by default.
- Batch complexity scales with renters × listings, so geography-based partitioning or incremental matching will be required at scale.

### Preferences and Onboarding
Preferences are captured separately for renters and landlords:
- Renters provide budget, location, move-in timing, amenities, and behavioral flexibility.
- Landlords define tenant requirements and lease parameters.

This split is intentional to avoid overloading a single preference schema with role-specific data. The tradeoff is more onboarding logic and data management in exchange for clearer domain modeling.

#### Onboarding Flow Details
The frontend routes users to `/onboarding` based on missing preference records after login. This guarantees that:
- Renters have the data needed to compute matches.
- Landlords provide tenant requirements used in compatibility scoring.

Tradeoff: onboarding is a hard gate for personalized features, which may frustrate users who want to browse first. The project mitigates this by allowing unauthenticated browsing.

### Payments and Blockchain (Planned)
Models and routers exist for payment records and blockchain transactions. This indicates a future roadmap for:
- On-chain logging of high-value actions (e.g., deposits or scheduled visits).
- Tokenized payments or fee mechanisms.

At present, these endpoints are not wired to real providers. This keeps the current codebase focused on matching and listings while leaving room for later monetization or compliance features.

## Frontend Design
### Routing and Page Structure
The frontend uses React Router to support:
- Public browsing (`/`, `/listings`, `/listing/:id`).
- Auth-required routes (`/saved`, `/profile`, `/onboarding`, `/listing/edit/:id`).
- OAuth callback handling.

This design supports optional authentication: users can explore listings without signing in, but personalized actions require a session.

### Auth Context and Token Management
The auth context (`src/context/authContext.js`) manages:
- Token persistence in `localStorage`.
- Axios default authorization headers.
- Global 401 handling with redirect and session expiration messaging.

Tradeoff: storing tokens in `localStorage` is straightforward and compatible with SPAs, but has XSS exposure risk. An HttpOnly cookie strategy would reduce that risk but would complicate CSRF protections and cross-site deployment.

#### State Hydration and Error Handling
On initial load, the frontend:
- Reads stored auth state from `localStorage`.
- Sets Axios default headers for all requests.
- Registers a response interceptor to redirect on 401s.

This reduces duplicated auth handling in components, but can lead to implicit navigation changes from deep within the app if a request fails. It also assumes that the token is valid for all API requests until the server rejects it.

### Build and Asset Pipeline
The frontend uses Vite with `frontend/index.html` as the entry point and `src/index.js` as the JS bootstrap. Production builds output to `dist/`, and environment variables are loaded via `import.meta.env`.

### API Layer
Axios is configured with a base URL and global interceptors (`src/api/axiosConfig.js`). This centralizes error handling and keeps API calls consistent across components. The tradeoff is that the interceptor assumes a single auth mechanism and may need customization for multi-tenant or multi-origin deployments.

## API Surface and Contracts
The API is exposed under `/api` and documented via FastAPI’s automatic docs at `/docs`. Contracts are defined with Pydantic schemas, which enforce:
- Strong request validation.
- Stable response models.
- Easy-to-consume frontend types.

The system’s API is divided into functional modules: auth, users, preferences, listings, matches, and future payments/wallet/blockchain.

### API Behavior Nuances
- Some preference endpoints exist in both `users` and `preferences` routers, which creates overlap in routing responsibilities. This is manageable for now but could lead to drift or inconsistent validation unless consolidated.
- Listing image uploads are restricted to authenticated landlords; production should additionally validate file size, file type, and scan content.

## Background Processing
Daily matches are computed by a scheduled Celery task. This keeps heavy computation off the request path and allows matching to scale independently of API traffic. The tradeoff is increased operational overhead and a need for monitoring of queue health and task latency.

### Operational Tradeoffs
- **Celery + Redis** gives strong background capability with retries and scheduling, but adds components to deploy and monitor.
- **Batch jobs** make performance easier to predict, but can cause stale recommendations if listings or preferences change mid-day.

## Deployment and Operations
### Deployment Model
Recommended deployment splits:
- Backend: ASGI server (Gunicorn + Uvicorn workers) behind a reverse proxy.
- Frontend: static build served from a CDN or static hosting.
- Workers: Celery and beat as separate processes/containers.
- Database: managed PostgreSQL with automated backups.

### Configuration
Environment variables drive:
- Database connection.
- OAuth credentials.
- JWT and session secrets.
- Matching mode toggles.
- Redis connection for background jobs.

This setup allows changes without code deployments but requires disciplined secret management and environment parity across stages.

## Security Considerations
Current safeguards:
- Password hashing with bcrypt (plus SHA-256 pre-hash).
- JWT-based authentication and role checks.
- OAuth session support.

Gaps and recommended improvements:
- Rate limiting on auth and contact endpoints.
- Migration from local file storage to managed object storage.
- Structured audit logs for sensitive actions.
- Centralized monitoring for abnormal login and token usage patterns.

## Performance and Scaling Considerations
- **Listing scoring cost** grows with number of listings because match scores are computed on read for renters. A caching or precomputed score table would reduce response time.
- **Daily match batch** scales with number of renters × listings. For large data sets, partitioning by geography or incremental updates are needed.
- **JSON fields** reduce join complexity but limit index usage, which can slow filters at scale.

## Known Limitations
- Semantic matching depends on optional model downloads and is not enabled by default.
- Matching and listing scoring remain synchronous in some read paths, which can be costly at scale.
- File uploads are stored locally and need production hardening.
- Tests exist in the stack but coverage is minimal.

## Design Decisions and Tradeoffs (Summary)
- **Hybrid matching**: preserves explainability while enabling personalization, at the cost of extra compute and model dependencies.
- **Optional auth for browsing**: lowers user friction, but complicates API behavior (scores depend on auth state).
- **Local uploads**: fast for development, but not resilient or scalable in production.
- **JWT sessions**: simple and stateless, but require careful handling of token revocation.

## Next Steps for Hardening
- Introduce caching or precomputed match scores for listing feeds.
- Add rate limiting and abuse protection.
- Move uploads to object storage and add virus scanning.
- Expand test coverage and add CI.
- Instrument metrics for match quality and conversion.

# Nestopia

Nestopia is a full-stack rental housing platform that matches renters with landlords based on preferences and property features. The system calculates compatibility scores between renter requirements and available listings, facilitating direct contact between parties through email and phone.

## Architecture

The application consists of a React frontend and a FastAPI backend with PostgreSQL. The frontend provides a responsive interface for browsing listings, managing profiles, and initiating contact. The backend handles authentication, preference matching, listing management, and contact information management.

## Features

### Authentication and User Management

- Email and password authentication with bcrypt password hashing
- Google OAuth integration
- Role-based access control (renter or landlord)
- JWT token-based session management
- User profile management including name, bio, profile picture, phone number, and location

### Listings Management

**Landlords:**
- Create, edit, and delete property listings
- Upload multiple images per listing
- Define amenities, house rules, pet policies, and lease terms
- View and manage their own listings

**Renters:**
- Browse all available listings
- Save listings for later reference
- View detailed property information including images, specifications, and landlord contact details

### Compatibility Scoring

The system calculates compatibility scores by comparing renter preferences against landlord requirements and property features. The scoring algorithm considers:

- Budget range versus rent price
- Bedroom and bathroom requirements
- Unit and building amenities
- Pet policies and tenant requirements
- Lease length and move-in timing
- Household size versus maximum occupants
- Custom preference tags

Scores are calculated using weighted criteria, with partial mismatches resulting in point deductions rather than complete exclusion. The final score is normalized to a 0-100 percentage.

### Direct Contact System

- Listing detail pages display landlord contact information (email and phone)
- Contact details are only revealed when authenticated users click contact buttons
- Pre-filled email templates include listing context
- Optional Calendly integration for tour scheduling
- Unauthenticated users are redirected to login when attempting to contact landlords

### Optional Authentication

- Listings can be browsed without authentication
- Match scores and personalized features require authentication
- Landlords can toggle between viewing their own listings and viewing all listings as renters would
- Contact actions (email, phone, save) require authentication

## Technology Stack

### Frontend

- React 18 with React Router for navigation
- Context API for authentication state management
- Axios for HTTP requests
- CSS for styling (no CSS-in-JS)
- React Icons for iconography

### Backend

- FastAPI (Python 3.11+)
- PostgreSQL with SQLAlchemy ORM
- Alembic for database migrations
- Authlib for Google OAuth
- python-jose for JWT token handling
- Celery with Redis for background job processing
- Bcrypt for password hashing

## Project Structure

```
Nestopia/
├── backend/
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── crud/             # Database operations
│   │   ├── db/               # SQLAlchemy models and session
│   │   ├── core/             # Security and configuration
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic and background jobs
│   │   └── utils/            # Matching algorithms and utilities
│   ├── alembic/              # Database migration files
│   ├── uploads/              # User-uploaded files
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── context/          # React context providers
│   │   ├── pages/            # Route-level page components
│   │   ├── api/              # API client functions
│   │   └── index.css         # Global stylesheet
│   └── package.json
│
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js 18 or higher
- Python 3.11 or higher
- PostgreSQL 14 or higher
- Redis (for background job processing)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables by creating a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/nestopia
SECRET_KEY=your_64_character_secret_key_here
FRONTEND_URL=http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Matching configuration
USE_ML_MATCHING=true
USE_SEMANTIC_MATCHING=false

# Payment integration (future improvement - not currently implemented)
# PAYMENT_PROVIDER=402pay
# PAYMENT_API_KEY=your_api_key
# PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# h402 payment rail (future improvement - not currently implemented)
# H402_ENABLED=false
# H402_FACILITATOR_URL=http://localhost:9402
# H402_NAMESPACE=evm
# H402_NETWORK_ID=56
# H402_TOKEN_ADDRESS=0x55d398326f99059fF775485246999027B3197955
# H402_TOKEN_SYMBOL=USDT
# H402_TOKEN_DECIMALS=6
# H402_PAY_TO_ADDRESS=your_wallet_address
# H402_RPC_URL=https://bsc-dataseed.binance.org

# Background workers
REDIS_URL=redis://localhost:6379/0

# OAuth configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET_KEY=your_session_secret_key
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
# REACT_APP_H402_RPC_URL=https://bsc-dataseed.binance.org
# REACT_APP_ENABLE_H402=false
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Background Workers

The matching system uses Celery for background job processing. To run the workers:

1. Start Redis:
```bash
redis-server
```

2. Start the Celery worker:
```bash
cd backend
celery -A celery_app.celery worker -l info
```

3. Start the Celery beat scheduler:
```bash
celery -A celery_app.celery beat -l info
```

The beat scheduler runs the daily matching job every 24 hours. You can also trigger it manually:
```bash
celery -A celery_app.celery call app.services.matching.compute_daily_matches
```

## Compatibility Scoring Algorithm

### Weighting Matrix

The rule-based scoring algorithm uses the following weights:

| Category | Weight |
|----------|--------|
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

Total: 100 (normalized to 0-1 scale)

### Preference Schemas

**Renter Preferences:**
- Budget range (min/max)
- Bedroom and bathroom requirements
- Household size
- Preferred locations
- Move-in date preference
- Lease length preference
- Property amenities list
- Building amenities list
- Pet policy preference
- Smoking preference
- Noise tolerance
- Visitor flexibility
- Custom preference tags

**Landlord Preferences:**
- Tenant requirements list
- Default lease length
- Pet policy
- Custom requirements

**Listing Properties:**
- Property type
- Location
- Rent price
- Bedrooms and bathrooms
- Square footage
- Available from date
- Maximum occupants
- Amenities
- Building features
- Pet policy
- Lease terms
- Custom tags
- Neighborhood description and profile

### Machine Learning Matching

When `USE_ML_MATCHING=true`, the system uses an enhanced matching pipeline that incorporates:

- Behavioral signals from user interactions (saved listings, visit requests)
- Collaborative filtering based on similar users' preferences
- Enhanced location matching using geographic proximity
- Improved timing matching with date parsing

When `USE_SEMANTIC_MATCHING=true`, the system additionally uses sentence embeddings to compare free-form text fields like descriptions and custom tags. This requires the `sentence-transformers` and `torch` packages, which will download an approximately 80 MB model on first use.

## API Reference

All API endpoints are prefixed with `/api`. Most endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header. Interactive API documentation is available at `/docs` when the server is running.

### Authentication Endpoints

- `POST /api/auth/signup` - Create a new user account (renter or landlord)
- `POST /api/auth/login` - Authenticate with email and password
- `GET /api/auth/google/login?role={renter|landlord}` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/password-reset/request` - Request password reset token
- `POST /api/auth/password-reset/confirm` - Confirm password reset with token

### User Endpoints

- `GET /api/users/me` - Get current user profile (requires authentication)
- `PATCH /api/users/me` - Update current user profile (requires authentication)
- `POST /api/users/change-password` - Change user password (requires authentication)

### Preferences Endpoints

- `POST /api/preferences/renter` - Create or update renter preferences (requires authentication, renter role)
- `GET /api/preferences/renter` - Get renter preferences (requires authentication, renter role)
- `POST /api/preferences/landlord` - Create or update landlord preferences (requires authentication, landlord role)
- `GET /api/preferences/landlord` - Get landlord preferences (requires authentication, landlord role)

### Listing Endpoints

- `GET /api/listings` - Get all listings (optional authentication)
  - Unauthenticated: all listings without match scores
  - Renters: all listings with match scores
  - Landlords: own listings by default, or all listings if `view_as_renter=true` query parameter is set
- `GET /api/listings/{id}` - Get specific listing details (no authentication required)
- `POST /api/listings` - Create new listing (requires authentication, landlord role)
- `PUT /api/listings/{id}` - Update listing (requires authentication, landlord role, must own listing)
- `DELETE /api/listings/{id}` - Delete listing (requires authentication, landlord role, must own listing)
- `POST /api/listings/upload-image` - Upload listing image (no authentication required, should be restricted in production)
- `POST /api/listings/saved/{listing_id}` - Save listing (requires authentication)
- `DELETE /api/listings/saved/{listing_id}` - Unsave listing (requires authentication)
- `GET /api/listings/saved` - Get saved listings (requires authentication)

### Matching Endpoints

- `GET /api/matches/daily` - Get daily matches for current user (requires authentication, renter role)

### Statistics Endpoints

- `GET /api/stats/summary` - Get platform statistics (no authentication required)

### Payment Endpoints (Future Improvement)

Payment functionality is planned but not currently implemented. The following endpoints exist in the codebase but are not active:

- `POST /api/payments/initiate` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment with h402 header
- `GET /api/payments` - Get payment history
- `GET /api/payments/{id}` - Get specific payment record

### Wallet Endpoints (Future Improvement)

Wallet functionality is planned but not currently implemented:

- `POST /api/wallet/connect` - Store wallet address
- `GET /api/wallet` - Get stored wallet address

### Blockchain Endpoints (Future Improvement)

Blockchain transaction logging is planned but not currently implemented:

- `POST /api/blockchain/schedule-visit` - Log visit scheduling transaction
- `POST /api/blockchain/deposit` - Log deposit transaction
- `GET /api/blockchain/transactions` - Get blockchain transaction log

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts with authentication and profile information
- `listings` - Property listings with details and images
- `renter_preferences` - Renter preference profiles
- `landlord_preferences` - Landlord preference profiles
- `saved_listings` - Many-to-many relationship between users and saved listings
- `daily_matches` - Computed compatibility matches
- `visit_requests` - Visit scheduling requests
- `payment_records` - Payment transaction records
- `blockchain_transactions` - Blockchain transaction audit log

Database migrations are managed with Alembic. Create new migrations with:
```bash
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```

## Testing

### Backend Testing

Run tests from the backend directory:
```bash
cd backend
pytest
```

Tests are located in the `backend/tests/` directory. Add test suites as you develop new features.

### Frontend Testing

Run tests from the frontend directory:
```bash
cd frontend
npm test
```

The project uses Jest and React Testing Library. ESLint runs automatically during development.

## Deployment

### Backend Deployment

For production, use a production ASGI server:
```bash
gunicorn -k uvicorn.workers.UvicornWorker app.main:app
```

Deploy behind an HTTPS reverse proxy (Nginx, Caddy, or cloud load balancer). Set environment variables through your deployment platform's secrets management.

### Frontend Deployment

Build the production bundle:
```bash
cd frontend
npm run build
```

Deploy the `frontend/build` directory to a static hosting service or CDN. Ensure `REACT_APP_API_BASE_URL` is set to your production API URL before building.

### Database

Use managed PostgreSQL with automated backups. Run migrations as part of your deployment process:
```bash
alembic upgrade head
```

### Background Workers

Deploy Celery workers and beat scheduler as separate processes or containers. Monitor worker health and job completion rates.

### File Storage

The `uploads/` directory currently stores files on disk. For production, migrate to object storage (S3, GCS, or similar) or mount persistent volumes.

## Security Considerations

- Rotate `SECRET_KEY` and `SESSION_SECRET_KEY` regularly and whenever credentials are compromised
- Never commit `.env` files or secrets to version control
- Enforce HTTPS/TLS in production to protect JWT tokens
- Implement rate limiting on authentication and contact endpoints
- Use a secrets management service for production credentials
- Regularly audit and purge personal data according to privacy policies
- Implement proper CORS configuration for production domains
- Consider adding request rate limiting middleware (e.g., `slowapi`)
- Monitor for suspicious activity and failed authentication attempts

## Monitoring and Logging

- Set up centralized logging (OpenTelemetry, Sentry, or similar)
- Monitor API response times and error rates
- Track background job completion and failures
- Monitor database query performance
- Set up alerts for critical failures (payment processing, authentication issues)

## Known Limitations and Future Improvements

Current limitations:

- Semantic matching requires additional dependencies and model downloads
- Test coverage is minimal and should be expanded
- File storage uses local filesystem (should migrate to object storage for production)
- Rate limiting is not currently implemented
- Real-time notifications are not implemented
- Audit logging needs production-ready implementation

Planned future improvements:

- Payment integration with 402pay and h402 payment rail
- Wallet connection and management
- Blockchain transaction logging for visit scheduling and deposits
- Enhanced matching algorithms with machine learning
- Real-time notifications for contact requests and listing updates

## License

This project is licensed under the MIT License. See the LICENSE file for details.

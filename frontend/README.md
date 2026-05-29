# Nestopia Frontend

React 19 single-page app for renters and landlords. In development, Create React App proxies `/api` to the FastAPI backend on port 8000.

## Run locally

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). No `.env` is required for local dev.

Production build:

```bash
REACT_APP_API_BASE_URL=https://your-api.example.com npm run build
```

Start the backend separately from `backend/` (`uvicorn app.main:app --reload`).

## Structure

```
src/
├── api/                    # HTTP clients
│   ├── auth.js             # signup, login, 2FA
│   ├── listings.js         # CRUD, saved, images
│   ├── matches.js          # daily matches, formatMatchPercent helpers
│   ├── preferences.js      # renter prefs, move-in/amenity helpers
│   ├── applications.js     # rental application workflow
│   ├── geo.js              # location search wrapper
│   └── user.js             # profile, contact channels, public profiles
├── components/
│   ├── matches/            # MatchBreakdown card (% + property/tenant fit)
│   ├── preferences/        # form pickers, display cards, tenant requirements
│   ├── profile/            # profile detail panels, activity
│   ├── listings/           # listingCard, image carousel
│   ├── ListingsMap.jsx     # browse map with match % pins
│   ├── GeoLocationSearch.jsx
│   ├── ListingMiniMap.jsx
│   └── EmptyState.js
├── context/
│   ├── authContext.js      # session restore, login/signup, onboarding redirect
│   └── NestopiaContext.js  # listings, saved IDs, preferences, toasts
├── pages/                  # route-level screens (see table below)
└── index.css               # global design system
```

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | `home.js` | Landing |
| `/login`, `/signup` | `login.js` | Email + Google OAuth |
| `/onboarding` | `onboarding.js` | Renters set prefs; landlords → create listing |
| `/listings` | `listings.js` | Map + grid, match % on cards |
| `/listing/:id` | `listingDetail.js` | Detail, tenant requirements, match breakdown |
| `/listing/new` | `listingForm.js` | Create listing + tenant requirements |
| `/listing/edit/:id` | `listingForm.js` | Edit; import tenant reqs from owned listings |
| `/matches` | `matches.js` | Daily ranked matches (renters) |
| `/saved` | `saved.js` | Saved listings |
| `/preferences` | `preferences.js` | Edit renter housing preferences |
| `/profile` | `profile.js` | Tabs: overview, prefs/listings, saved, activity, security |
| `/users/:id` | `userProfile.js` | Public profile + reviews |

## Key flows

### Auth

- Session is an httpOnly cookie (`nestopia_session`); tokens are not stored in `localStorage`
- `axiosConfig.js` sends credentials and handles 401 → login redirect
- 2FA: login may return `requires_2fa`; complete via `/api/auth/verify-2fa`
- Security tab: TOTP setup via `/api/security/totp/*`

### Compatibility scores

- Backend returns `match_score` (0–1) and `match_breakdown` on listings for logged-in renters
- Use `getListingMatchPercent()` from `api/matches.js` everywhere — prefers breakdown over raw score
- Listing detail waits for API fetch before showing match UI (avoids stale cached %)
- `MatchBreakdownCard` shows overall %, property fit, tenant fit, and expandable factor details

### Preferences and tenant requirements

- **Renters:** budget, locations (OSM search), move-in window, amenities, lifestyle fields
- **Landlords:** tenant requirements are **per listing** in `listingForm.js`, not global profile prefs
- `components/preferences/display.js` — `PreferencesDisplayCard`, `ListingTenantRequirementsCard`
- `components/preferences/form.js` — `MoveInFields`, `AmenitiesPicker`, chip pickers

### Contact and applications

- `listingDetail.js` — contact host via preferred channel (email/phone/text)
- Contact creates application via `applyFromContact()` → profile Activity tab
- Landlords accept/reject; both sides propose and confirm tour times

### Maps

- `ListingsMap.jsx` — browse page map with price pins and match %
- `GeoLocationSearch.jsx` — Nominatim search via `GET /api/geo/search`
- `ListingMiniMap.jsx` — single-listing map on detail page

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server with hot reload + API proxy |
| `npm test` | Jest + React Testing Library |
| `npm run build` | Production bundle in `build/` |

## Environment

| Variable | When | Purpose |
|----------|------|---------|
| `REACT_APP_API_BASE_URL` | Production build | API origin (omit in dev — uses proxy) |

Do not commit `.env` with secrets.

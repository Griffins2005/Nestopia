# Nestopia Frontend (Vite)

This frontend is built with React and Vite. Vite provides a faster dev server and a leaner production build pipeline than the legacy Create React App toolchain.

## Directory Layout

```
frontend/
├── public/                 # Static assets served as-is
├── src/
│   ├── api/                # Axios instances and API helpers
│   ├── components/         # Reusable UI components by domain
│   ├── context/            # React context providers
│   ├── images/             # Image assets used by components
│   ├── pages/              # Route-level pages
│   ├── App.jsx             # Route wiring and layout
│   ├── index.css           # Global styles
│   └── index.jsx           # App entrypoint
├── index.html              # Vite HTML entry
├── package.json
└── vite.config.js
```

## Scripts

In the `frontend/` directory:

### `npm start`
Starts the Vite dev server at `http://localhost:3000`.

### `npm run build`
Creates a production build in `dist/`.

### `npm run preview`
Serves the production build locally for verification.

## Environment Variables

The app reads variables prefixed with `REACT_APP_` (configured in `vite.config.js`), for example:

```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```

Notes:
- If `REACT_APP_GOOGLE_MAPS_API_KEY` is not set, location autocomplete is disabled and the profile form falls back to manual entry.

## Component Domains

Key component groups under `src/components/`:
- `auth/`: login, signup, role chooser, Google OAuth button
- `listings/`: listing create/edit/details, saved listings, share
- `matches/`: daily matches list and preference matcher
- `preferences/`: preference forms and display
- `profile/`: profile details, edit, password change

## Build Output

`npm run build` outputs production assets to `dist/`.

// In dev, use the CRA proxy (same origin) so httpOnly cookies work without cross-origin setup.
// Production calls the Render API. REACT_APP_API_BASE_URL overrides that when set.
const RENDER_API_ORIGIN = 'https://nestopia-api-5fod.onrender.com';

function normalizeApiBaseUrl(raw) {
  const trimmed = (raw || '').trim().replace(/\/$/, '');
  if (!trimmed) return '';

  // Absolute URL — use as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Hostname without scheme (common Vercel misconfig) → treat as https API origin
  if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Relative path — invalid for production cross-origin API
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error(
      `[Nestopia] REACT_APP_API_BASE_URL must be a full URL (e.g. ${RENDER_API_ORIGIN}). Got: "${trimmed}"`,
    );
  }
  return trimmed;
}

const fromEnv = (process.env.REACT_APP_API_BASE_URL || '').trim();
const raw =
  fromEnv || (process.env.NODE_ENV === 'production' ? RENDER_API_ORIGIN : '');

export const API_BASE_URL = normalizeApiBaseUrl(raw);

/** Resolve /static/... paths against the API origin (works in dev proxy + production). */
export function apiAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}


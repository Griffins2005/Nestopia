// In dev, use the CRA proxy (same origin) so httpOnly cookies work without cross-origin setup.
// In production (Vercel), set REACT_APP_API_BASE_URL to your API origin including https://

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
      `[Nestopia] REACT_APP_API_BASE_URL must be a full URL (e.g. https://nestopia-production.up.railway.app). Got: "${trimmed}"`,
    );
  }
  return trimmed;
}

const raw =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'development'
      ? ''
      : '';

export const API_BASE_URL = normalizeApiBaseUrl(raw);

/** Resolve /static/... paths against the API origin (works in dev proxy + production). */
export function apiAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

if (process.env.NODE_ENV === 'production' && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Nestopia] REACT_APP_API_BASE_URL is not set. API requests will fail until you configure it in Vercel.',
  );
}

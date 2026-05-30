// In dev, use the CRA proxy (same origin) so httpOnly cookies work without cross-origin setup.
// In production (e.g. Vercel), set REACT_APP_API_BASE_URL to your deployed API origin.
const raw =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'development'
      ? ''
      : '';

export const API_BASE_URL = raw.replace(/\/$/, '');

if (process.env.NODE_ENV === 'production' && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Nestopia] REACT_APP_API_BASE_URL is not set. API requests will fail until you configure it in Vercel.',
  );
}

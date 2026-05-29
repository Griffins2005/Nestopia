// In dev, use the CRA proxy (same origin) so httpOnly cookies are sent.
// In production, set REACT_APP_API_BASE_URL to your API origin.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL !== undefined
    ? process.env.REACT_APP_API_BASE_URL
    : process.env.NODE_ENV === 'development'
      ? ''
      : '';

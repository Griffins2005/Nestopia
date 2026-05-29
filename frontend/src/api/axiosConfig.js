// Shared API client — session via httpOnly cookie (withCredentials).
import axios from 'axios';
import { API_BASE_URL } from './getBaseUrl';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const AUTH_ROUTES = ['/api/auth/login', '/api/auth/signup'];

let onUnauthorized = null;

/** AuthProvider registers this to clear session + navigate without reload loops. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = AUTH_ROUTES.some((route) => url.includes(route));

    if (status === 401 && !isAuthAttempt && onUnauthorized) {
      onUnauthorized(error);
    }

    return Promise.reject(error);
  }
);

export default api;

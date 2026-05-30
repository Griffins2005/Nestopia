// Shared API client — session via httpOnly cookie (withCredentials).
import axios from 'axios';
import { API_BASE_URL } from './getBaseUrl';
import endpoints from './endpoints';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const SILENT_401_ROUTES = [
  endpoints.auth.login,
  endpoints.auth.signup,
  endpoints.users.me,
];

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
    const skipUnauthorized = SILENT_401_ROUTES.some((route) => url.includes(route));

    if (status === 401 && !skipUnauthorized && onUnauthorized) {
      onUnauthorized(error);
    }

    return Promise.reject(error);
  }
);

export default api;

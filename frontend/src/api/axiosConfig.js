// src/api/axiosConfig.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Axios interceptor: redirect to login if token is expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      window.localStorage.removeItem("user"); // optional: clear user data
      window.location = "/login?expired=1";
    }
    return Promise.reject(error);
  }
);

export default api;

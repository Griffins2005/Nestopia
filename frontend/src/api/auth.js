// src/api/auth.js
import api from "./axiosConfig";

export function login(email, password) {
  return api.post("/api/auth/login", { email, password });
}

export function signup(email, password, role) {
  return api.post("/api/auth/signup", { email, password, role });
}

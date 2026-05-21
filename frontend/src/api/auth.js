// src/api/auth.js
import api from "./axiosConfig";

export function login(email, password, role) {
  return api.post("/api/auth/login", { email, password, role });
}

export function signup(email, password, role) {
  return api.post("/api/auth/signup", { email, password, role });
}

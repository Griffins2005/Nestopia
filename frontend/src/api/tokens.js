// src/api/tokens.js
import api from "./axiosConfig";

/**
 * GET current user’s token balance
 * GET /api/users/me/tokens
 */
export function getTokenBalance() {
  return api.get("/api/users/me/tokens");
}

/**
 * DEDUCT tokens from current user (e.g., to spend 10 tokens for scheduling)
 * POST /api/users/me/tokens/spend
 * payload: { amount: 10 }
 * 
 * (If your backend expects a different route or method, adjust accordingly.)
 */
export function spendTokens(amount) {
  return api.post("/api/users/me/tokens/spend", { amount });
}

/**
 * TOGGLE priority matching (deduct 20 tokens once)
 * POST /api/users/me/priority
 */
export function enablePriorityMatching() {
  return api.post("/api/users/me/priority");
}

// src/api/tokens.js
import api from "./axiosConfig";

/**
 * GET current user’s token balance
 * GET /api/tokens/balance/
 */
export function getTokenBalance() {
  return api.get("/api/tokens/balance/");
}

/**
 * DEDUCT tokens from current user (e.g., to spend 10 tokens for scheduling)
 * POST /api/tokens/spend/
 */
export function spendTokens(amount, reason = "manual_spend") {
  return api.post("/api/tokens/spend/", null, {
    params: { amount, reason },
  });
}

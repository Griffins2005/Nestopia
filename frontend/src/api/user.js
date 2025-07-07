// src/api/user.js
import api from "./axiosConfig";

/**
 * GET current authenticated user’s details
 * GET /api/users/me
 * returns { id, email, role, wallet_address, is_priority, ... }
 */
export function getCurrentUser() {
  return api.get("/api/users/me");
}

/**
 * LINK a Web3 wallet (e.g., MetaMask address) to the user
 * POST /api/users/link-wallet
 * payload: { wallet_address: "0xABC123..." }
 */
export function linkWallet(walletAddress) {
  return api.post("/api/users/link-wallet", { wallet_address: walletAddress });
}

/**
 * (Optional) If you have an endpoint to fetch visit requests or other user-specific data:
 * GET /api/users/me/visit-requests
 */
export function getVisitRequests() {
  return api.get("/api/users/me/visit-requests");
}

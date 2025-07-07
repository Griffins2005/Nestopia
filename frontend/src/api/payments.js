// src/api/payments.js
import api from "./axiosConfig";

/**
 * CREATE A STRIPE PAYMENT INTENT
 * POST /api/payments/create-payment-intent
 * payload example:
 * {
 *   amount: 1000,               // in cents ($10.00)
 *   currency: "usd",
 *   metadata: { package: "100_tokens" }
 * }
 */
export function createPaymentIntent(payload) {
  return api.post("/api/payments/create-payment-intent", payload);
}

/**
 * (Optional) If you have an endpoint to fetch available token packages:
 * GET /api/payments/packages
 */
export function getTokenPackages() {
  return api.get("/api/payments/packages");
}

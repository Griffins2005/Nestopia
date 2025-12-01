// src/api/payments.js
import api from "./axiosConfig";

/**
 * Initiate a 402pay charge (simulated server-side).
 * POST /api/payments/initiate
 */
export function initiatePayment(payload) {
  return api.post("/api/payments/initiate", payload);
}

/**
 * Get the authenticated user's payment history.
 * GET /api/payments
 */
export function listPayments() {
  return api.get("/api/payments");
}

/**
 * Fetch an individual payment receipt.
 * GET /api/payments/:id
 */
export function getPayment(paymentId) {
  return api.get(`/api/payments/${paymentId}`);
}

/**
 * Confirm a signed h402 payment header.
 * POST /api/payments/confirm
 */
export function confirmPayment(payload) {
  return api.post("/api/payments/confirm", payload);
}

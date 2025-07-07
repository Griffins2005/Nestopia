// src/api/chat.js
import api from "./axiosConfig";

/**
 * GET chat messages for a given listing.
 * GET /api/listings/{listingId}/messages
 */
export function getMessages(listingId) {
  return api.get(`/api/listings/${listingId}/messages`);
}

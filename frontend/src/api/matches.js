// src/api/matches.js
import api from "./axiosConfig";

/**
 * GET DAILY MATCHES FOR CURRENT RENTER
 * Expects query parameter: ?date=YYYY-MM-DD
 *
 * e.g., GET /api/renter/matches?date=2025-06-05
 */
export function getDailyMatches(dateString) {
  return api.get("/api/renter/matches", {
    params: { date: dateString },
  });
}

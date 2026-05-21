// src/api/matches.js
import api from "./axiosConfig";

/**
 * GET DAILY MATCHES FOR CURRENT RENTER
 * Backend currently returns the current user's ranked daily matches.
 */
export function getDailyMatches() {
  return api.get("/api/matches/daily");
}

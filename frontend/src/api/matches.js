// src/api/matches.js
import api from "./axiosConfig";

/**
 * GET DAILY MATCHES FOR CURRENT RENTER
 * Backend returns ranked listings with match_score (0–1) and optional match_breakdown.
 */
export function getDailyMatches() {
  return api.get("/api/matches/daily");
}

/** Normalize match_score to a 0–100 integer for display. */
export function formatMatchPercent(score) {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  const pct = n <= 1 ? n * 100 : n;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

/** Canonical 0–1 match fraction — breakdown wins over stale match_score. */
export function getListingMatchFraction(listing) {
  const b = listing?.match_breakdown;
  if (b?.overall != null) return Number(b.overall);
  if (b?.overall_percent != null) return Number(b.overall_percent) / 100;
  if (listing?.match_score != null) return Number(listing.match_score);
  return null;
}

export function getListingMatchPercent(listing) {
  const fraction = getListingMatchFraction(listing);
  return fraction == null ? 0 : formatMatchPercent(fraction);
}

export function getMatchBreakdown(listing) {
  return listing?.match_breakdown || null;
}

/** Strip match fields so cached listings never flash stale scores. */
export function stripMatchFields(listing) {
  if (!listing) return listing;
  return { ...listing, match_score: null, match_breakdown: null };
}

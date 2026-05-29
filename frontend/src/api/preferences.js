// src/api/preferences.js
import api from "./axiosConfig";

/** Parse stored move_in: `YYYY-MM-DD` or `YYYY-MM-DD/YYYY-MM-DD` */
export function parseMoveInWindow(stored) {
  if (!stored || typeof stored !== 'string') return { from: '', to: '' };
  const trimmed = stored.trim();
  if (trimmed.includes('/')) {
    const [from, to] = trimmed.split('/');
    return { from: (from || '').trim(), to: (to || '').trim() };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { from: trimmed, to: '' };
  }
  return { from: '', to: '' };
}

export function formatMoveInForApi(from, to) {
  if (!from) return '';
  return to && to >= from ? `${from}/${to}` : from;
}

export function formatMoveInDisplay(stored) {
  if (!stored) return '';
  const { from, to } = parseMoveInWindow(stored);
  if (!from) return stored;
  const fmt = (iso) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  if (!to) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
}

/** Clamp typed number input; returns undefined to skip invalid input. */
export function clampNumber(raw, min, max) {
  if (raw === '') return '';
  let n = parseInt(raw, 10);
  if (Number.isNaN(n)) return undefined;
  if (min != null) n = Math.max(min, n);
  if (max != null) n = Math.min(max, n);
  return n;
}

export function formatLandlordPrefsForApi(form) {
  return {
    tenant_preferences: form.tenant_preferences || [],
    lease_length: Number(form.lease_length) || 12,
    pets_allowed: Boolean(form.pets_allowed),
    custom_requirements: form.custom_requirements || [],
  };
}

/** Trim and collapse whitespace for user-entered tags. */
export function normalizeCustomTag(raw) {
  return (raw || '').trim().replace(/\s+/g, ' ');
}

export function getRenterPreferences() {
  return api.get("/api/preferences/renter");
}

export function setRenterPreferences(preferencePayload) {
  return api.post("/api/preferences/renter", preferencePayload);
}

export function getLandlordPreferences() {
  return api.get("/api/preferences/landlord");
}

export function setLandlordPreferences(preferencePayload) {
  return api.post("/api/preferences/landlord", preferencePayload);
}

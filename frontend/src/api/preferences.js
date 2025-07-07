// src/api/preferences.js
import api from "./axiosConfig";

/**
 * RENTER PREFERENCES
 */
export function getRenterPreferences() {
  // GET existing renter preferences
  return api.get("/api/renter/preferences");
}

export function setRenterPreferences(preferencePayload) {
  // POST or PUT renter preferences
  // preferencePayload example: { max_rent: 1200, desired_location: "Ithaca, NY", pets_allowed: true }
  return api.post("/api/renter/preferences", preferencePayload);
}

/**
 * LANDLORD IDEAL TENANT PREFERENCES
 */
export function getLandlordPreferences() {
  // GET existing landlord preferences
  return api.get("/api/landlord/ideal-preferences");
}

export function setLandlordPreferences(preferencePayload) {
  // POST landlord preferences
  // preferencePayload example:
  // { min_rent_price: 500, max_rent_price: 1500, preferred_location: "Ithaca, NY", pets_preference: "any" }
  return api.post("/api/landlord/ideal-preferences", preferencePayload);
}

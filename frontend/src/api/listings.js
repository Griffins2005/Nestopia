// src/api/listings.js
import api from "./axiosConfig";

/**
 * CREATE A NEW LISTING (landlord only)
 * payload example:
 * {
 *   title: "Cozy 2BR near campus",
 *   description: "Spacious two-bedroom apartment near Ithaca Commons...",
 *   location: "Ithaca, NY",
 *   rent_price: 1200
 * }
 */
export function createListing(payload) {
  return api.post("/api/landlord/listings", payload);
}

/**
 * GET ALL LISTINGS (optional filter later)
 */
export function getAllListings() {
  return api.get("/api/listings/");
}

/**
 * GET CURRENT LANDLORD'S LISTINGS
 */
export function getMyListings() {
  return api.get("/api/landlord/listings");
}

/**
 * GET A SINGLE LISTING BY ID
 */
export function getListingById(listingId) {
  return api.get(`/api/listings/${listingId}`);
}

/**
 * UPDATE A LISTING (landlord only)
 * payload fields: { title, description, location, rent_price, ... }
 */
export function updateListing(listingId, payload) {
  return api.put(`/api/landlord/listings/${listingId}`, payload);
}

/**
 * DELETE A LISTING (landlord only)
 */
export function deleteListing(listingId) {
  return api.delete(`/api/landlord/listings/${listingId}`);
}

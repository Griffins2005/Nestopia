// src/pages/listings.js
import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";

import AuthContext from "../context/authContext";
import ListingCard from "../components/listings/listingCard";

export default function ListingsPage() {
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewAsRenter, setViewAsRenter] = useState(false);

  const isLandlord = user?.role === "landlord";
  const showViewAsRenterToggle = isLandlord;

  useEffect(() => {
    setLoading(true);
    const params = viewAsRenter ? { view_as_renter: true } : {};
    const headers = user?.accessToken 
      ? { Authorization: `Bearer ${user.accessToken}` }
      : {};
    
    axios
      .get("/api/listings/", {
        headers,
        params,
      })
      .then((res) => setListings(res.data || []))
      .catch((err) => {
        if (err.response?.status === 401) {
          // If auth is required but user isn't logged in, allow viewing without auth
          // This shouldn't happen with optional auth, but handle gracefully
          axios
            .get("/api/listings/", { params })
            .then((res) => setListings(res.data || []))
            .catch(() => setListings([]));
        } else {
          setListings([]);
        }
      })
      .finally(() => setLoading(false));
  }, [user, viewAsRenter]);

  useEffect(() => {
    if (user?.role === "renter" || (user?.role === "landlord" && viewAsRenter)) {
      axios
        .get("/api/listings/saved/", {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        })
        .then((res) => setSavedIds(res.data.map((l) => l.id)))
        .catch(() => setSavedIds([]));
    } else {
      setSavedIds([]);
    }
  }, [user, viewAsRenter]);

  const filteredListings = useMemo(() => {
    if (!query.trim()) return listings;
    const lower = query.toLowerCase();
    return listings.filter((listing) => {
      const title = listing.title?.toLowerCase() || "";
      const location = listing.location?.toLowerCase() || "";
      return title.includes(lower) || location.includes(lower);
    });
  }, [listings, query]);

  return (
    <div className="listings-shell">
      <section className="listings-hero">
        <div className="listings-hero-text">
          <p className="eyebrow">Curated for you</p>
          <h1>
            {isLandlord && !viewAsRenter
              ? "My Listings"
              : "Available Listings"}
          </h1>
          <p>
            {isLandlord && !viewAsRenter
              ? "Manage your property listings and view inquiries."
              : "Find your next home from our curated selection of high-match rentals."}
          </p>
        </div>
        <div className="listings-hero-controls">
          {showViewAsRenterToggle && (
            <div className="view-as-renter-toggle">
              <button
                className={`toggle-btn ${viewAsRenter ? "active" : ""}`}
                onClick={() => setViewAsRenter(!viewAsRenter)}
                title={viewAsRenter ? "View as landlord" : "View as renter"}
              >
                {viewAsRenter ? "View My Listings" : "Browse All Listings"}
              </button>
            </div>
          )}
          <div className="search-bar">
            <FiSearch />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for homes, apartments..."
            />
          </div>
          <div className="view-toggle">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={view === "map" ? "active" : ""}
              onClick={() => setView("map")}
              disabled
            >
              Map
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card-surface">Loading listings...</div>
      ) : (
        <div
          className={`listings-grid ${view === "map" ? "listings-grid--map" : ""}`}
        >
          {filteredListings.length === 0 ? (
            <div className="card-surface empty-state">
              No listings found. Try adjusting your search.
            </div>
          ) : (
            filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userRole={viewAsRenter ? "renter" : user?.role}
                initiallySaved={savedIds.includes(listing.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

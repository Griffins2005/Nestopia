// src/pages/listings.js
import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FiSearch, FiGrid, FiMap } from "react-icons/fi";

import AuthContext from "../context/authContext";
import ListingCard from "../components/listings/listingCard";
import ListingsMap from "../components/listings/ListingsMap";

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
      .get("/api/listings/", { headers, params })
      .then((res) => setListings(res.data || []))
      .catch((err) => {
        if (err.response?.status === 401) {
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
        .then((res) =>
          setSavedIds(
            res.data
              .map((item) => item.listing?.id || item.listing_id || item.id)
              .filter(Boolean)
          )
        )
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
            {isLandlord && !viewAsRenter ? "My Listings" : "Available Listings"}
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
                className={`toggle-btn${viewAsRenter ? " active" : ""}`}
                onClick={() => setViewAsRenter(!viewAsRenter)}
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
              title="Grid view"
            >
              <FiGrid style={{ fontSize: "1rem" }} />
            </button>
            <button
              className={view === "map" ? "active" : ""}
              onClick={() => setView("map")}
              title="Map view"
            >
              <FiMap style={{ fontSize: "1rem" }} />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card-surface" style={{ textAlign: "center", padding: "2rem" }}>
          Loading listings…
        </div>
      ) : view === "map" ? (
        <ListingsMap
          listings={filteredListings}
          isRenter={viewAsRenter || !isLandlord}
        />
      ) : (
        <div className="listings-grid">
          {filteredListings.length === 0 ? (
            <div className="card-surface empty-state">
              No listings found. Try adjusting your search.
            </div>
          ) : (
            filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userRole={viewAsRenter || !user ? "renter" : user?.role}
                initiallySaved={savedIds.includes(listing.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

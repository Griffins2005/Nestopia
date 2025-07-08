// src/pages/listings.js
import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/authContext";
import ListingCard from "../components/listings/listingCard";
import axios from "axios";

export default function ListingsPage() {
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/listings/", {
        headers: {
          Authorization: `Bearer ${user?.accessToken || ""}`,
        },
      })
      .then((res) => setListings(res.data || []))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user?.role === "renter") {
      axios
        .get("/api/listings/saved/", {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        })
        .then((res) => setSavedIds(res.data.map((l) => l.id)))
        .catch(() => setSavedIds([]));
    }
  }, [user]);

  return (
    <div className="page-container">
      <div className="listings-header-row">
        <h1>
          {user?.role === "landlord" ? "My Listings" : "Available Listings"}
        </h1>
        <div className="toggle-row">
          <button className={`toggle-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")}>Grid</button>
          {/* <button className={`toggle-btn${view === "map" ? " active" : ""}`} onClick={() => setView("map")}>Map</button> */}
        </div>
      </div>
      {loading ? (
        <div>Loading listings...</div>
      ) : (
        <div className="listings-grid">
          {listings.length === 0 ? (
            <div>No listings found.</div>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userRole={user?.role}
                initiallySaved={savedIds.includes(listing.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

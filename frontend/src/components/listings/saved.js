// src/components/listings/saved.js
import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../../context/authContext";
import SavedOrOwnedListingCard from "./savedorowned";

export default function SavedListingsPage({ mode, onEditListing }) {
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch on mount or when user/mode changes
  useEffect(() => {
    if (!user?.accessToken) return;

    setLoading(true);
    let url;
    if (mode === "owned" && user.role === "landlord") {
      url = "/api/listings/owned";
    } else {
      url = "/api/listings/saved/";
    }

    fetch(url, { headers: { Authorization: `Bearer ${user.accessToken}` } })
      .then((res) => res.json())
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, mode]);

  // Remove deleted listing
  const handleListingDeleted = (deletedId) => {
    setListings((prev) =>
      prev.filter((item) => {
        const id = item.listing?.id || item.id;
        return id !== deletedId;
      })
    );
  };

  if (loading) return <div className="loading">Loading listings...</div>;

  // Set message based on user role and mode
  const isLandlord = mode === "owned" && user?.role === "landlord";
  const emptyMsg = isLandlord
    ? "You don’t have any listings yet."
    : "You haven’t saved any listings yet.";

  if (!listings.length)
    return (
      <div className="no-saved-listings-msg">
        {emptyMsg}
      </div>
    );

  return (
    <div className="saved-listings-page">
      <div className="saved-listings-list">
        {listings.map((item) => {
          // For "owned" mode, API returns listings (no .listing property)
          // For "saved" mode, API returns saved listings with .listing property
          const listing = mode === "owned" ? item : (item.listing || item);
          return (
            <SavedOrOwnedListingCard
              key={listing.id}
              listing={listing}
              userRole={mode === "owned" ? "landlord" : "renter"}
              onListingDeleted={handleListingDeleted}
              onEditListing={mode === "owned" ? onEditListing : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

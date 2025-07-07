// src/components/Matches/DailyMatchesList.jsx
import React from "react";
import ListingCard from "../listings/listingCard";

/**
 * Props:
 *   matches: Array of objects [
 *     { listing_id, title, location, rent_price, compatibility_score }
 *   ]
 */
export default function DailyMatchesList({ matches }) {
  if (!matches || matches.length === 0) {
    return <div style={{ color: "#6B7280" }}>No matches for today.</div>;
  }

  return (
    <div className="matches-grid">
      {matches.map((m) => (
        <ListingCard
          key={m.listing_id}
          listing={{
            id: m.listing_id,
            title: m.title,
            location: m.location,
            rent_price: m.rent_price,
          }}
        />
      ))}
    </div>
  );
}

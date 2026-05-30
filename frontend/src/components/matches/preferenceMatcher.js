import React, { useState, useEffect } from "react";
import { getDailyMatches } from "../../api/matches";

const PreferenceMatcher = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    getDailyMatches().then(res => setMatches(res.data));
  }, []);

  return (
    <div>
      <h3>Recommended Listings (Matched by AI)</h3>
      {matches.length === 0 && <div>No matches today</div>}
      {matches.map(listing => (
        <div key={listing.listing_id || listing.id}>
          <h4>{listing.title} ({listing.location})</h4>
          <p>Rent: ${listing.rent_price?.toLocaleString?.() || listing.rent_price}</p>
          {typeof listing.compatibility_score === "number" && (
            <p>Match: {Math.round(listing.compatibility_score * 100)}%</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PreferenceMatcher;

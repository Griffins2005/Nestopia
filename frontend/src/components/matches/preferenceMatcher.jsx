import React, { useState, useEffect } from "react";
import axios from "../../api/axiosConfig";

const PreferenceMatcher = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    axios.get("/api/matches/daily").then(res => setMatches(res.data));
  }, []);

  return (
    <div>
      <h3>Recommended Listings (Matched by AI)</h3>
      {matches.length === 0 && <div>No matches today</div>}
      {matches.map(listing => (
        <div key={listing.id}>
          <h4>{listing.title} ({listing.location})</h4>
          <p>Budget: {listing.budget}</p>
          <p>Amenities: {listing.amenities?.join(", ")}</p>
        </div>
      ))}
    </div>
  );
};

export default PreferenceMatcher;

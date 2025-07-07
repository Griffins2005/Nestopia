// src/components/Listings/ListingCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import SavedButton from "./savedbutton";
import ShareButton from "./share";
import house from "../../images/default-house.png"

export default function ListingCard({ listing, userRole, initiallySaved }) {
  const isRenter = userRole === "renter";
  const matchScore = Math.round((listing.match_score || 0) * 100);
  const img = listing.images?.[0] || house;

  return (
    <div className="listing-card match-card">
      <div className="listing-card-img-row">
        <img src={img} alt={listing.title} className="listing-img" />
        {isRenter && <div className="match-label">{matchScore}% Match</div>}
        <div className="listing-card-icons">
          <SavedButton listingId={listing.id} initiallySaved={initiallySaved} /> 
          <ShareButton listingId={listing.id} />
        </div>
      </div>
      <div className="listing-card-content">
        <div className="listing-card-title-row">
          <div className="listing-card-title">
            {listing.title.length > 18 ? listing.title.slice(0, 15) + "..." : listing.title}
          </div>
          <div className="listing-card-price">${listing.rent_price?.toLocaleString() || "--"}/mo</div>
        </div>
        <div className="listing-card-location">{listing.location}</div>
        <div className="listing-card-specs">
          {listing.bedrooms} beds&nbsp;&nbsp;{listing.bathrooms} baths{listing.sqft ? ` ${listing.sqft} sqft` : ""}
        </div>
        <div className="listing-card-amenities">
          {(listing.amenities || []).slice(0, 3).map(a => (
            <span key={a} className="amenity-chip">{a}</span>
          ))}
        </div>
        <Link to={`/listing/${listing.id}`} className="listing-card-details-btn">
          View Details
        </Link>
      </div>
    </div>
  );
}

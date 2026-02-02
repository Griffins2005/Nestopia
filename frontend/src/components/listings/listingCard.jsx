import React from "react";
import { Link } from "react-router-dom";
import SavedButton from "./savedbutton";
import ShareButton from "./share";
import house from "../../images/default-house.png";

export default function ListingCard({ listing, userRole, initiallySaved }) {
  const isRenter = userRole === "renter";
  const matchScore = Math.round((listing.match_score || 0) * 100);
  const img = listing.images?.[0] || house;
  const amenities = (listing.amenities || []).slice(0, 3);

  return (
    <div className="listing-card match-card">
      <div className="listing-card-img-row">
        <img src={img} alt={listing.title} className="listing-img" />
        {isRenter && matchScore > 0 && (
          <div className="match-label">{matchScore}% Match</div>
        )}
        <div className="listing-card-icons">
          <SavedButton listingId={listing.id} initiallySaved={initiallySaved} />
          <ShareButton listingId={listing.id} />
        </div>
      </div>
      <div className="listing-card-body">
        <div className="listing-card-header">
          <div>
            <p className="listing-card-subtitle">{listing.location}</p>
            <h3>{listing.title}</h3>
          </div>
          <div className="listing-card-price">
            ${listing.rent_price?.toLocaleString() || "--"}
            <span>/mo</span>
          </div>
        </div>

        <div className="listing-card-meta">
          <span>{listing.bedrooms} beds</span>
          <span>{listing.bathrooms} baths</span>
          {listing.sqft && <span>{listing.sqft} sqft</span>}
        </div>

        <div className="listing-card-tags">
          {amenities.length
            ? amenities.map((amenity) => (
                <span key={amenity} className="listing-tag">
                  {amenity}
                </span>
              ))
            : (
              <span className="listing-tag muted">Flexible terms</span>
            )}
        </div>

        <Link to={`/listing/${listing.id}`} className="listing-card-details-btn">
          View Details
        </Link>
      </div>
    </div>
  );
}

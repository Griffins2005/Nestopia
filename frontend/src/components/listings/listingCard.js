import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../Icons';

export default function ListingCard({ listing, isRenter, isSaved, onSelect, onToggleSave }) {
  const navigate = useNavigate();
  const matchScore = Math.round((listing.match_score || 0) * 100);
  const amenities = (listing.amenities || []).slice(0, 3);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(listing);
    } else {
      navigate(`/listing/${listing.id}`);
    }
  };

  return (
    <div className="listing-card" onClick={handleSelect}>
      <div className="listing-card-img-row" style={{ backgroundImage: `url(${listing.image || '/assets/default-house.png'})` }}>
        {isRenter && matchScore > 0 && (
          <div className="match-label">{matchScore}% Match</div>
        )}
        <div className="listing-card-icons" onClick={(e) => e.stopPropagation()}>
          <button
            className={isSaved ? "saved" : ""}
            aria-label={isSaved ? "Unsave listing" : "Save listing"}
            onClick={() => onToggleSave && onToggleSave(listing.id)}
          >
            {isSaved ? <Icon name="heart" /> : <RegIcon name="heart" />}
          </button>
          <button aria-label="Share listing" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <Icon name="arrow-up-from-bracket" />
          </button>
        </div>
      </div>

      <div className="listing-card-body">
        <div className="listing-card-header">
          <div>
            <p className="listing-card-subtitle">{listing.location}</p>
            <h3>{listing.title}</h3>
          </div>
          <div className="listing-card-price">
            ${listing.rent_price?.toLocaleString()}
            <span>/mo</span>
          </div>
        </div>

        <div className="listing-card-meta">
          <span>{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed${listing.bedrooms !== 1 ? "s" : ""}`}</span>
          {listing.bathrooms != null && <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}</span>}
          {listing.sqft && <span>{listing.sqft} sqft</span>}
        </div>

        <div className="listing-card-tags">
          {amenities.length
            ? amenities.map((a) => <span key={a} className="listing-tag">{a}</span>)
            : <span className="listing-tag muted">Flexible terms</span>}
        </div>

        <button className="listing-card-details-btn" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>
          View Details
        </button>
      </div>
    </div>
  );
}

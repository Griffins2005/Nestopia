import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../Icons';
import { getListingImages } from '../../api/listings';
import { getListingMatchPercent } from '../../api/matches';

export function ListingImageCarousel({ images, alt = '', variant = 'detail', className = '' }) {
  const [idx, setIdx] = useState(0);
  const slides = images?.length ? images : ['/assets/default-house.png'];
  const multi = slides.length > 1;
  const slideKey = slides.join('|');

  useEffect(() => {
    setIdx(0);
  }, [slideKey]);

  const prev = (e) => {
    e?.stopPropagation?.();
    setIdx((i) => (i > 0 ? i - 1 : i));
  };
  const next = (e) => {
    e?.stopPropagation?.();
    setIdx((i) => (i < slides.length - 1 ? i + 1 : i));
  };

  if (!multi && variant === 'card') {
    return (
      <div
        className={`listing-carousel listing-carousel-card ${className}`.trim()}
        style={{ backgroundImage: `url(${slides[0]})` }}
        role="img"
        aria-label={alt}
      />
    );
  }

  if (!multi) {
    return (
      <div className={`listing-carousel listing-carousel-${variant} ${className}`.trim()}>
        <img src={slides[0]} alt={alt} className="listing-carousel-img" />
      </div>
    );
  }

  return (
    <div className={`listing-carousel listing-carousel-${variant} ${className}`.trim()}>
      <div className="listing-carousel-main">
        <img src={slides[idx]} alt={alt ? `${alt} — photo ${idx + 1}` : `Photo ${idx + 1}`} className="listing-carousel-img" />
        <button
          type="button"
          className={`carousel-arrow carousel-arrow-left${idx === 0 ? ' disabled' : ''}`}
          onClick={prev}
          disabled={idx === 0}
          aria-label="Previous photo"
        >
          <Icon name="arrow-left" />
        </button>
        <button
          type="button"
          className={`carousel-arrow carousel-arrow-right${idx === slides.length - 1 ? ' disabled' : ''}`}
          onClick={next}
          disabled={idx === slides.length - 1}
          aria-label="Next photo"
        >
          <Icon name="arrow-right" />
        </button>
        <div className="carousel-count">{idx + 1} / {slides.length}</div>
      </div>
      {variant === 'detail' && (
        <div className="carousel-thumbs-row">
          {slides.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              className={`carousel-thumb-btn${idx === i ? ' active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={src} alt="" className="carousel-thumb-img" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingGallery({ images, alt = '', onShowAll }) {
  const slides = images?.length ? images : ['/assets/default-house.png'];
  if (slides.length === 1) {
    return (
      <div className="listing-gallery listing-gallery-single">
        <img src={slides[0]} alt={alt} className="listing-gallery-img" />
      </div>
    );
  }

  const extras = Math.max(0, slides.length - 3);
  const sub = slides.slice(1, 3);

  return (
    <div className="listing-gallery">
      <button type="button" className="listing-gallery-hero" onClick={onShowAll} aria-label="View photos">
        <img src={slides[0]} alt={alt} className="listing-gallery-img" />
      </button>
      {sub.length > 0 && (
        <div className="listing-gallery-sub">
          {sub.map((src, i) => (
            <button type="button" key={`${src}-${i}`} className="listing-gallery-tile" onClick={onShowAll} aria-label={`View photo ${i + 2}`}>
              <img src={src} alt="" className="listing-gallery-img" />
              {i === sub.length - 1 && extras > 0 && (
                <span className="listing-gallery-more">+{extras}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingCard({ listing, isRenter, isSaved, onSelect, onToggleSave }) {
  const navigate = useNavigate();
  const matchScore = getListingMatchPercent(listing);
  const amenities = (listing.amenities || []).slice(0, 3);

  const images = getListingImages(listing);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(listing);
    } else {
      navigate(`/listing/${listing.id}`);
    }
  };

  return (
    <div className="listing-card" onClick={handleSelect}>
      <div className="listing-card-img-row">
        <ListingImageCarousel images={images} alt={listing.title} variant="card" />
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
        <div className="listing-card-topline">
          <p className="listing-card-subtitle">{listing.location}</p>
          <div className="listing-card-price">
            ${listing.rent_price?.toLocaleString()}
            <span>/mo</span>
          </div>
        </div>
        <h3>{listing.title}</h3>

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

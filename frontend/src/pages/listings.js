import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import ListingsMap from '../components/ListingsMap';
import { useNestopia } from '../context/NestopiaContext';

export default function Listings() {
  const { user, listings, savedIds, toggleSave } = useNestopia();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState('grid');
  const [viewAsRenter, setViewAsRenter] = useState(false);

  useEffect(() => { setQuery(searchParams.get('q') || ''); }, [searchParams]);

  const isLandlord = user?.role === 'landlord';
  const showViewAsRenterToggle = isLandlord;
  const treatAsRenter = !user || user.role === 'renter' || (isLandlord && viewAsRenter);

  const filtered = useMemo(() => {
    let base = listings;
    if (isLandlord && !viewAsRenter && user?.email) {
      base = listings.filter((l) => l.host?.email === user.email || l.landlord_id === user.id);
    }
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (l) => l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q)
    );
  }, [listings, query, isLandlord, viewAsRenter, user?.email, user?.id]);

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
            <button
              className={`toggle-btn ${viewAsRenter ? "active" : ""}`}
              onClick={() => setViewAsRenter(!viewAsRenter)}
            >
              {viewAsRenter ? "View My Listings" : "Browse All Listings"}
            </button>
          )}
          <div className="search-bar">
            <Icon name="magnifying-glass" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for homes, apartments..."
            />
          </div>
          <div className="view-toggle">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>Map</button>
          </div>
          {user?.role === "landlord" && !viewAsRenter && (
            <button className="cta-btn" onClick={() => navigate('/listing/new')}>
              <Icon name="plus" /> Add listing
            </button>
          )}
        </div>
      </section>

      {view === "grid" ? (
        <div className="listings-grid">
          {filtered.length === 0 ? (
            <div className="listing-card" style={{ padding: "2rem", color: "var(--ntp-fg-muted)" }}>
              {isLandlord && !viewAsRenter
                ? 'You haven\'t published any listings yet. Click "Add listing" to get started.'
                : "No listings found. Try adjusting your search."}
            </div>
          ) : filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isRenter={treatAsRenter}
              isSaved={savedIds.includes(listing.id)}
              onSelect={(l) => navigate(`/listing/${l.id}`)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      ) : (
        <ListingsMap
          listings={filtered}
          isRenter={treatAsRenter}
          onSelect={(l) => navigate(`/listing/${l.id}`)}
        />
      )}
    </div>
  );
}

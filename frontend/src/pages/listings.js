import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import ListingsMap from '../components/ListingsMap';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getListingsEmptyState } from '../api/listings';
import { useNestopia } from '../context/NestopiaContext';

export default function Listings() {
  const { user, listings, listingsStatus, savedIds, toggleSave, loadListings } = useNestopia();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState('grid');
  const [viewAsRenter, setViewAsRenter] = useState(false);

  useEffect(() => { setQuery(searchParams.get('q') || ''); }, [searchParams]);

  const isLandlord = user?.role === 'landlord';

  useEffect(() => {
    if (!isLandlord) return;
    loadListings(viewAsRenter);
  }, [isLandlord, viewAsRenter, loadListings]);
  const showViewAsRenterToggle = isLandlord;
  const treatAsRenter = !user || user.role === 'renter' || (isLandlord && viewAsRenter);
  const isLandlordView = isLandlord && !viewAsRenter;

  const filtered = useMemo(() => {
    let base = listings;
    if (isLandlordView && user?.email) {
      base = listings.filter((l) => l.host?.email === user.email || l.landlord_id === user.id);
    }
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (l) => l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q)
    );
  }, [listings, query, isLandlordView, user?.email, user?.id]);

  const hasSearchQuery = Boolean(query.trim());
  const showFallback = listingsStatus === 'loading' || listingsStatus === 'unavailable' || filtered.length === 0;

  const fallback = getListingsEmptyState({
    listingsStatus,
    isLandlordView,
    hasSearchQuery,
    onAddListing: () => navigate('/listing/new'),
    onClearSearch: () => setQuery(''),
  });

  const renderContent = () => {
    if (fallback?.type === 'loading') {
      return <ListingsLoading />;
    }
    if (showFallback && fallback?.type === 'empty') {
      if (view === 'map') {
        return (
          <div className="listings-map-empty-wrap">
            <EmptyState {...fallback} />
          </div>
        );
      }
      return <EmptyState {...fallback} />;
    }
    if (view === 'map') {
      return (
        <ListingsMap
          listings={filtered}
          isRenter={treatAsRenter}
          onSelect={(l) => navigate(`/listing/${l.id}`)}
        />
      );
    }
    return (
      <div className="listings-grid">
        {filtered.map((listing) => (
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
    );
  };

  return (
    <div className={`listings-shell${isLandlordView ? ' listings-shell-landlord' : ''}`}>
      <section className="listings-hero">
        <div className="listings-hero-text">
          <p className="eyebrow eyebrow-muted">Curated for you</p>
          <h1>
            {isLandlordView ? 'My Listings' : 'Available Listings'}
          </h1>
          <p>
            {isLandlordView
              ? 'Manage your property listings and view inquiries.'
              : 'Find your next home from our curated selection of high-match rentals.'}
          </p>
        </div>
        <div className="listings-hero-toolbar">
          {showViewAsRenterToggle && (
            <button
              type="button"
              className={`toggle-btn browse-toggle${viewAsRenter ? ' active' : ''}`}
              onClick={() => setViewAsRenter(!viewAsRenter)}
            >
              {viewAsRenter ? 'View My Listings' : 'Browse All Listings'}
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
            <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>Grid</button>
            <button type="button" className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map</button>
          </div>
          {isLandlordView && (
            <button type="button" className="cta-btn listings-add-btn" onClick={() => navigate('/listing/new')}>
              <Icon name="plus" /> Add listing
            </button>
          )}
        </div>
      </section>

      {renderContent()}
    </div>
  );
}

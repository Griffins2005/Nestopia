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
  const [maxRent, setMaxRent] = useState(searchParams.get('max') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [beds, setBeds] = useState('');
  const [sort, setSort] = useState('default');
  const [view, setView] = useState('grid');
  const [viewAsRenter, setViewAsRenter] = useState(false);

  useEffect(() => { setQuery(searchParams.get('q') || ''); setMaxRent(searchParams.get('max') || ''); setPropertyType(searchParams.get('type') || ''); }, [searchParams]);

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
    if (propertyType) base = base.filter(l => l.property_type?.toLowerCase() === propertyType.toLowerCase());
    if (maxRent) base = base.filter(l => l.rent_price != null && Number(l.rent_price) <= Number(maxRent));
    if (beds !== '') base = base.filter(l => l.bedrooms != null && Number(l.bedrooms) === Number(beds));
    const q = query.trim().toLowerCase();
    base = base.filter(
      (l) => l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q)
    );
    return sort === 'default' ? base : [...base].sort((a,b) => sort === 'low' ? Number(a.rent_price) - Number(b.rent_price) : Number(b.rent_price) - Number(a.rent_price));
  }, [listings, query, maxRent, propertyType, beds, sort, isLandlordView, user?.email, user?.id]);

  const hasSearchQuery = Boolean(query.trim() || maxRent || propertyType || beds !== '');
  const showFallback = listingsStatus === 'loading' || listingsStatus === 'unavailable' || filtered.length === 0;

  const fallback = getListingsEmptyState({
    listingsStatus,
    isLandlordView,
    hasSearchQuery,
    onAddListing: () => navigate('/listing/new'),
    onClearSearch: () => { setQuery(''); setMaxRent(''); setBeds(''); setPropertyType(''); },
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
          <p className="eyebrow eyebrow-muted">ROOM FOR YOUR NEXT CHAPTER</p>
          <h1>
            {isLandlordView ? 'My Listings' : 'Find your place.'}
          </h1>
          <p>
            {isLandlordView
              ? 'Manage your property listings and view inquiries.'
              : 'Explore homes with your budget and priorities in mind.'}
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
              aria-label="Search listings" placeholder="City, neighborhood, or keyword"
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

      <div className="nest-filters"><label>Property type<select value={propertyType} onChange={e=>setPropertyType(e.target.value)}><option value="">All types</option><option value="apartment">Apartment</option><option value="house">House</option></select></label><label>Monthly budget<select value={maxRent} onChange={e=>setMaxRent(e.target.value)}><option value="">Any budget</option><option value="800">Up to $800</option><option value="1500">Up to $1,500</option><option value="2500">Up to $2,500</option><option value="4000">Up to $4,000</option></select></label><label>Bedrooms<select value={beds} onChange={e=>setBeds(e.target.value)}><option value="">Any bedrooms</option><option value="0">Studio</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option></select></label><label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="default">Default order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>{hasSearchQuery && <button onClick={()=>{setQuery('');setMaxRent('');setBeds(''); setPropertyType('');}}>Clear filters</button>}<span className="nest-result-count" role="status">{listingsStatus === 'loading' ? 'Loading homes…' : `${filtered.length} homes found`}</span></div>{renderContent()}
    </div>
  );
}

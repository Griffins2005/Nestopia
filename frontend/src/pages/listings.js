import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import ListingsMap from '../components/ListingsMap';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getListingsEmptyState } from '../api/listings';
import { useNestopia } from '../context/NestopiaContext';

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

function isoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || y < 2000 || y > 2100) return '';
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseMoveIn(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return isoDate(match[1], match[2], match[3]);
  match = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return isoDate(year, match[1], match[2]);
  }
  match = text.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match && MONTHS[match[1].toLowerCase()]) return isoDate(match[3], MONTHS[match[1].toLowerCase()], match[2]);
  match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match && MONTHS[match[2].toLowerCase()]) return isoDate(match[3], MONTHS[match[2].toLowerCase()], match[1]);
  match = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (match && MONTHS[match[1].toLowerCase()]) {
    const month = MONTHS[match[1].toLowerCase()];
    const last = new Date(Number(match[2]), month, 0).getDate();
    return isoDate(match[2], month, last);
  }
  match = text.match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    const last = new Date(Number(match[1]), Number(match[2]), 0).getDate();
    return isoDate(match[1], match[2], last);
  }
  return '';
}

function formatMoveIn(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function moveInDeadline(value) {
  const iso = parseMoveIn(value);
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59);
}

function MoveInField({ value, onChange }) {
  const [text, setText] = useState(value ? formatMoveIn(value) : '');
  const [invalid, setInvalid] = useState(false);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    setText(value ? formatMoveIn(value) : '');
    setInvalid(false);
  }, [value]);

  const commit = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInvalid(false);
      setText('');
      if (value) onChange('');
      return;
    }
    const iso = parseMoveIn(trimmed);
    if (!iso) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setText(formatMoveIn(iso));
    if (iso !== value) {
      skip.current = true;
      onChange(iso);
    }
  };

  return (
    <label className={`explore-field explore-move${invalid ? ' is-invalid' : ''}`}>
      <span>Move-in</span>
      <div className="explore-move-row">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="Type or pick a date"
          aria-label="Move-in date"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setInvalid(false);
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(text);
            }
          }}
        />
        <span className="explore-cal">
          <Icon name="calendar" />
          <input
            type="date"
            aria-label="Choose a move-in date from the calendar"
            value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
            onChange={(e) => {
              const iso = e.target.value;
              if (!iso) return;
              setInvalid(false);
              setText(formatMoveIn(iso));
              if (iso !== value) {
                skip.current = true;
                onChange(iso);
              }
            }}
          />
        </span>
      </div>
      {invalid && <em>Try Mar 15, 2026, or pick a day from the calendar.</em>}
    </label>
  );
}

export default function Listings() {
  const { user, listings, listingsStatus, savedIds, toggleSave, loadListings } = useNestopia();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [maxRent, setMaxRent] = useState(searchParams.get('max') || '');
  const [moveBy, setMoveBy] = useState(() => parseMoveIn(searchParams.get('by') || ''));
  const [view, setView] = useState('grid');
  const [viewAsRenter, setViewAsRenter] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setMaxRent(searchParams.get('max') || '');
    setMoveBy(parseMoveIn(searchParams.get('by') || ''));
  }, [searchParams]);

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
    const q = query.trim().toLowerCase();
    const cap = Number(maxRent);
    const moveEnd = moveInDeadline(moveBy);
    return base.filter((l) => {
      if (q && !(l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q))) return false;
      if (cap > 0 && Number(l.rent_price) > cap) return false;
      if (moveEnd && l.available_from) {
        const available = new Date(/^\d{4}-\d{2}-\d{2}/.test(l.available_from) ? `${String(l.available_from).slice(0, 10)}T12:00:00` : l.available_from);
        if (!Number.isNaN(available.getTime()) && available > moveEnd) return false;
      }
      return true;
    });
  }, [listings, query, maxRent, moveBy, isLandlordView, user?.email, user?.id]);

  const hasSearchQuery = Boolean(query.trim() || maxRent || moveBy);
  const clearFilters = () => {
    setQuery('');
    setMaxRent('');
    setMoveBy('');
    if (searchParams.toString()) navigate('/listings', { replace: true });
  };
  const showFallback = listingsStatus === 'loading' || listingsStatus === 'unavailable' || filtered.length === 0;

  const fallback = getListingsEmptyState({
    listingsStatus,
    isLandlordView,
    hasSearchQuery,
    onAddListing: () => navigate('/listing/new'),
    onClearSearch: clearFilters,
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
        <div className="listings-hero-top">
          <div className="listings-hero-text">
            <p className="eyebrow">Curated for you</p>
            <h1>{isLandlordView ? 'Your listings' : 'Available listings'}</h1>
            <p>
              {isLandlordView
                ? 'Edit a listing, or see who would like to visit.'
                : 'Find your next home from our curated selection of high-match rentals.'}
            </p>
          </div>
          <div className="view-toggle" aria-label="Choose a view">
            <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>List</button>
            <button type="button" className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map</button>
          </div>
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
          <form className="explore-search" onSubmit={(e) => e.preventDefault()} role="search">
            <label className="explore-field">
              <span><Icon name="magnifying-glass" /> Place</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Neighborhood, city, or host"
                aria-label="Place"
              />
            </label>
            <label className="explore-field">
              <span>Budget</span>
              <select value={maxRent} onChange={(e) => setMaxRent(e.target.value)} aria-label="Budget">
                <option value="">Any rent</option>
                {[800, 1200, 1600, 2000, 2500, 3500].map((cap) => (
                  <option key={cap} value={cap}>Up to ${cap.toLocaleString()}</option>
                ))}
              </select>
            </label>
            <MoveInField value={moveBy} onChange={setMoveBy} />
          </form>
          {hasSearchQuery && (
            <button type="button" className="cta-btn ghost" onClick={clearFilters}>Clear</button>
          )}
          {isLandlordView && (
            <button type="button" className="cta-btn listings-add-btn" onClick={() => navigate('/listing/new')}>
              <Icon name="plus" /> Add listing
            </button>
          )}
        </div>
      </section>

      <div className="section-break" aria-hidden="true" />

      {view === 'map' ? (
        fallback?.type === 'loading' ? (
          <ListingsLoading />
        ) : showFallback && fallback?.type === 'empty' ? (
          <div className="listings-map-empty-wrap"><EmptyState {...fallback} /></div>
        ) : (
          <ListingsMap
            listings={filtered}
            isRenter={treatAsRenter}
            onSelect={(l) => navigate(`/listing/${l.id}`)}
          />
        )
      ) : (
        <div className="explore-split">
          <div className="explore-split-main">{renderContent()}</div>
          {listingsStatus !== 'loading' && (
            <div className="explore-split-map">
              <ListingsMap
                compact
                listings={filtered}
                isRenter={treatAsRenter}
                onSelect={(l) => navigate(`/listing/${l.id}`)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

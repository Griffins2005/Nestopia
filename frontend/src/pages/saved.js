import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../components/Icons';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getSavedEmptyState, getSavedListings, getListingImages } from '../api/listings';
import { getListingMatchPercent } from '../api/matches';
import { useNestopia, normalizeListing } from '../context/NestopiaContext';

function formatMoveIn(value) {
  if (!value) return '—';
  const iso = /^\d{4}-\d{2}-\d{2}/.test(value) ? `${String(value).slice(0, 10)}T12:00:00` : value;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Shortlist({ listings, isRenter, savedIds, onOpen, onToggleSave }) {
  const scored = listings.map((listing) => ({
    id: listing.id,
    match: getListingMatchPercent(listing) || 0,
    rent: Number(listing.rent_price) || Number.POSITIVE_INFINITY,
  }));
  const bestMatch = Math.max(...scored.map((row) => row.match));
  const best = listings.length > 1
    ? (bestMatch > 0
      ? scored.find((row) => row.match === bestMatch)
      : scored.reduce((a, b) => (a.rent <= b.rent ? a : b)))
    : null;
  const badge = bestMatch > 0 ? 'Closest match' : 'Lowest rent';
  const showMatch = isRenter && scored.some((row) => row.match > 0);

  return (
    <div className={`shortlist${showMatch ? ' has-match' : ''}`} style={{ '--sl-cols': listings.length }}>
      <div className="shortlist-labels">
        <div />
        <div />
        <div>Bedrooms</div>
        <div>Bathrooms</div>
        <div>Move-in</div>
        <div>Lease term</div>
        {showMatch && <div>Preference match</div>}
        <div />
      </div>
      {listings.map((listing) => {
        const match = getListingMatchPercent(listing) || 0;
        const beds = listing.bedrooms === 0 ? 'Studio' : listing.bedrooms != null ? `${listing.bedrooms} bed${listing.bedrooms === 1 ? '' : 's'}` : '—';
        const baths = listing.bathrooms != null ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}` : '—';
        return (
          <article key={listing.id} className={`shortlist-col${best?.id === listing.id ? ' is-best' : ''}`}>
            <div className="shortlist-photo">
              <img src={getListingImages(listing)[0]} alt="" />
              {best?.id === listing.id && <span className="shortlist-badge">{badge}</span>}
              <button
                type="button"
                className={`shortlist-heart${savedIds.includes(listing.id) ? ' is-saved' : ''}`}
                aria-label="Remove from saved"
                onClick={() => onToggleSave(listing.id)}
              >
                {savedIds.includes(listing.id) ? <Icon name="heart" /> : <RegIcon name="heart" />}
              </button>
            </div>
            <div className="shortlist-name">
              <h2>{listing.title}</h2>
              <p>{(listing.location || '').split(',')[0]}</p>
              <strong>${listing.rent_price?.toLocaleString()}<small> per month</small></strong>
            </div>
            <div className="sl-row"><span className="sl-k">Bedrooms</span>{beds}</div>
            <div className="sl-row"><span className="sl-k">Bathrooms</span>{baths}</div>
            <div className="sl-row"><span className="sl-k">Move-in</span>{formatMoveIn(listing.available_from)}</div>
            <div className="sl-row"><span className="sl-k">Lease term</span>{listing.lease_length || '—'}</div>
            {showMatch && (
              <div className="sl-row"><span className="sl-k">Preference match</span>{match ? `${match}%` : '—'}</div>
            )}
            <button type="button" className="cta-btn shortlist-open" onClick={() => onOpen(listing)}>
              View home <Icon name="arrow-right" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default function Saved() {
  const navigate = useNavigate();
  const { user, savedIds, toggleSave } = useNestopia();
  const [savedListings, setSavedListings] = useState([]);
  const [status, setStatus] = useState('loading');
  const isRenter = !user || user.role === 'renter';

  const loadSaved = useCallback(() => {
    if (!user) {
      setSavedListings([]);
      setStatus('ready');
      return;
    }
    setStatus('loading');
    getSavedListings()
      .then((res) => {
        setSavedListings((res.data || []).map(normalizeListing));
        setStatus('ready');
      })
      .catch(() => {
        setSavedListings([]);
        setStatus('unavailable');
      });
  }, [user]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleUnsave = (id) => {
    toggleSave(id);
    setSavedListings((prev) => prev.filter((l) => l.id !== id));
  };

  const fallback = getSavedEmptyState({
    loading: status === 'loading',
    unavailable: status === 'unavailable',
    onBrowse: () => navigate('/listings'),
  });

  const hasSaved = savedListings.length > 0;

  return (
    <div className="listings-shell">
      <section className="listings-hero">
        <div className="listings-hero-text">
          <p className="eyebrow">Homes we think you&apos;ll love</p>
          <h1>Saved for later</h1>
          <p>
            {status === 'loading'
              ? 'Gathering the homes you kept close…'
              : !hasSaved
                ? 'When a home feels right, save it. It will be here when you come back.'
                : `${savedListings.length} ${savedListings.length === 1 ? 'place' : 'places'} you loved enough to keep.`}
          </p>
        </div>
      </section>

      {status === 'loading' ? (
        <ListingsLoading count={3} />
      ) : !hasSaved ? (
        <EmptyState {...fallback} />
      ) : (
        <Shortlist
          listings={savedListings}
          isRenter={isRenter}
          savedIds={savedIds}
          onOpen={(listing) => navigate(`/listing/${listing.id}`)}
          onToggleSave={handleUnsave}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/listings/listingCard';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getSavedEmptyState } from '../api/listings';
import { useNestopia, normalizeListing } from '../context/NestopiaContext';
import api from '../api/axiosConfig';

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
    api.get('/api/listings/saved/')
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
          <p className="eyebrow eyebrow-muted">Your collection</p>
          <h1>Saved homes</h1>
          <p>
            {status === 'loading'
              ? 'Gathering your saved homes…'
              : !hasSaved
                ? "Nothing saved yet — heart any listing and it'll wait for you here."
                : `${savedListings.length} ${savedListings.length === 1 ? 'home' : 'homes'} you've hearted. Reach out whenever you're ready.`}
          </p>
        </div>
      </section>

      {status === 'loading' ? (
        <ListingsLoading count={3} />
      ) : !hasSaved ? (
        <EmptyState {...fallback} />
      ) : (
        <div className="listings-grid">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isRenter={isRenter}
              isSaved={savedIds.includes(listing.id)}
              onSelect={(l) => navigate(`/listing/${l.id}`)}
              onToggleSave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

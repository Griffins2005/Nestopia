import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import { useNestopia } from '../context/NestopiaContext';
import axios from 'axios';

export default function Saved() {
  const navigate = useNavigate();
  const { user, savedIds, toggleSave } = useNestopia();
  const [savedListings, setSavedListings] = useState([]);
  const isRenter = !user || user.role === 'renter';

  useEffect(() => {
    if (!user?.accessToken) return;
    axios.get('/api/listings/saved/', {
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      headers: { Authorization: `Bearer ${user.accessToken}` },
    })
      .then(res => setSavedListings((res.data || []).map(l => ({
        ...l,
        image: l.images?.[0] || l.image || '/assets/default-house.png',
        match_score: l.match_score || 0,
        amenities: l.amenities || [],
        host: l.host || { name: 'Host', since: '2024', email: '', phone: '' },
      }))))
      .catch(() => {});
  }, [user?.accessToken]);

  const handleUnsave = (id) => {
    toggleSave(id);
    setSavedListings(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="listings-shell">
      <section className="listings-hero">
        <div className="listings-hero-text">
          <p className="eyebrow">Your collection</p>
          <h1>Saved homes</h1>
          <p>
            {savedListings.length === 0
              ? "Nothing saved yet — heart any listing and it'll wait for you here."
              : `${savedListings.length} ${savedListings.length === 1 ? "home" : "homes"} you've hearted. Reach out whenever you're ready.`}
          </p>
        </div>
      </section>

      {savedListings.length === 0 ? (
        <div className="empty-shelf">
          <div className="empty-shelf-icon"><RegIcon name="heart" /></div>
          <h3>No saved homes yet</h3>
          <p>Browse the listings and tap the heart on anything you&apos;d like to come back to.</p>
          <button className="cta-btn" onClick={() => navigate('/listings')}>Browse homes <Icon name="arrow-right" /></button>
        </div>
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

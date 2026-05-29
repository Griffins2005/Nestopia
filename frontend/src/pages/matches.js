import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import { useNestopia } from '../context/NestopiaContext';
import { getDailyMatches } from '../api/matches';

export default function Matches() {
  const navigate = useNavigate();
  const { user, listings, savedIds, preferences, toggleSave } = useNestopia();

  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.accessToken) {
      setRanked(listings.map(l => ({ ...l, match_score: 0 })));
      setLoading(false);
      return;
    }
    getDailyMatches()
      .then(res => {
        const data = res.data || [];
        const normalized = data.map(l => ({
          ...l,
          image: l.images?.[0] || l.image || '/assets/default-house.png',
          match_score: l.match_score || 0,
          amenities: l.amenities || [],
          host: l.host || { name: 'Host', since: '2024', email: '', phone: '' },
        }));
        setRanked(normalized.sort((a, b) => b.match_score - a.match_score));
        setLoading(false);
      })
      .catch(() => {
        setRanked(listings.map(l => ({ ...l, match_score: 0 })));
        setLoading(false);
      });
  }, [user?.accessToken, listings]);

  const top = ranked[0];
  const displayName = user?.name || user?.email?.split('@')[0] || 'you';

  if (loading) {
    return (
      <div className="listings-shell">
        <section className="matches-hero">
          <div>
            <p className="eyebrow">Loading your matches…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="listings-shell">
      <section className="matches-hero">
        <div>
          <p className="eyebrow">Curated for {displayName.split(' ')[0]}</p>
          <h1>Your matches today</h1>
          <p>
            {preferences
              ? "Scored against your budget, neighborhoods, and must-haves. Refreshed every morning."
              : "Set your preferences and we'll rank every home by how well it fits you."}
          </p>
        </div>
        <button className="cta-btn ghost" onClick={() => navigate('/preferences')}>
          <Icon name="pen" /> {preferences ? "Edit preferences" : "Set preferences"}
        </button>
      </section>

      {!preferences && (
        <div className="matches-prompt">
          <div className="matches-prompt-icon"><Icon name="sparkles" /></div>
          <div>
            <h3>Tell us your vibe first</h3>
            <p>Two minutes of preferences unlocks personalized match scores on every listing.</p>
          </div>
          <button className="cta-btn" onClick={() => navigate('/preferences')}>Set preferences <Icon name="arrow-right" /></button>
        </div>
      )}

      {preferences && top && (
        <article className="top-match" onClick={() => navigate(`/listing/${top.id}`)}>
          <div className="top-match-img" style={{ backgroundImage: `url(${top.image})` }}>
            <span className="top-match-badge">{Math.round((top.match_score || 0) * 100)}% match · your top home</span>
          </div>
          <div className="top-match-body">
            <p className="lc-sub" style={{ color: "var(--ntp-green-500)", margin: "0 0 0.2rem", fontWeight: 500 }}>{top.location}</p>
            <h2>{top.title}</h2>
            <p className="top-match-desc">{top.description}</p>
            <div className="listing-card-meta" style={{ marginBottom: "0.4rem" }}>
              <span>{top.bedrooms === 0 ? "Studio" : `${top.bedrooms} beds`}</span>
              <span>{top.bathrooms} baths</span>
              {top.sqft && <span>{top.sqft} sqft</span>}
            </div>
            <div className="top-match-foot">
              <span className="top-match-price">${top.rent_price?.toLocaleString()}<small>/mo</small></span>
              <button className="cta-btn" onClick={(e) => { e.stopPropagation(); navigate(`/listing/${top.id}`); }}>View home</button>
            </div>
          </div>
        </article>
      )}

      <div className="matches-list-head">
        <h2>{preferences ? "More homes ranked for you" : "All available homes"}</h2>
      </div>
      <div className="listings-grid">
        {ranked.slice(preferences ? 1 : 0).map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isRenter={true}
            isSaved={savedIds.includes(listing.id)}
            onSelect={(l) => navigate(`/listing/${l.id}`)}
            onToggleSave={toggleSave}
          />
        ))}
      </div>
    </div>
  );
}

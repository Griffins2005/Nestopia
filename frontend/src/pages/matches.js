import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import MatchBreakdownCard from '../components/matches/MatchBreakdown';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getMatchesEmptyState, getListingImages } from '../api/listings';
import { useNestopia, normalizeListing } from '../context/NestopiaContext';
import { getDailyMatches, getListingMatchPercent } from '../api/matches';
import { ListingImageCarousel } from '../components/listings/listingCard';

export default function Matches() {
  const navigate = useNavigate();
  const { user, listingsStatus, savedIds, preferences, toggleSave } = useNestopia();

  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    if (listingsStatus === 'loading') return;

    if (!user) {
      setRanked([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getDailyMatches();
      const normalized = (res.data || []).map(normalizeListing);
      setRanked(normalized.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)));
    } catch {
      setRanked([]);
    } finally {
      setLoading(false);
    }
  }, [user, listingsStatus]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const top = ranked[0];
  const displayName = user?.name || user?.email?.split('@')[0] || 'you';
  const listItems = ranked.slice(preferences ? 1 : 0);
  const emptyFallback = getMatchesEmptyState({ hasPreferences: true });
  const showEmpty = preferences && ranked.length === 0;

  if (loading || listingsStatus === 'loading') {
    return (
      <div className="listings-shell">
        <section className="matches-hero">
          <div>
            <p className="eyebrow eyebrow-muted">Curated for {displayName.split(' ')[0]}</p>
            <h1>Your matches today</h1>
            <p>Pulling together homes ranked for you…</p>
          </div>
        </section>
        <ListingsLoading count={3} />
      </div>
    );
  }

  return (
    <div className="listings-shell">
      <section className="matches-hero">
        <div>
          <p className="eyebrow eyebrow-muted">Curated for {displayName.split(' ')[0]}</p>
          <h1>Your matches today</h1>
          <p>
            {preferences
              ? 'We score each listing against your housing preferences and how well you align with what hosts expect from tenants. Rankings refresh each morning.'
              : 'Set your housing preferences to see a compatibility percentage on every listing.'}
          </p>
        </div>
        <button type="button" className="cta-btn ghost" onClick={() => navigate('/preferences')}>
          <Icon name="pen" /> {preferences ? 'Edit preferences' : 'Set preferences'}
        </button>
      </section>

      {!preferences && (
        <div className="matches-prompt">
          <div className="matches-prompt-icon"><Icon name="sparkles" /></div>
          <div>
            <h3>Tell us your vibe first</h3>
            <p>Share your preferences so we can score property fit and tenant fit on every listing.</p>
          </div>
          <button type="button" className="cta-btn" onClick={() => navigate('/preferences')}>
            Set preferences <Icon name="arrow-right" />
          </button>
        </div>
      )}

      {showEmpty && emptyFallback && (
        <EmptyState {...emptyFallback} />
      )}

      {preferences && !showEmpty && top && (
        <article className="top-match" onClick={() => navigate(`/listing/${top.id}`)}>
          <div className="top-match-img">
            <ListingImageCarousel images={getListingImages(top)} alt={top.title} variant="card" />
            <span className="top-match-badge">{getListingMatchPercent(top)}% match · your top home</span>
          </div>
          <div className="top-match-body">
            <p className="lc-sub" style={{ color: 'var(--ntp-green-500)', margin: '0 0 0.2rem', fontWeight: 500 }}>{top.location}</p>
            <h2>{top.title}</h2>
            <p className="top-match-desc">{top.description}</p>
            <MatchBreakdownCard listing={top} compact />
            <div className="listing-card-meta" style={{ marginBottom: '0.4rem' }}>
              <span>{top.bedrooms === 0 ? 'Studio' : `${top.bedrooms} beds`}</span>
              <span>{top.bathrooms} baths</span>
              {top.sqft && <span>{top.sqft} sqft</span>}
            </div>
            <div className="top-match-foot">
              <span className="top-match-price">${top.rent_price?.toLocaleString()}<small>/mo</small></span>
              <button type="button" className="cta-btn" onClick={(e) => { e.stopPropagation(); navigate(`/listing/${top.id}`); }}>View home</button>
            </div>
          </div>
        </article>
      )}

      {preferences && !showEmpty && listItems.length > 0 && (
        <>
          <div className="matches-list-head">
            <h2>More homes ranked for you</h2>
          </div>
          <div className="listings-grid">
            {listItems.map((listing) => (
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
        </>
      )}
    </div>
  );
}

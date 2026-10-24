import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import ListingCard from '../components/listings/listingCard';
import MatchBreakdownCard from '../components/matches/MatchBreakdown';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { getMatchesEmptyState, getListingImages } from '../api/listings';
import { useNestopia, normalizeListing } from '../context/NestopiaContext';
import { getDailyMatches, getListingMatchPercent } from '../api/matches';
import { formatLocationLabel } from '../api/geo';
import { formatMoveInDisplay } from '../api/preferences';
import { ListingImageCarousel } from '../components/listings/listingCard';

function preferenceRows(preferences) {
  if (!preferences) return [];
  const rows = [];
  const max = preferences.budget_max ?? preferences.max_rent;
  const min = preferences.budget_min;
  if (max != null) rows.push({ icon: 'circle-check', label: `Up to $${Number(max).toLocaleString()}` });
  else if (min != null) rows.push({ icon: 'circle-check', label: `From $${Number(min).toLocaleString()}` });
  const locations = (preferences.locations || []).map(formatLocationLabel).filter(Boolean);
  if (locations.length) rows.push({ icon: 'map-pin', label: locations.slice(0, 2).join(', ') });
  const move = formatMoveInDisplay(preferences.move_in || preferences.move_in_date);
  if (move) rows.push({ icon: 'calendar', label: move });
  if (preferences.bedrooms != null) {
    const n = Number(preferences.bedrooms);
    rows.push({ icon: 'bed', label: n === 0 ? 'Studio' : `${n} bedroom${n === 1 ? '' : 's'}` });
  }
  return rows;
}

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
  const listItems = ranked.slice(preferences ? 1 : 0);
  const emptyFallback = getMatchesEmptyState({ hasPreferences: true });
  const showEmpty = preferences && ranked.length === 0;

  if (loading || listingsStatus === 'loading') {
    return (
      <div className="listings-shell">
        <section className="matches-hero">
          <div>
            <h1>Your top matches right now</h1>
            <p>Gathering the homes we think you&apos;ll love…</p>
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
          <p className="eyebrow">Homes we think you&apos;ll love</p>
          <h1>Your top matches right now</h1>
          <p>Ranked from the life you described, with the strongest fits first.</p>
        </div>
        {!preferences && (
          <button type="button" className="cta-btn ghost" onClick={() => navigate('/preferences')}>
            <Icon name="pen" /> Set preferences
          </button>
        )}
      </section>

      {!preferences && (
        <div className="matches-prompt">
          <div className="matches-prompt-icon"><Icon name="sparkles" /></div>
          <div>
            <h3>Tell us your vibe first</h3>
            <p>Share your must-haves, decor dreams, and timing. We listen first.</p>
          </div>
          <button type="button" className="cta-btn" onClick={() => navigate('/preferences')}>
            Set preferences <Icon name="arrow-right" />
          </button>
        </div>
      )}

      <div className={preferences ? 'matches-stage' : undefined}>
        {preferences && (
          <aside className="pref-rail">
            <h2>Your preferences</h2>
            {preferenceRows(preferences).map((row) => (
              <div className="pref-rail-row" key={row.label}>
                <Icon name={row.icon} />
                <span>{row.label}</span>
              </div>
            ))}
            <button type="button" className="cta-btn ghost" onClick={() => navigate('/preferences')}>
              <Icon name="pen" /> Edit preferences
            </button>
          </aside>
        )}

        <div className="matches-stage-main">
          {showEmpty && emptyFallback && (
            <EmptyState {...emptyFallback} />
          )}

          {preferences && !showEmpty && top && (
            <article className="top-match" onClick={() => navigate(`/listing/${top.id}`)}>
              <div className="top-match-img">
                <ListingImageCarousel images={getListingImages(top)} alt={top.title} variant="card" />
                <span className="top-match-badge">{getListingMatchPercent(top)}% preference match</span>
              </div>
              <div className="top-match-body">
                <h2>{top.title}</h2>
                <p className="lc-sub">{top.location}</p>
                <p className="top-match-price">${top.rent_price?.toLocaleString()}<small>/month</small></p>
                <div className="listing-card-meta">
                  <span>{top.bedrooms === 0 ? 'Studio' : `${top.bedrooms} bed${top.bedrooms === 1 ? '' : 's'}`}</span>
                  {top.bathrooms != null && <span>{top.bathrooms} bath{top.bathrooms === 1 ? '' : 's'}</span>}
                </div>
                <MatchBreakdownCard listing={top} compact bars />
                <button type="button" className="cta-btn" onClick={(e) => { e.stopPropagation(); navigate(`/listing/${top.id}`); }}>
                  View home <Icon name="arrow-right" />
                </button>
              </div>
            </article>
          )}

          {preferences && !showEmpty && listItems.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}

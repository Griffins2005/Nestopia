import React from 'react';
import {
  formatMatchPercent,
  getMatchBreakdown,
  getListingMatchPercent,
} from '../../api/matches';

const PROPERTY_LABELS = {
  budget: 'Budget',
  location: 'Location',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  unit_amenities: 'Unit amenities',
  building_amenities: 'Building features',
  lease_length: 'Lease length',
  move_in: 'Move-in timing',
  pets: 'Pet policy',
  occupants: 'Household size',
  custom_tags: 'Custom preferences',
};

export function MatchPercent({ listing, score, className = '' }) {
  const pct = listing ? getListingMatchPercent(listing) : formatMatchPercent(score);
  if (!pct) return null;
  return <span className={className}>{pct}% match</span>;
}

export default function MatchBreakdownCard({ listing, compact = false }) {
  const breakdown = getMatchBreakdown(listing);
  const overall = getListingMatchPercent(listing);
  if (!overall) return null;

  const propertyPct = breakdown?.property_fit_percent ?? null;
  const tenantPct = breakdown?.tenant_fit_percent ?? null;
  const propertyParts = breakdown?.property_breakdown || {};

  if (compact) {
    return (
      <div className="match-breakdown match-breakdown-compact">
        {(propertyPct != null || tenantPct != null) && (
          <div className="match-breakdown-split">
            {propertyPct != null && (
              <div className="match-breakdown-row">
                <span>Property fit</span>
                <strong>{propertyPct}%</strong>
              </div>
            )}
            {tenantPct != null && (
              <div className="match-breakdown-row">
                <span>Tenant fit</span>
                <strong>{tenantPct}%</strong>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="match-breakdown">
      <div className="match-breakdown-head">
        <span className="match-big">{overall}%</span>
        <small>How well this home fits your preferences and the host&apos;s tenant expectations</small>
      </div>

      {(propertyPct != null || tenantPct != null) && (
        <div className="match-breakdown-bars">
          {propertyPct != null && (
            <div className="match-bar-item">
              <div className="match-bar-label">
                <span>Property fit</span>
                <strong>{propertyPct}%</strong>
              </div>
              <div className="match-bar-track">
                <div className="match-bar-fill property" style={{ width: `${propertyPct}%` }} />
              </div>
              <p className="match-bar-caption">Your budget, location, beds, amenities &amp; lease vs what this listing offers</p>
            </div>
          )}
          {tenantPct != null && (
            <div className="match-bar-item">
              <div className="match-bar-label">
                <span>Tenant fit</span>
                <strong>{tenantPct}%</strong>
              </div>
              <div className="match-bar-track">
                <div className="match-bar-fill tenant" style={{ width: `${tenantPct}%` }} />
              </div>
              <p className="match-bar-caption">Your lifestyle profile vs what the host expects from tenants</p>
            </div>
          )}
        </div>
      )}

      {Object.keys(propertyParts).length > 0 && (
        <details className="match-breakdown-details">
          <summary>Property score details</summary>
          <ul className="match-breakdown-list">
            {Object.entries(propertyParts).map(([key, value]) => (
              <li key={key}>
                <span>{PROPERTY_LABELS[key] || key}</span>
                <strong>{Math.round(Number(value) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

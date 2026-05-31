import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icons';
import { ProfileInfoCard } from './details';
import PreferencesDisplayCard from '../preferences/display';
import MatchBreakdownCard, { MatchPercent } from '../matches/MatchBreakdown';
import ApplicationTourPanel from './ApplicationTour';
import {
  getApplicationDetail,
  applicationStatusClass,
  timeAgo,
} from '../../api/applications';

function formatRent(rent) {
  if (rent == null) return null;
  return `$${Number(rent).toLocaleString()}/mo`;
}

function LandlordApplicationReviewCard({ app, userId, onAction, busyId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const busy = busyId === app.id;

  const loadDetail = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getApplicationDetail(app.id);
      setDetail(res.data);
    } catch {
      setLoadError('Could not load applicant details. Try again.');
    }
    setLoading(false);
  };

  const toggleReview = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!detail) await loadDetail();
  };

  const matchListing = detail?.match_breakdown
    ? { match_breakdown: detail.match_breakdown }
    : null;
  const reviewApp = detail ? { ...app, ...detail } : app;
  const acceptBlocked = reviewApp.tour_blocks_accept;

  return (
    <li className="app-review-card">
      <div className="app-review-header">
        <div className="app-review-header-main">
          <strong>{app.listing_title}</strong>
          <span>
            {app.tenant_name}
            {' · Applied '}
            {timeAgo(app.created_at)}
          </span>
        </div>
        <span className={`activity-status-badge ${applicationStatusClass(app.status)}`}>
          Needs review
        </span>
      </div>

      <ApplicationTourPanel
        app={reviewApp}
        userId={userId}
        onAction={onAction}
        busyId={busyId}
      />

      <div className="app-review-toolbar">
        <button
          type="button"
          className={`cta-btn small${open ? ' ghost' : ''}`}
          onClick={toggleReview}
          aria-expanded={open}
        >
          <Icon name={open ? 'arrow-left' : 'magnifying-glass'} />
          {open ? 'Hide review' : 'Review application'}
        </button>
        {detail?.listing_id && (
          <button
            type="button"
            className="activity-btn-link"
            onClick={() => navigate(`/listing/${detail.listing_id}`)}
          >
            View listing
          </button>
        )}
      </div>

      {open && (
        <div className="app-review-body">
          {loading && (
            <p className="app-review-loading">Loading applicant profile…</p>
          )}
          {loadError && (
            <p className="app-review-error">
              {loadError}
              {' '}
              <button type="button" className="activity-btn-link" onClick={loadDetail}>
                Retry
              </button>
            </p>
          )}

          {detail && !loading && (
            <>
              <div className="app-review-listing-context">
                <div>
                  <span className="app-review-context-label">For listing</span>
                  <strong>{detail.listing_title}</strong>
                </div>
                <div className="app-review-context-meta">
                  {detail.listing_location && (
                    <span><Icon name="map-pin" /> {detail.listing_location}</span>
                  )}
                  {formatRent(detail.listing_rent) && (
                    <span>{formatRent(detail.listing_rent)}</span>
                  )}
                  {matchListing && (
                    <MatchPercent listing={matchListing} className="app-review-match-pill" />
                  )}
                </div>
              </div>

              {matchListing && (
                <div className="app-review-match">
                  <h4>Compatibility with your listing</h4>
                  <MatchBreakdownCard listing={matchListing} compact />
                </div>
              )}

              {detail.tenant_profile && (
                <ProfileInfoCard
                  profile={detail.tenant_profile}
                  subtitle="Applicant profile — what tenants see on Nestopia"
                />
              )}

              {detail.renter_preferences ? (
                <PreferencesDisplayCard
                  preferences={detail.renter_preferences}
                  userType="renter"
                />
              ) : (
                <div className="preferences-info-card preferences-info-card-empty">
                  <div className="preferences-title">Housing preferences</div>
                  <p className="preferences-info-card-desc">
                    This applicant has not set housing preferences yet.
                  </p>
                </div>
              )}

              <div className="app-review-profile-link">
                <button
                  type="button"
                  className="cta-btn ghost small"
                  onClick={() => navigate(`/users/${app.tenant_id}`)}
                >
                  <Icon name="circle-user" /> View full profile &amp; reviews
                </button>
              </div>

              <div className="app-review-decision">
                {acceptBlocked ? (
                  <p className="app-review-blocked">
                    Resolve the pending tour proposal before accepting this application.
                  </p>
                ) : (
                  <p>
                    Accept to invite {app.tenant_name} to confirm. After they confirm, arrange lease signing together.
                  </p>
                )}
                <div className="activity-app-actions">
                  <button
                    type="button"
                    className="cta-btn small"
                    disabled={busy || acceptBlocked}
                    onClick={() => onAction('accept', app.id)}
                  >
                    {busy ? 'Saving…' : 'Accept application'}
                  </button>
                  <button
                    type="button"
                    className="activity-btn-decline"
                    disabled={busy}
                    onClick={() => onAction('reject', app.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default function LandlordReviewQueue({ applications, userId, onAction, busyId }) {
  if (!applications.length) return null;

  return (
    <section className="activity-section app-review-queue">
      <div className="app-review-queue-head">
        <div>
          <h2 className="activity-section-title">Applications to review</h2>
          <p className="activity-section-sub">
            Review each applicant&apos;s profile and preferences before accepting or declining.
          </p>
        </div>
        <span className="app-review-queue-count">{applications.length}</span>
      </div>
      <ul className="app-review-list">
        {applications.map((app) => (
          <LandlordApplicationReviewCard
            key={app.id}
            app={app}
            userId={userId}
            onAction={onAction}
            busyId={busyId}
          />
        ))}
      </ul>
    </section>
  );
}

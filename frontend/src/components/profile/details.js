import React, { useState } from 'react';
import { Icon } from '../Icons';
import { listingImageUrl } from '../../api/listings';
import {
  applicationStatusClass,
  applicationStatusLabel,
  timeAgo,
} from '../../api/applications';
import LandlordReviewQueue from './ApplicationReview';
import ApplicationTourPanel from './ApplicationTour';
import {
  displayName,
  roleLabel,
  formatMemberSince,
  contactPreferenceLabel,
  maskedPhone,
} from '../../api/user';

export function StarRating({ value, max = 5 }) {
  return (
    <span className="profile-star-rating" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name={i < value ? 'star' : 'star-outline'} />
      ))}
    </span>
  );
}

function InteractiveStarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="profile-star-input" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            className={`profile-star-input-btn${star <= active ? ' active' : ''}`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-checked={value === star}
            role="radio"
          >
            <Icon name={star <= active ? 'star' : 'star-outline'} />
          </button>
        );
      })}
    </div>
  );
}

export function LeaveReviewForm({ onSubmit, submitting = false, targetName }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating) {
      setError('Choose a star rating.');
      return;
    }
    if (body.trim().length < 10) {
      setError('Write at least 10 characters.');
      return;
    }
    try {
      await onSubmit({ rating, body: body.trim() });
      setRating(0);
      setBody('');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg
          : 'Could not post review.';
      setError(msg || 'Could not post review.');
    }
  };

  return (
    <form className="profile-leave-review" onSubmit={handleSubmit}>
      <h5>Leave a review</h5>
      <p className="profile-leave-review-hint">
        Share your experience working with {targetName || 'this member'}.
      </p>
      <InteractiveStarRating value={rating} onChange={setRating} />
      <textarea
        className="form-input profile-review-textarea"
        rows={3}
        maxLength={500}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What went well? Would you rent to or from them again?"
      />
      <div className="profile-review-form-foot">
        <span className="profile-review-char-count">{body.length}/500</span>
        {error && <span className="profile-review-form-error">{error}</span>}
        <button type="submit" className="cta-btn small" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </form>
  );
}

function reviewerRoleLabel(role) {
  return role === 'landlord' ? 'Landlord' : 'Tenant';
}

export function ProfileInfoCard({
  profile,
  isSelf = false,
  onEdit,
  editLabel = 'Edit',
  subtitle,
  onSubmitReview,
  reviewSubmitting = false,
}) {
  const avatarSrc = listingImageUrl(profile.profilePicture);
  const memberSince = profile.member_since || formatMemberSince(profile.created_at);
  const isLandlord = profile.role === 'landlord';
  const showPrivate = isSelf;

  return (
    <section className="profile-info-card">
      <div className="profile-info-head">
        <div>
          <h2 className="profile-info-title">Profile Information</h2>
          <p className="profile-info-subtitle">
            {subtitle || (isSelf
              ? 'Your personal information and account details'
              : `${displayName(profile)} on Nestopia`)}
          </p>
        </div>
        {isSelf && onEdit && (
          <button type="button" className="profile-info-edit-btn" onClick={onEdit}>
            <Icon name="pen" /> {editLabel}
          </button>
        )}
      </div>

      <div className="profile-info-identity">
        <div className="profile-info-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" />
          ) : (
            <Icon name="circle-user" />
          )}
        </div>
        <div className="profile-info-identity-text">
          <div className="profile-info-name-row">
            <h3>{displayName(profile)}</h3>
            <Icon name="circle-check" className="profile-verified-icon" />
          </div>
          {showPrivate && profile.email && (
            <p className="profile-info-email">
              <Icon name="envelope" /> {profile.email}
            </p>
          )}
          <span className={`profile-role-badge${isLandlord ? ' landlord' : ''}`}>
            {roleLabel(profile.role)}
          </span>
        </div>
      </div>

      <div className="profile-info-grid">
        <div className="profile-info-field">
          <span className="profile-info-label"><Icon name="calendar" /> Member since</span>
          <span className="profile-info-value">{memberSince}</span>
        </div>
        <div className="profile-info-field">
          <span className="profile-info-label"><Icon name="map-pin" /> Location</span>
          <span className="profile-info-value">{profile.location || 'Not set'}</span>
        </div>
        {showPrivate && (
          <div className="profile-info-field">
            <span className="profile-info-label"><Icon name="phone" /> Phone</span>
            <span className="profile-info-value">
              {profile.phone ? maskedPhone(profile.phone) || profile.phone : 'Not added'}
            </span>
          </div>
        )}
        {showPrivate && isLandlord && (
          <div className="profile-info-field">
            <span className="profile-info-label"><Icon name="envelope-open-text" /> Tenant contact</span>
            <span className="profile-info-value">
              {contactPreferenceLabel(profile.contact_preference)}
            </span>
          </div>
        )}
        {!showPrivate && isLandlord && (
          <div className="profile-info-field">
            <span className="profile-info-label"><Icon name="envelope-open-text" /> Contact</span>
            <span className="profile-info-value">
              Via listing · {contactPreferenceLabel(profile.contact_preference || 'any').toLowerCase()} preferred
            </span>
          </div>
        )}
        {!showPrivate && !isLandlord && (
          <div className="profile-info-field">
            <span className="profile-info-label"><Icon name="circle-user" /> Role</span>
            <span className="profile-info-value">{roleLabel(profile.role)}</span>
          </div>
        )}
      </div>

      {profile.about && (
        <div className="profile-info-bio">
          <h4>Bio</h4>
          <p>{profile.about}</p>
        </div>
      )}

      <div className="profile-reviews-section">
        <div className="profile-reviews-head">
          <h4>
            <Icon name="star" className="profile-reviews-star-icon" />
            Reviews ({profile.rating_count || 0})
          </h4>
          {profile.rating_avg != null && (
            <div className="profile-overall-rating">
              <StarRating value={Math.round(profile.rating_avg)} />
              <span className="profile-rating-score">{profile.rating_avg}</span>
              <span className="profile-rating-label">overall</span>
            </div>
          )}
        </div>

        {!isSelf && profile.same_person && (
          <p className="profile-reviews-note">You can&apos;t review yourself.</p>
        )}

        {!isSelf && profile.can_review && onSubmitReview && (
          <LeaveReviewForm
            targetName={displayName(profile)}
            onSubmit={onSubmitReview}
            submitting={reviewSubmitting}
          />
        )}

        {profile.reviews?.length > 0 ? (
          <div className="profile-review-list">
            {profile.reviews.map((review) => (
              <article key={review.id} className="profile-review-card">
                <div className="profile-review-top">
                  <strong>
                    {review.reviewer_name}{' '}
                    <span className="profile-review-role">({reviewerRoleLabel(review.reviewer_role)})</span>
                  </strong>
                  <StarRating value={review.rating} />
                </div>
                <p>{review.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-reviews-empty">No reviews yet.</p>
        )}
      </div>
    </section>
  );
}

export function ActivityPanel({
  activity = [],
  applications = [],
  isLandlord,
  userId,
  onAction,
  busyId,
  navigate,
}) {
  const pendingReview = isLandlord
    ? applications.filter((a) => a.status === 'pending' && a.is_landlord)
    : [];
  const trackedApps = isLandlord
    ? applications.filter((a) => !(a.status === 'pending' && a.is_landlord))
    : applications;

  const appsTitle = isLandlord ? 'In progress & history' : 'My applications';
  const appsSubtitle = isLandlord
    ? 'Tenants who applied to your listings.'
    : 'Status of properties you applied to.';

  const renderAppActions = (app) => {
    const busy = busyId === app.id;

    if (app.status === 'pending' && app.is_landlord) {
      return null;
    }
    if (app.status === 'pending') {
      return (
        <>
          <ApplicationTourPanel app={app} userId={userId} onAction={onAction} busyId={busyId} />
          {app.is_tenant && (
            <button type="button" className="activity-btn-decline" disabled={busy} onClick={() => onAction('withdraw', app.id)}>
              Withdraw
            </button>
          )}
        </>
      );
    }
    if (app.status === 'awaiting_tenant' && app.is_tenant) {
      return (
        <div className="activity-app-actions">
          <button type="button" className="cta-btn small" disabled={busy} onClick={() => onAction('confirm', app.id)}>
            Confirm acceptance
          </button>
          <button type="button" className="activity-btn-decline" disabled={busy} onClick={() => onAction('withdraw', app.id)}>
            Withdraw
          </button>
        </div>
      );
    }
    if (app.status === 'awaiting_lease' && app.is_landlord) {
      return (
        <div className="activity-app-actions">
          <button type="button" className="cta-btn small" disabled={busy} onClick={() => onAction('approve-lease', app.id)}>
            Lease signed — mark complete
          </button>
        </div>
      );
    }
    if (app.status === 'awaiting_move_in' && app.is_landlord) {
      return (
        <div className="activity-app-actions">
          <button type="button" className="cta-btn small" disabled={busy} onClick={() => onAction('approve-lease', app.id)}>
            Lease signed — mark complete
          </button>
        </div>
      );
    }
    if (app.status === 'active' && app.is_tenant && navigate) {
      return (
        <button type="button" className="activity-btn-link" onClick={() => navigate(`/listing/${app.listing_id}`)}>
          View your home
        </button>
      );
    }
    return null;
  };

  return (
    <div className="activity-panel">
      {isLandlord && pendingReview.length > 0 && (
        <LandlordReviewQueue
          applications={pendingReview}
          userId={userId}
          onAction={onAction}
          busyId={busyId}
        />
      )}

      <section className="activity-section">
        <h2 className="activity-section-title">Recent activity</h2>
        <p className="activity-section-sub">What&apos;s been happening on your account.</p>
        {activity.length === 0 ? (
          <p className="activity-empty">No activity yet. Contact a listing to start an application.</p>
        ) : (
          <ul className="activity-feed">
            {activity.map((item, i) => (
              <li key={`${item.kind}-${item.at}-${i}`} className="activity-feed-item">
                <span className="activity-feed-icon"><Icon name={item.icon || 'file-signature'} /></span>
                <div className="activity-feed-body">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </div>
                <time className="activity-feed-time">{timeAgo(item.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="activity-section">
        <h2 className="activity-section-title">{appsTitle}</h2>
        <p className="activity-section-sub">{appsSubtitle}</p>
        {trackedApps.length === 0 ? (
          <p className="activity-empty">
            {isLandlord && pendingReview.length > 0
              ? 'No other applications in progress.'
              : 'No applications yet.'}
          </p>
        ) : (
          <ul className="activity-app-list">
            {trackedApps.map((app) => (
              <li key={app.id} className="activity-app-item">
                <div className="activity-app-main">
                  <strong>{app.listing_title}</strong>
                  <span>
                    {isLandlord ? `Applicant: ${app.tenant_name}` : `Host: ${app.landlord_name}`}
                    {' · '}{timeAgo(app.updated_at || app.created_at)}
                  </span>
                  {app.stage_message && (
                    <p className="activity-stage-message">{app.stage_message}</p>
                  )}
                  {renderAppActions(app)}
                </div>
                <span className={`activity-status-badge ${applicationStatusClass(app.status)}`}>
                  {applicationStatusLabel(app.status, { isLandlord: isLandlord && app.is_landlord })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// end ActivityPanel

export default ProfileInfoCard;

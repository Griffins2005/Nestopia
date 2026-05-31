import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../components/Icons';
import { useNestopia, normalizeListing } from '../context/NestopiaContext';
import EmptyState, { ListingsLoading } from '../components/EmptyState';
import { NO_LISTINGS, getListingById, getListingImages, listingImageUrl } from '../api/listings';
import { hostContactChannels, preferredContactChannel, otherContactChannels, contactPreferenceLabel, normalizeContactPreference } from '../api/user';
import { applyFromContact } from '../api/applications';
import ListingMiniMap from '../components/ListingMiniMap';
import { ListingImageCarousel } from '../components/listings/listingCard';
import { ListingTenantRequirementsCard, getListingTenantRequirements } from '../components/preferences/display';
import MatchBreakdownCard, { MatchPercent } from '../components/matches/MatchBreakdown';
import { getListingMatchPercent, stripMatchFields } from '../api/matches';

function formatAvailableDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
  return value;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, savedIds, toggleSave, flashToast, listings } = useNestopia();
  const listingsRef = useRef(listings);
  listingsRef.current = listings;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchReady, setMatchReady] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    setMatchReady(false);

    const cached = listingsRef.current.find((l) => l.id === Number(id));
    if (cached) {
      setListing(stripMatchFields(normalizeListing(cached)));
      setLoading(false);
    } else {
      setListing(null);
      setLoading(true);
    }

    getListingById(id)
      .then((res) => {
        if (cancelled) return;
        setListing(normalizeListing(res.data));
        setMatchReady(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        if (!cached) {
          setListing(null);
          setNotFound(true);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
    // listings read via listingsRef — only refetch when route id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="detail-shell">
        <ListingsLoading count={1} className="detail-loading-grid" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="detail-shell">
        <button type="button" className="detail-back" onClick={() => navigate('/listings')}>
          <Icon name="arrow-left" /> Back to listings
        </button>
        <EmptyState
          {...NO_LISTINGS}
          primaryAction={{ label: 'Browse listings', onClick: () => navigate('/listings'), icon: 'arrow-right' }}
        />
      </div>
    );
  }

  const matchScore = matchReady ? getListingMatchPercent(listing) : 0;
  const isSaved = savedIds.includes(listing.id);
  const isOwner = user?.id && (listing.landlord_id === user.id || listing.host?.email === user.email);
  const isRenterView = !isOwner;
  const images = getListingImages(listing);
  const host = listing.host || listing.landlord || {};
  const contactContext = {
    host,
    listing,
    tenant: user,
    listingUrl: `${window.location.origin}/listing/${listing.id}`,
  };
  const contactChannels = hostContactChannels(contactContext);
  const preferred = preferredContactChannel(contactContext);
  const altChannels = otherContactChannels(contactContext);
  const hostAvatar = listingImageUrl(host.profilePicture || host.avatar);
  const featureItems = listing.building_features?.length ? [...listing.building_features] : [];
  const leaseLabel = listing.lease_length
    ? (String(listing.lease_length).toLowerCase().startsWith('lease')
      ? listing.lease_length
      : `Lease ${listing.lease_length}`)
    : '';

  const tenantReqs = getListingTenantRequirements(listing);
  const tenantReqCount = tenantReqs.tenantPrefs.length + tenantReqs.customReqs.length;

  const requireAuth = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listing/${id}` } } });
      return false;
    }
    return true;
  };

  const handleContact = async (channel) => {
    if (!requireAuth()) return;
    const target = channel || preferred;
    if (!target?.href) {
      flashToast('This host has not added contact info yet.');
      return;
    }
    if (isRenterView && user?.role === 'renter') {
      try {
        await applyFromContact(listing.id);
        flashToast('Application submitted. Opening contact…');
      } catch (err) {
        const detail = err?.response?.data?.detail;
        if (typeof detail === 'string' && !detail.includes('already')) {
          flashToast(detail);
          return;
        }
      }
    }
    window.location.href = target.href;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        flashToast('Link copied.');
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="detail-shell detail-v2">
      <button type="button" className="detail-back" onClick={() => navigate(-1)}>
        <Icon name="arrow-left" /> Back to listings
      </button>

      <div className="detail-grid">
        <div className="detail-main">
          <ListingImageCarousel images={images} alt={listing.title} variant="detail" />

          <div className="detail-header-block">
            <div className="detail-title-line">
              <h1>{listing.title}</h1>
              {isRenterView && matchReady && matchScore > 0 && (
                <span className="detail-match-badge"><MatchPercent listing={listing} /></span>
              )}
            </div>
            <p className="detail-address">
              <Icon name="map-pin" /> {listing.location}
            </p>
            <div className="detail-stats-row">
              <span><Icon name="bed" /> {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} beds`}</span>
              {listing.bathrooms != null && <span><Icon name="bath" /> {listing.bathrooms} baths</span>}
              {listing.sqft && <span><Icon name="ruler" /> {listing.sqft} sqft</span>}
            </div>
          </div>

          <section className="detail-section">
            <h3>Description</h3>
            <p>{listing.description}</p>
          </section>

          {listing.amenities?.length > 0 && (
            <section className="detail-section">
              <h3>Amenities</h3>
              <div className="detail-amenity-cards">
                {listing.amenities.map((a) => (
                  <div key={a} className="detail-amenity-card">
                    <Icon name="circle-check" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {featureItems.length > 0 && (
            <section className="detail-section">
              <h3>Features</h3>
              <ul className="detail-feature-list">
                {featureItems.map((f) => (
                  <li key={f}><span className="detail-feature-dot" />{f}</li>
                ))}
              </ul>
            </section>
          )}

          {(tenantReqs.hasContent || isOwner) && (
            <div className="detail-tenant-section">
              <ListingTenantRequirementsCard
                listing={listing}
                compact
                isOwner={isOwner}
                onEdit={isOwner ? () => navigate(`/listing/edit/${listing.id}#tenant-requirements`) : undefined}
              />
            </div>
          )}

          <ListingMiniMap lat={listing.lat} lng={listing.lng} label={listing.location} />
        </div>

        <aside className="detail-side">
          {isRenterView && matchReady && matchScore > 0 && (
            <MatchBreakdownCard listing={listing} />
          )}
          <div className="detail-booking-card">
            <div className="detail-booking-price">
              ${listing.rent_price?.toLocaleString()}<span>/month</span>
            </div>

            {(listing.available_from || leaseLabel) && (
              <div className="detail-booking-meta">
                {listing.available_from && (
                  <span><Icon name="calendar" /> Available {formatAvailableDate(listing.available_from)}</span>
                )}
                {leaseLabel && (
                  <span><Icon name="file-signature" /> {leaseLabel}</span>
                )}
              </div>
            )}

            {isOwner ? (
              <>
                <p className="detail-owner-note">You host this listing.</p>
                <button type="button" className="cta-btn detail-contact-btn" onClick={() => navigate(`/listing/edit/${listing.id}`)}>
                  <Icon name="pen" /> Edit listing
                </button>
                <button
                  type="button"
                  className="cta-btn ghost small detail-tenant-edit-btn"
                  onClick={() => navigate(`/listing/edit/${listing.id}#tenant-requirements`)}
                >
                  Tenant requirements{tenantReqCount > 0 ? ` (${tenantReqCount})` : ''}
                </button>
                <div className="detail-action-row">
                  <button type="button" className="detail-action-btn" onClick={() => toggleSave(listing.id)}>
                    {isSaved ? <Icon name="heart" /> : <RegIcon name="heart" />} Save
                  </button>
                  <button type="button" className="detail-action-btn" onClick={handleShare}>
                    <Icon name="arrow-up-from-bracket" /> Share
                  </button>
                </div>
              </>
            ) : (
              <>
                {!user ? (
                  <button type="button" className="cta-btn detail-contact-btn" onClick={() => requireAuth()}>
                    <Icon name="envelope-open-text" /> Contact host
                  </button>
                ) : contactChannels.length > 0 ? (
                  <>
                    <button type="button" className="cta-btn detail-contact-btn" onClick={() => handleContact()}>
                      <Icon name={preferred?.icon || 'envelope-open-text'} /> {preferred?.actionLabel || 'Contact host'}
                    </button>
                    {altChannels.length > 0 && (
                      <div className="detail-contact-channels">
                        {altChannels.map((ch) => (
                          <button
                            key={ch.type}
                            type="button"
                            className="detail-channel-link"
                            onClick={() => handleContact(ch)}
                          >
                            <Icon name={ch.icon} /> {ch.actionLabel}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="detail-side-note detail-contact-note">
                      Opens {contactPreferenceLabel(preferred?.type || 'email').toLowerCase()} with a pre-written intro about this listing.
                    </p>
                  </>
                ) : (
                  <p className="detail-side-note">Host contact info not on file yet.</p>
                )}
                <div className="detail-action-row">
                  <button type="button" className="detail-action-btn" onClick={() => {
                    if (!requireAuth()) return;
                    toggleSave(listing.id);
                    flashToast(isSaved ? 'Removed from saved.' : 'Saved.');
                  }}>
                    {isSaved ? <Icon name="heart" /> : <RegIcon name="heart" />} Save
                  </button>
                  <button type="button" className="detail-action-btn" onClick={handleShare}>
                    <Icon name="arrow-up-from-bracket" /> Share
                  </button>
                </div>

                {!user && (
                  <p className="detail-side-note">Sign in to reach the host by their preferred channel.</p>
                )}
              </>
            )}

            <div className="detail-host-card">
              <p className="detail-host-label">{isOwner ? 'Your profile' : 'Property owner'}</p>
              <div className="host-row">
                <div className="host-avatar">
                  {hostAvatar ? (
                    <img src={hostAvatar} alt="" />
                  ) : (
                    <Icon name="circle-user" />
                  )}
                </div>
                <div>
                  <div className="host-name">
                    {host.id && !isOwner ? (
                      <button type="button" className="host-name-link" onClick={() => navigate(`/users/${host.id}`)}>
                        {host.name || 'Host'}
                      </button>
                    ) : (
                      host.name || 'Host'
                    )}
                  </div>
                  <div className="host-role">Host since {host.since || listing.host?.since || '2024'}</div>
                  {isRenterView && (
                    <div className="host-pref">Prefers {contactPreferenceLabel(normalizeContactPreference(host.contact_preference || preferred?.type)).toLowerCase()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon, RegIcon } from '../components/Icons';
import { useNestopia } from '../context/NestopiaContext';
import { getListingById } from '../api/listings';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, savedIds, toggleSave, flashToast, listings } = useNestopia();

  const [listing, setListing] = useState(() => listings.find((l) => l.id === Number(id)) || null);
  const [loading, setLoading] = useState(!listing);
  const [contactShown, setContactShown] = useState(false);

  useEffect(() => {
    setContactShown(false);
    const cached = listings.find((l) => l.id === Number(id));
    if (cached) { setListing(cached); setLoading(false); return; }
    setLoading(true);
    getListingById(id)
      .then(res => {
        const l = res.data;
        setListing({
          ...l,
          image: l.images?.[0] || l.image || '/assets/default-house.png',
          match_score: l.match_score || 0,
          amenities: l.amenities || [],
          host: l.host || { name: 'Host', since: '2024', email: '', phone: '' },
        });
        setLoading(false);
      })
      .catch(() => { navigate('/listings'); });
  }, [id]);

  if (loading) return <div className="detail-shell"><p style={{ padding: "2rem" }}>Loading…</p></div>;
  if (!listing) return null;

  const matchScore = Math.round((listing.match_score || 0) * 100);
  const isSaved = savedIds.includes(listing.id);
  const isOwner = user?.id && (listing.landlord_id === user.id || listing.host?.email === user.email);

  const handleReveal = () => {
    if (!user) { navigate('/login'); return; }
    setContactShown(true);
    flashToast("Contact details revealed — make it warm.");
  };

  return (
    <div className="detail-shell">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <Icon name="arrow-left" /> Back to listings
      </button>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-hero-img" style={{ backgroundImage: `url(${listing.image})` }} />

          <div className="detail-title-row">
            <div>
              <p className="detail-loc">{listing.location}</p>
              <h1>{listing.title}</h1>
            </div>
            <div className="detail-price">
              ${listing.rent_price?.toLocaleString()}<span>/mo</span>
            </div>
          </div>

          <div className="detail-meta">
            <span><b>{listing.bedrooms === 0 ? "Studio" : listing.bedrooms}</b>{listing.bedrooms === 0 ? "" : " beds"}</span>
            {listing.bathrooms != null && <span><b>{listing.bathrooms}</b> baths</span>}
            {listing.sqft && <span><b>{listing.sqft}</b> sqft</span>}
            {listing.available_from && <span>Available <b>{listing.available_from}</b></span>}
            {listing.lease_length && <span>Lease <b>{listing.lease_length}</b></span>}
            {listing.pets && <span><b>{listing.pets}</b></span>}
          </div>

          <section className="detail-section">
            <h3>About this home</h3>
            <p>{listing.description}</p>
          </section>

          {listing.amenities?.length > 0 && (
            <section className="detail-section">
              <h3>Amenities</h3>
              <div className="detail-amenities">
                {listing.amenities.map((a) => <span key={a} className="amenity-tag">{a}</span>)}
              </div>
            </section>
          )}

          {listing.house_rules && (
            <section className="detail-section">
              <h3>House rules</h3>
              <p>{listing.house_rules}</p>
            </section>
          )}
        </div>

        <aside className="detail-side">
          {isOwner ? (
            <div className="owner-panel">
              <span className="owner-tag"><Icon name="circle-check" /> You host this home</span>
              <p>Keep details fresh so renters reach out with confidence.</p>
              <div className="detail-actions">
                <button className="cta-btn" onClick={() => navigate(`/listing/edit/${listing.id}`)}>
                  <Icon name="pen" /> Edit listing
                </button>
                <button className="cta-btn ghost" onClick={() => toggleSave(listing.id)}>
                  {isSaved ? <Icon name="heart" /> : <RegIcon name="heart" />} {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {matchScore > 0 && (
                <>
                  <div className="match-big">{matchScore}%</div>
                  <small>match for your preferences</small>
                </>
              )}

              <div className="host-row">
                <img src="/assets/avatar.png" alt="" />
                <div>
                  <div className="host-name">{listing.host?.name || 'Host'}</div>
                  <div className="host-role">Host since {listing.host?.since || '2024'}</div>
                </div>
              </div>

              {contactShown ? (
                <ul className="contact-list">
                  {listing.host?.email && <li><Icon name="envelope" /> {listing.host.email}</li>}
                  {listing.host?.phone && <li><Icon name="phone" /> {listing.host.phone}</li>}
                </ul>
              ) : (
                <p style={{ color: "var(--ntp-fg-soft)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1rem" }}>
                  Sign in or reveal to see {listing.host?.name || 'the host'}'s contact info — we keep it private until both sides are ready.
                </p>
              )}

              <div className="detail-actions">
                <button className="cta-btn" onClick={handleReveal}>
                  <Icon name="envelope-open-text" /> Contact host
                </button>
                <button className="cta-btn ghost" onClick={() => {
                  toggleSave(listing.id);
                  flashToast(isSaved ? "Removed from saved." : "Saved to your collection.");
                }}>
                  {isSaved ? <Icon name="heart" /> : <RegIcon name="heart" />} {isSaved ? "Saved" : "Save"}
                </button>
                <button className="cta-btn ghost">
                  <Icon name="calendar" /> Plan a visit
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

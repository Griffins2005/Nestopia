import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { useNestopia } from '../context/NestopiaContext';
import AuthContext from '../context/authContext';
import { getMyListings } from '../api/listings';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user: ctxUser, preferences } = useNestopia();
  const { refreshProfile } = useContext(AuthContext);
  const user = ctxUser;

  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', location: '', bio: '' });
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDraft({ name: user.name || user.email || '', email: user.email || '', location: user.location || '', bio: user.bio || '' });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.accessToken) return;
    if (user.role === 'landlord') {
      getMyListings()
        .then(res => setMyListings((res.data || []).map(l => ({
          ...l,
          image: l.images?.[0] || l.image || '/assets/default-house.png',
        }))))
        .catch(() => {});
    }
    axios.get('/api/listings/saved/', {
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      headers: { Authorization: `Bearer ${user.accessToken}` },
    })
      .then(res => setSavedListings((res.data || []).map(l => ({
        ...l,
        image: l.images?.[0] || l.image || '/assets/default-house.png',
      }))))
      .catch(() => {});
  }, [user?.accessToken, user?.role]);

  const isLandlord = user?.role === 'landlord';

  const saveProfile = async () => {
    if (!draft.name?.trim() || !draft.email?.trim()) return;
    setSaving(true);
    try {
      await axios.put('/api/users/me', { name: draft.name, bio: draft.bio, location: draft.location }, {
        baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (refreshProfile) await refreshProfile();
    } catch (e) {}
    setSaving(false);
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="profile-shell">
      <section className="profile-hero">
        <div className="profile-avatar-lg">
          <img src="/assets/avatar.png" alt="" />
        </div>
        <div style={{ flex: 1 }}>
          <h1>{user.name || user.email}</h1>
          <p className="profile-loc">{user.location || ''}{user.location ? ' · ' : ''}{isLandlord ? "Hosting" : "Renting"} with Nestopia</p>
        </div>
        {!editing && (
          <button className="cta-btn ghost" onClick={() => setEditing(true)}>
            <Icon name="pen" /> Edit profile
          </button>
        )}
      </section>

      <div className="profile-tab-row">
        <button className={`profile-tab-btn ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
        {!isLandlord && (
          <button className={`profile-tab-btn ${tab === "preferences" ? "active" : ""}`} onClick={() => setTab("preferences")}>Preferences</button>
        )}
        {isLandlord && (
          <button className={`profile-tab-btn ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>My listings ({myListings.length})</button>
        )}
        <button className={`profile-tab-btn ${tab === "saved" ? "active" : ""}`} onClick={() => setTab("saved")}>Saved ({savedListings.length})</button>
        <button className={`profile-tab-btn ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}>Security</button>
      </div>

      {tab === "overview" && (
        <div className="profile-card">
          <h2>About you</h2>
          {editing ? (
            <div className="ntp-form" style={{ border: "none", padding: 0, gap: "1rem" }}>
              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={draft.email} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Location</label>
                <input className="form-input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Short bio</label>
                <textarea className="form-input" rows="3" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="A line or two so hosts get a feel for you." />
              </div>
              <div className="form-actions">
                <button className="cta-btn" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                <button className="cta-btn ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-row"><span className="k">Name</span><span className="v">{user.name || user.email}</span></div>
              <div className="profile-row"><span className="k">Email</span><span className="v">{user.email}</span></div>
              {user.location && <div className="profile-row"><span className="k">Location</span><span className="v">{user.location}</span></div>}
              <div className="profile-row"><span className="k">Role</span><span className="v">{isLandlord ? "Landlord" : "Renter"}</span></div>
              {user.bio && <div className="profile-row"><span className="k">Bio</span><span className="v">{user.bio}</span></div>}
            </>
          )}
        </div>
      )}

      {tab === "preferences" && (
        <div className="profile-card">
          <div className="profile-card-head">
            <h2>Renter preferences</h2>
            <button className="cta-btn ghost small" onClick={() => navigate('/preferences')}><Icon name="pen" /> {preferences ? "Edit" : "Set up"}</button>
          </div>
          {preferences ? (
            <>
              {preferences.budget_min != null && <div className="profile-row"><span className="k">Budget</span><span className="v">${Number(preferences.budget_min).toLocaleString()} – ${Number(preferences.budget_max || preferences.max_rent || 0).toLocaleString()} / mo</span></div>}
              {preferences.bedrooms != null && <div className="profile-row"><span className="k">Bedrooms</span><span className="v">{preferences.bedrooms === 0 ? "Studio" : `${preferences.bedrooms}+`}</span></div>}
              {preferences.locations?.length > 0 && <div className="profile-row"><span className="k">Neighborhoods</span><span className="v">{preferences.locations.join(" · ")}</span></div>}
              {preferences.move_in && <div className="profile-row"><span className="k">Move-in</span><span className="v">{preferences.move_in}</span></div>}
              {preferences.lease_length && <div className="profile-row"><span className="k">Lease</span><span className="v">{preferences.lease_length}</span></div>}
              {preferences.amenities?.length > 0 && <div className="profile-row"><span className="k">Must-haves</span><span className="v">{preferences.amenities.join(" · ")}</span></div>}
            </>
          ) : (
            <p style={{ color: "var(--ntp-fg-soft)", margin: 0 }}>No preferences yet. Set them up to unlock personalized match scores.</p>
          )}
        </div>
      )}

      {tab === "listings" && (
        <div className="profile-card">
          <div className="profile-card-head">
            <h2>My listings</h2>
            <button className="cta-btn ghost small" onClick={() => navigate('/listing/new')}><Icon name="plus" /> Add</button>
          </div>
          {myListings.length === 0 ? (
            <p style={{ color: "var(--ntp-fg-soft)", margin: 0 }}>You haven&apos;t published a listing yet.</p>
          ) : (
            <div className="profile-listing-list">
              {myListings.map((l) => (
                <button key={l.id} className="profile-listing-row" onClick={() => navigate(`/listing/${l.id}`)}>
                  <div className="pl-thumb" style={{ backgroundImage: `url(${l.image})` }} />
                  <div className="pl-body">
                    <strong>{l.title}</strong>
                    <span>{l.location}</span>
                  </div>
                  <span className="pl-price">${l.rent_price?.toLocaleString()}<small>/mo</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="profile-card">
          <div className="profile-card-head">
            <h2>Saved homes</h2>
            {savedListings.length > 0 && <button className="cta-btn ghost small" onClick={() => navigate('/saved')}>Open shelf</button>}
          </div>
          {savedListings.length === 0 ? (
            <p style={{ color: "var(--ntp-fg-soft)", margin: 0 }}>You haven&apos;t saved anything yet — heart a listing to come back to it later.</p>
          ) : (
            <div className="profile-listing-list">
              {savedListings.map((l) => (
                <button key={l.id} className="profile-listing-row" onClick={() => navigate(`/listing/${l.id}`)}>
                  <div className="pl-thumb" style={{ backgroundImage: `url(${l.image})` }} />
                  <div className="pl-body">
                    <strong>{l.title}</strong>
                    <span>{l.location}</span>
                  </div>
                  <span className="pl-price">${l.rent_price?.toLocaleString()}<small>/mo</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "security" && (
        <div className="profile-card">
          <h2>Security</h2>
          <div className="profile-row"><span className="k">Email</span><span className="v">{user.email}</span></div>
          <div className="profile-row"><span className="k">Two-factor</span><span className="v">Off</span></div>
          <div className="profile-row"><span className="k">Connected accounts</span><span className="v">{user.google_id ? 'Google' : 'Email/password'}</span></div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { useNestopia } from '../context/NestopiaContext';
import AuthContext from '../context/authContext';
import { NO_LISTINGS, getMyListings } from '../api/listings';
import { nameOrPlaceholder, profilePhotoUrl, uploadProfilePhoto, CONTACT_PREFERENCE_OPTIONS, isValidPhone, getPublicProfile, updateProfile, changePassword as changePasswordApi } from '../api/user';
import { getSavedListings } from '../api/listings';
import { getSecurityStatus, setupTotp, confirmTotp as confirmTotpApi, disableTotp as disableTotpApi } from '../api/security';
import { ProfileInfoCard, ActivityPanel } from '../components/profile/details';
import {
  getActivityFeed,
  withdrawApplication,
  landlordAcceptApplication,
  landlordRejectApplication,
  tenantConfirmApplication,
  setApplicationMoveIn,
  proposeTour,
  acceptTour,
  rejectTour,
  counterProposeTour,
  combineDateAndTime,
} from '../api/applications';
import PreferencesDisplayCard from '../components/preferences/display';
import PasswordStrength from '../components/PasswordStrength';
import { isStrongPassword } from '../api/auth';

export default function Profile() {
  const navigate = useNavigate();
  const { user: ctxUser, preferences, flashToast } = useNestopia();
  const { refreshProfile } = useContext(AuthContext);
  const user = ctxUser;

  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', location: '', about: '', phone: '', contact_preference: 'any' });
  const [publicProfile, setPublicProfile] = useState(null);
  const [activityData, setActivityData] = useState({ activity: [], applications: [] });
  const [activityBusy, setActivityBusy] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showPwForm, setShowPwForm] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpError, setTotpError] = useState('');
  const [disablePw, setDisablePw] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const isGoogle = user?.auth_method === 'google';

  useEffect(() => {
    if (user) {
      setDraft({
        name: nameOrPlaceholder(user),
        email: user.email || '',
        location: user.location || '',
        about: user.about || '',
        phone: user.phone || '',
        contact_preference: user.contact_preference || 'any',
      });
      setTotpEnabled(Boolean(user.totp_enabled));
    }
  }, [user]);

  useEffect(() => {
    if (!user || tab !== 'security') return;
    getSecurityStatus()
      .then((res) => {
        setTotpEnabled(Boolean(res.data?.totp_enabled));
        setHasPassword(Boolean(res.data?.has_password));
      })
      .catch(() => {});
  }, [user, tab]);

  useEffect(() => {
    if (!user || tab !== 'activity') return;
    getActivityFeed()
      .then((res) => setActivityData(res.data || { activity: [], applications: [] }))
      .catch(() => setActivityData({ activity: [], applications: [] }));
  }, [user, tab]);

  useEffect(() => {
    if (!user || tab !== 'overview') return;
    getPublicProfile(user.id)
      .then((res) => setPublicProfile(res.data))
      .catch(() => setPublicProfile(null));
  }, [user, tab]);

  const loadActivity = () => {
    getActivityFeed()
      .then((res) => setActivityData(res.data || { activity: [], applications: [] }))
      .catch(() => {});
  };

  const handleActivityAction = async (action, id, extra = {}) => {
    const tourBusy = action === 'tour-propose' || action === 'tour-counter';
    setActivityBusy(tourBusy ? `tour-${id}` : id);
    try {
      const scheduledAt = combineDateAndTime(extra.tourDate, extra.tourTime);
      if (action === 'accept') await landlordAcceptApplication(id);
      else if (action === 'reject') await landlordRejectApplication(id);
      else if (action === 'withdraw') await withdrawApplication(id);
      else if (action === 'confirm') await tenantConfirmApplication(id);
      else if (action === 'move-in') await setApplicationMoveIn(id, extra.moveInDate);
      else if (action === 'tour-propose') {
        if (!scheduledAt) { flashToast('Pick a date and time.'); return; }
        await proposeTour(id, scheduledAt);
      } else if (action === 'tour-counter') {
        if (!scheduledAt) { flashToast('Pick a date and time.'); return; }
        await counterProposeTour(id, scheduledAt);
      } else if (action === 'tour-accept') await acceptTour(id);
      else if (action === 'tour-reject') await rejectTour(id);
      loadActivity();
      flashToast('Updated.');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      flashToast(typeof detail === 'string' ? detail : 'Could not update.');
    }
    setActivityBusy(null);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'landlord') {
      getMyListings()
        .then(res => setMyListings((res.data || []).map(l => ({
          ...l,
          image: l.images?.[0] || l.image || '/assets/default-house.png',
        }))))
        .catch(() => {});
    }
    getSavedListings()
      .then(res => setSavedListings((res.data || []).map(l => ({
        ...l,
        image: l.images?.[0] || l.image || '/assets/default-house.png',
      }))))
      .catch(() => {});
  }, [user]);

  const isLandlord = user?.role === 'landlord';

  const profileTabs = [
    { id: 'overview', label: 'Profile', icon: 'circle-user' },
    ...(isLandlord
      ? [{ id: 'listings', label: 'Listings', icon: 'home', count: myListings.length }]
      : [{ id: 'preferences', label: 'Preferences', icon: 'gear' }]),
    { id: 'saved', label: 'Saved', icon: 'heart', count: savedListings.length },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'security', label: 'Security', icon: 'lock' },
  ];

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flashToast('Choose a JPG or PNG image.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!draft.name?.trim()) {
      flashToast('Add your name.');
      return;
    }
    if (isLandlord && draft.phone && !isValidPhone(draft.phone)) {
      flashToast('Use an international phone format like +14155551234.');
      return;
    }
    if (isLandlord && draft.contact_preference === 'text' && !draft.phone?.trim()) {
      flashToast('Add a phone number before choosing text as your preferred contact.');
      return;
    }
    setSaving(true);
    try {
      let profilePicture = user.profilePicture;
      if (photoFile) {
        const up = await uploadProfilePhoto(photoFile);
        profilePicture = up.data.file_url;
      }
      const payload = {
        name: draft.name.trim(),
        about: draft.about,
        location: draft.location,
        profilePicture,
      };
      if (isLandlord) {
        payload.phone = draft.phone?.trim() || null;
        payload.contact_preference = draft.contact_preference || 'any';
      }
      await updateProfile(payload);
      if (refreshProfile) await refreshProfile();
      const refreshed = await getPublicProfile(user.id);
      setPublicProfile(refreshed.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      flashToast('Profile updated.');
      setEditing(false);
    } catch (e) {
      flashToast('Could not save profile. Try again.');
    }
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Passwords don't match.");
      return;
    }
    if (!isStrongPassword(pwForm.next)) {
      setPwError('Choose a stronger password (see checklist below).');
      return;
    }
    setPwSaving(true);
    try {
      await changePasswordApi(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setShowPwForm(false);
      flashToast('Password updated.');
    } catch (err) {
      setPwError(err?.response?.data?.detail || 'Could not update password.');
    }
    setPwSaving(false);
  };

  const startTotpSetup = async () => {
    setTotpError('');
    setTotpBusy(true);
    try {
      const res = await setupTotp();
      setTotpSetup(res.data);
      setTotpCode('');
    } catch (err) {
      setTotpError(err?.response?.data?.detail || 'Could not start two-factor setup.');
    }
    setTotpBusy(false);
  };

  const confirmTotp = async (e) => {
    e.preventDefault();
    setTotpError('');
    setTotpBusy(true);
    try {
      await confirmTotpApi(totpCode);
      setTotpEnabled(true);
      setTotpSetup(null);
      setTotpCode('');
      if (refreshProfile) await refreshProfile();
      flashToast('Two-factor authentication is on.');
    } catch (err) {
      setTotpError(err?.response?.data?.detail || 'Invalid code. Try again.');
    }
    setTotpBusy(false);
  };

  const disableTotp = async (e) => {
    e.preventDefault();
    setTotpError('');
    setTotpBusy(true);
    try {
      await disableTotpApi(disablePw, disableCode);
      setTotpEnabled(false);
      setShowDisable(false);
      setDisablePw('');
      setDisableCode('');
      if (refreshProfile) await refreshProfile();
      flashToast('Two-factor authentication turned off.');
    } catch (err) {
      setTotpError(err?.response?.data?.detail || 'Could not disable two-factor.');
    }
    setTotpBusy(false);
  };

  if (!user) return null;

  return (
    <div className={`profile-shell${isLandlord ? ' profile-shell-landlord' : ''}`}>
      <nav className="profile-tab-bar" aria-label="Profile sections">
        {profileTabs.map(({ id, label, icon, count }) => (
          <button
            key={id}
            type="button"
            className={`profile-tab-btn${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
          >
            {icon && <Icon name={icon} />}
            {label}
            {count > 0 && <span className="profile-tab-count">{count}</span>}
          </button>
        ))}
      </nav>

      {tab === "overview" && !editing && publicProfile && (
        <ProfileInfoCard
          profile={{
            ...publicProfile,
            email: user.email,
            phone: user.phone,
            contact_preference: user.contact_preference,
          }}
          isSelf
          onEdit={() => setEditing(true)}
        />
      )}

      {tab === "overview" && editing && (
        <div className="profile-card profile-edit-card">
          <div className="profile-info-head">
            <div>
              <h2 className="profile-info-title">Edit profile</h2>
              <p className="profile-info-subtitle">Update your personal information and account details</p>
            </div>
          </div>
          <div className="ntp-form" style={{ border: "none", padding: 0, gap: "1rem" }}>
              <div className="profile-photo-edit">
                <div className="profile-avatar-lg profile-avatar-edit">
                  {photoPreview || profilePhotoUrl(user.profilePicture) ? (
                    <img src={photoPreview || profilePhotoUrl(user.profilePicture)} alt="" />
                  ) : (
                    <Icon name="circle-user" />
                  )}
                </div>
                <label className="cta-btn ghost small profile-photo-btn">
                  Change photo
                  <input type="file" accept="image/*" hidden onChange={onPhotoPick} />
                </label>
              </div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="How should we address you?"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={draft.email} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Location</label>
                <input className="form-input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="City or neighborhood" />
              </div>
              <div className="form-field">
                <label className="form-label">Short bio</label>
                <textarea className="form-input" rows="3" value={draft.about} onChange={(e) => setDraft({ ...draft, about: e.target.value })} placeholder="A line or two so hosts get a feel for you." />
              </div>
              {isLandlord && (
                <>
                  <div className="form-field">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      placeholder="+14155551234"
                    />
                    <p className="form-hint">Required if you prefer text. Hidden from your public profile.</p>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Preferred contact</label>
                    <div className="contact-pref-row">
                      {CONTACT_PREFERENCE_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`contact-pref-option${draft.contact_preference === opt.value ? ' active' : ''}`}>
                          <input
                            type="radio"
                            name="contact_preference"
                            value={opt.value}
                            checked={draft.contact_preference === opt.value}
                            onChange={() => setDraft({ ...draft, contact_preference: opt.value })}
                          />
                          <span className="contact-pref-label">{opt.label}</span>
                          <span className="contact-pref-hint">{opt.hint}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="form-actions">
                <button className="cta-btn" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                <button className="cta-btn ghost" onClick={() => { setEditing(false); setPhotoFile(null); setPhotoPreview(null); }}>Cancel</button>
              </div>
          </div>
        </div>
      )}

      {tab === "overview" && !editing && !publicProfile && (
        <div className="profile-card"><p style={{ color: 'var(--ntp-fg-muted)', margin: 0 }}>Loading profile…</p></div>
      )}

      {tab === "activity" && (
        <ActivityPanel
          activity={activityData.activity}
          applications={activityData.applications}
          isLandlord={isLandlord}
          userId={user.id}
          onAction={handleActivityAction}
          busyId={activityBusy}
        />
      )}

      {tab === "preferences" && (
        <PreferencesDisplayCard
          preferences={preferences}
          userType="renter"
          onEdit={() => navigate('/preferences')}
        />
      )}

      {tab === "listings" && (
        <div className="profile-card">
          <div className="profile-card-head">
            <h2>My listings</h2>
            <button className="cta-btn ghost small" onClick={() => navigate('/listing/new')}><Icon name="plus" /> Add</button>
          </div>
          {myListings.length === 0 ? (
            <EmptyState
              compact
              icon="plus"
              {...NO_LISTINGS}
              primaryAction={{ label: 'Add listing', onClick: () => navigate('/listing/new'), icon: 'plus' }}
            />
          ) : (
            <div className="profile-listing-list">
              {myListings.map((l) => {
                const tenantCount = (l.tenant_preferences?.length || 0) + (l.tenant_custom_requirements?.length || 0);
                return (
                  <div key={l.id} className="profile-listing-row-wrap">
                    <button type="button" className="profile-listing-row" onClick={() => navigate(`/listing/${l.id}`)}>
                      <div className="pl-thumb" style={{ backgroundImage: `url(${l.image})` }} />
                      <div className="pl-body">
                        <strong>{l.title}</strong>
                        <span>{l.location}</span>
                        {tenantCount > 0 && (
                          <span className="pl-meta">{tenantCount} tenant requirement{tenantCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <span className="pl-price">${l.rent_price?.toLocaleString()}<small>/mo</small></span>
                    </button>
                    <button
                      type="button"
                      className="profile-listing-tenant-edit"
                      onClick={() => navigate(`/listing/edit/${l.id}#tenant-requirements`)}
                    >
                      Tenant requirements
                    </button>
                  </div>
                );
              })}
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
            <EmptyState
              compact
              icon="heart"
              title="Nothing saved yet"
              description="Heart a listing while you browse and it will show up here."
              primaryAction={{ label: 'Browse homes', onClick: () => navigate('/listings'), icon: 'arrow-right' }}
            />
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
        <div className="profile-card security-card-v2">
          <div className="security-card-head">
            <h2>Security</h2>
            <p>Protect your account with a strong password and two-factor authentication.</p>
          </div>

          <div className="security-status-strip">
            <div className="security-status-chip">
              <span className="k">Sign-in method</span>
              <span className="v">{isGoogle ? 'Google' : 'Email & password'}</span>
            </div>
            <div className="security-status-chip">
              <span className="k">Two-factor auth</span>
              <span className={`v security-badge${totpEnabled ? ' on' : ''}`}>
                {totpEnabled ? 'Enabled' : 'Off'}
              </span>
            </div>
          </div>

          {!isGoogle && (
            <div className="security-section">
              <div className="security-section-head">
                <h3>Password</h3>
                <button
                  type="button"
                  className="profile-card-edit-btn"
                  onClick={() => {
                    setShowPwForm((v) => !v);
                    setPwError('');
                  }}
                >
                  {showPwForm ? 'Cancel' : 'Change password'}
                </button>
              </div>
              {showPwForm && (
                <form className="security-inline-form" onSubmit={changePassword}>
                  <div className="form-field">
                    <label className="form-label" htmlFor="current-pw">Current password</label>
                    <input
                      id="current-pw"
                      className="form-input"
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="new-pw">New password</label>
                    <input
                      id="new-pw"
                      className="form-input"
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.next}
                      onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                      autoComplete="new-password"
                    />
                    <PasswordStrength password={pwForm.next} />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="confirm-pw">Confirm new password</label>
                    <input
                      id="confirm-pw"
                      className="form-input"
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <label className="profile-show-pw">
                    <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                    Show passwords
                  </label>
                  {pwError && <p className="field-error">{pwError}</p>}
                  <div className="profile-security-actions">
                    <button type="submit" className="cta-btn small" disabled={pwSaving}>
                      {pwSaving ? 'Updating…' : 'Update password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {isGoogle && (
            <p className="security-google-note">
              You sign in with Google. Password changes are managed in your Google account.
            </p>
          )}

          <div className="security-section">
            <h3>Two-factor authentication</h3>
            <p className="security-desc-compact">
              Add an extra step at sign-in with a code from Google Authenticator, 1Password, or Authy.
            </p>

            {totpEnabled && !totpSetup && !showDisable && (
              <div className="totp-enabled-row">
                <span className="security-badge on">Protected</span>
                <button type="button" className="profile-card-edit-btn" onClick={() => setShowDisable(true)}>
                  Turn off
                </button>
              </div>
            )}

            {!totpEnabled && !totpSetup && (
              <div className="security-action-row">
                <button
                  type="button"
                  className="cta-btn small"
                  onClick={startTotpSetup}
                  disabled={totpBusy || (isGoogle && !hasPassword)}
                >
                  {totpBusy ? 'Starting…' : 'Set up authenticator app'}
                </button>
                {isGoogle && !hasPassword && (
                  <p className="security-desc-compact">Google-only accounts need a password before 2FA can be enabled.</p>
                )}
              </div>
            )}

            {totpSetup && (
              <form onSubmit={confirmTotp} className="totp-setup security-inline-form">
                <p className="security-desc-compact">Scan this QR code, then enter the 6-digit code to confirm.</p>
                <img src={totpSetup.qr_code} alt="Authenticator QR code" className="totp-qr" />
                <p className="totp-secret">
                  Manual key: <code>{totpSetup.secret}</code>
                </p>
                <div className="form-field">
                  <label className="form-label">Verification code</label>
                  <input
                    className="form-input totp-code-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                  />
                </div>
                <div className="profile-security-actions">
                  <button type="submit" className="cta-btn small" disabled={totpBusy || totpCode.length < 6}>
                    {totpBusy ? 'Verifying…' : 'Enable two-factor'}
                  </button>
                  <button type="button" className="cta-btn ghost small" onClick={() => setTotpSetup(null)}>Cancel</button>
                </div>
              </form>
            )}

            {showDisable && (
              <form onSubmit={disableTotp} className="totp-disable security-inline-form">
                <p className="security-desc-compact">Enter your password and a current authenticator code to turn off 2FA.</p>
                <div className="form-field">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={disablePw}
                    onChange={(e) => setDisablePw(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Authenticator code</label>
                  <input
                    className="form-input totp-code-input"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="profile-security-actions">
                  <button type="submit" className="cta-btn small" disabled={totpBusy}>Turn off 2FA</button>
                  <button type="button" className="cta-btn ghost small" onClick={() => setShowDisable(false)}>Cancel</button>
                </div>
              </form>
            )}

            {totpError && <p className="field-error">{totpError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

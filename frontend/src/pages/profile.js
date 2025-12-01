import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../context/authContext";
import ProfileEditForm from "../components/profile/edit";
import ProfileDetailsCard from "../components/profile/details";
import PreferencesDisplayCard from "../components/preferences/display";
import PreferencesForm from "../components/preferences/form";
import SavedListingsPage from "../components/listings/saved";
import ChangePasswordForm from "../components/profile/changepassword";
import CreateListingForm from "../components/listings/create";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);

  // Tabs for both roles
  const tabs = [
    { key: "profile", label: "Profile" },
    { key: "preferences", label: "Preferences" },
    user?.role === "landlord"
      ? { key: "mylistings", label: "My Listings" }
      : { key: "saved", label: "Saved" },
  ];

  // Default tab: profile
  const [tab, setTab] = useState("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [prefMessage, setPrefMessage] = useState("");
  const [showListingForm, setShowListingForm] = useState(false);
  const [editInitialFields, setEditInitialFields] = useState(null);

  // Fetch preferences for both users
  useEffect(() => {
    if (tab === "preferences" && user?.accessToken) {
      setLoadingPrefs(true);
      const url =
        user.role === "renter"
          ? "/api/preferences/renter"
          : "/api/preferences/landlord";
      axios
        .get(url, { headers: { Authorization: `Bearer ${user.accessToken}` } })
        .then((res) => setPreferences(res.data))
        .catch(() => setPreferences(null))
        .finally(() => setLoadingPrefs(false));
    }
  }, [tab, user, editingPreferences]);

  // Save profile
  const handleProfileSave = (updatedUser) => {
    setUser(updatedUser);
    setEditingProfile(false);
    setProfileMessage("Profile updated!");
    setTimeout(() => setProfileMessage(""), 2500);
  };

  // Save preferences
  const handlePreferencesComplete = () => {
    setEditingPreferences(false);
    setPrefMessage("Preferences updated!");
    setTimeout(() => setPrefMessage(""), 2000);
    // Refetch
    const url =
      user.role === "renter"
        ? "/api/preferences/renter"
        : "/api/preferences/landlord";
    axios
      .get(url, { headers: { Authorization: `Bearer ${user.accessToken}` } })
      .then((res) => setPreferences(res.data))
      .catch(() => setPreferences(null));
  };

  // Open modal for new listing
  const handleAddNew = () => {
    setEditInitialFields(null);
    setShowListingForm(true);
  };

  // Open modal for editing listing
  const handleEditListing = (fields) => {
    setEditInitialFields(fields);
    setShowListingForm(true);
  };

  if (!user) {
    // Auth check
    return (
      <div className="profile-page-main profile-unauth">
        <h1 className="profile-main-title">Profile</h1>
        <div className="profile-main-desc">
          Please <a href="/login" className="profile-login-link">log in</a> to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <header className="profile-hero card-surface">
        <div>
          <p className="eyebrow soft">Account</p>
          <h1>Manage your profile & renting preferences</h1>
          <p>
            Keep your details fresh so matches feel personal. Update your bio,
            location, and preferences anytime.
          </p>
        </div>
      </header>

      <div className="profile-tab-row">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`profile-tab-btn${tab === t.key ? " active" : ""}`}
            onClick={() => {
              setTab(t.key);
              setEditingProfile(false);
              setChangingPassword(false);
              setEditingPreferences(false);
              setShowListingForm(false);
            }}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="profile-content">
        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="profile-grid">
            <div className="profile-column">
              {editingProfile ? (
                <ProfileEditForm
                  user={user}
                  onSave={handleProfileSave}
                  onCancel={() => setEditingProfile(false)}
                />
              ) : (
                <ProfileDetailsCard
                  user={user}
                  onEdit={() => setEditingProfile(true)}
                />
              )}
              {profileMessage && (
                <div className="form-success">{profileMessage}</div>
              )}
            </div>
            {changingPassword && (
              <ChangePasswordForm
                user={user}
                onDone={() => setChangingPassword(false)}
              />
            )}
          </div>
        )}

      {/* PREFERENCES TAB */}
      {tab === "preferences" && (
        <div>
          {loadingPrefs ? (
            <div className="profile-card-loading">Loading preferences…</div>
          ) : (
            <>
              {!editingPreferences ? (
                preferences ? (
                  <PreferencesDisplayCard
                    preferences={preferences}
                    userType={user.role}
                    onEdit={() => setEditingPreferences(true)}
                  />
                ) : (
                  <div className="preferences-info-card preferences-info-card-empty">
                    <div>
                      <b>No preferences set yet.</b>
                    </div>
                    <div className="preferences-info-card-desc">
                      Click “Edit” to set your rental or property preferences and get personalized matches!
                    </div>
                    <button
                      className="profile-btn profile-btn-outline"
                      onClick={() => setEditingPreferences(true)}
                    >
                      Set Preferences
                    </button>
                  </div>
                )
              ) : (
                <PreferencesForm
                  userType={user.role}
                  onComplete={handlePreferencesComplete}
                />
              )}
              {prefMessage && (
                <div className="form-success">{prefMessage}</div>
              )}
            </>
          )}
        </div>
      )}

      {/* MY LISTINGS TAB (Landlord) */}
      {tab === "mylistings" && user?.role === "landlord" && (
        <div className="saved-mylistings-main">
          <div className="my-listings-header-row">
            <div>
              <div className="my-listings-title">My Listings</div>
              <div className="my-listings-desc">Properties you own and manage</div>
            </div>
            <button
              className="profile-btn profile-btn-outline my-listings-add-btn"
              onClick={handleAddNew}
            >
              <span className="my-listings-add-plus">+</span> Add New Listing
            </button>
          </div>
          {/* Listing modal for new OR edit */}
          {showListingForm && (
            <CreateListingForm
              edit={!!editInitialFields}
              initialFields={editInitialFields || {}}
              onClose={() => setShowListingForm(false)}
              onSubmitDone={() => setShowListingForm(false)}
            />
          )}
          {/* Pass the edit handler to child listings */}
          <SavedListingsPage mode="owned" onEditListing={handleEditListing} />
        </div>
      )}

      {/* SAVED TAB (Renter) */}
      {tab === "saved" && user?.role === "renter" && (
        <div className="saved-mylistings-main">
            <div>
              <div className="my-listings-title">Saved Listings</div>
              <div className="my-listings-desc">Properties you've saved for later review</div>
            </div>
          <SavedListingsPage mode="saved" />
        </div>
      )}
    </section>
  </div>
  );
}

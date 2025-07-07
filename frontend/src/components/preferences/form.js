// src/components/preferences/form.js
import React, { useState, useContext, useEffect } from "react";
import AuthContext from "../../context/authContext";
import axios from "axios";

const locationOptions = [
  "Downtown", "Midtown", "Uptown", "Suburbs", "East Side", "West Side"
];
const dateOptions = [
  "ASAP", "Next month", "2-3 months", "Flexible"
];
const amenitiesOptions = [
  "Pet Friendly", "Furnished", "Utilities included", "High-speed internet", "Parking",
  "Garden", "Pool", "Gym", "Security system", "Smart home features",
  "Washer/dryer in unit", "Dishwasher", "Central air conditioning", "Hardwood floors",
  "Modern appliances", "Storage space", "Balcony", "Good natural light",
  "Soundproof walls", "Open floor plan", "Walk-in closets", "Updated kitchen",
  "Updated bathroom", "Energy efficient", "Elevator", "Package receiving",
  "Maintenance included", "Close to public transit", "Close to shopping",
  "Close to parks", "Quiet neighborhood", "Safe neighborhood", "Family-friendly",
  "Professional community", "Student-friendly"
];
const tenantRequirements = [
  "No smoking", "No pets", "No subletting", "Credit check required", "Background check required",
  "References required", "Rental history required", "Employment verification",
  "Proof of insurance required", "Security deposit required", "First and last month rent",
  "Long-term lease preferred", "Professional/employed", "Student with guarantor",
  "No criminal history", "Clean rental history", "Good credit score", "Co-signer accepted",
  "Maximum occupants limit"
];

export default function PreferencesForm({ userType, onComplete }) {
  const [step, setStep] = useState(1);
  const { user } = useContext(AuthContext);

  const [renterPrefs, setRenterPrefs] = useState({
    budget_min: 1200,
    budget_max: 3500,
    bedrooms: 2,
    bathrooms: 1,
    locations: [],
    move_in_date: "Next month",
    lease_length: 12,
    amenities: [],
    pets_allowed: false,
  });

  const [landlordPrefs, setLandlordPrefs] = useState({
    tenant_preferences: [],
    lease_length: 12,
    pets_allowed: true,
  });

  // For input chips
  const [newAmenity, setNewAmenity] = useState("");
  const [newTenantPref, setNewTenantPref] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill on mount/user change
  useEffect(() => {
    async function fetchPrefs() {
      if (!user?.accessToken) return;
      try {
        const endpoint =
          userType === "renter"
            ? "/api/preferences/renter"
            : "/api/preferences/landlord";
        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        if (userType === "renter" && data) setRenterPrefs(prev => ({ ...prev, ...data }));
        if (userType === "landlord" && data) setLandlordPrefs(prev => ({ ...prev, ...data }));
      } catch (err) {}
    }
    fetchPrefs();
  }, [userType, user?.accessToken]);

  // Handlers for renter
  const handleLocationToggle = (loc) => {
    setRenterPrefs((prev) => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter((l) => l !== loc)
        : [...prev.locations, loc]
    }));
  };
  const handleAmenityToggle = (amenity) => {
    setRenterPrefs((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };
  const addAmenity = () => {
    if (newAmenity && !renterPrefs.amenities.includes(newAmenity)) {
      setRenterPrefs((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity]
      }));
      setNewAmenity("");
    }
  };
  const removeAmenity = (amenity) => {
    setRenterPrefs((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity)
    }));
  };

  // Handlers for landlord tenant preferences
  const addTenantPreference = () => {
    if (
      newTenantPref &&
      !landlordPrefs.tenant_preferences.includes(newTenantPref)
    ) {
      setLandlordPrefs((prev) => ({
        ...prev,
        tenant_preferences: [...prev.tenant_preferences, newTenantPref]
      }));
      setNewTenantPref("");
    }
  };
  const removeTenantPreference = (pref) => {
    setLandlordPrefs((prev) => ({
      ...prev,
      tenant_preferences: prev.tenant_preferences.filter((p) => p !== pref)
    }));
  };

  // Save step
  const saveCurrentStep = async () => {
    setError("");
    setLoading(true);
    if (!user?.accessToken) {
      setError("Not logged in. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      let endpoint, prefs;
      if (userType === "renter") {
        endpoint = "/api/preferences/renter";
        prefs = renterPrefs;
      } else {
        endpoint = "/api/preferences/landlord";
        prefs = landlordPrefs;
      }
      await axios.post(endpoint, prefs, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
    } catch (e) {
      setError("Error saving preferences.");
    }
    setLoading(false);
  };

  const handleNext = async () => {
    await saveCurrentStep();
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const handleComplete = async () => {
    await saveCurrentStep();
    if (onComplete) onComplete();
  };

  function renderRenterStep() {
    switch (step) {
      case 1:
        return (
          <>
            <div className="form-section">
              <h2 className="form-title">Let's personalize your search!</h2>
              <p className="form-desc">Choose your price range and move-in date. We'll keep your info private.</p>
              <h3 className="preferences-title">Budget Range</h3>
              <div style={{ margin: "1.2em 0 1.3em 0" }}>
                <input
                  type="range"
                  min={800}
                  max={6000}
                  value={renterPrefs.budget_min}
                  step={100}
                  onChange={e =>
                    setRenterPrefs(prev => ({
                      ...prev,
                      budget_min: Math.min(Number(e.target.value), prev.budget_max - 200),
                    }))
                  }
                  style={{ width: "45%" }}
                />
                <input
                  type="range"
                  min={800}
                  max={6000}
                  value={renterPrefs.budget_max}
                  step={100}
                  onChange={e =>
                    setRenterPrefs(prev => ({
                      ...prev,
                      budget_max: Math.max(Number(e.target.value), prev.budget_min + 200),
                    }))
                  }
                  style={{ width: "45%", marginLeft: "5%" }}
                />
                <div style={{ marginTop: 8 }}>
                  <span className="filter-slider-value">${renterPrefs.budget_min}</span> – <span className="filter-slider-value">${renterPrefs.budget_max}</span>
                </div>
              </div>
              <label className="preferences-label">When do you want to move in?</label>
              <select
                className="preferences-select"
                value={renterPrefs.move_in_date}
                onChange={(e) =>
                  setRenterPrefs({ ...renterPrefs, move_in_date: e.target.value })
                }
              >
                {dateOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        );
      case 2:
        return (
          <div className="form-section">
            <h2 className="form-title">Property details</h2>
            <p className="form-desc">Where do you want to live? Bedrooms, bathrooms—your call!</p>
            <label className="preferences-label">Preferred Locations</label>
            <div className="preference-badges">
              {locationOptions.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={
                    renterPrefs.locations.includes(loc)
                      ? "preference-badge selected"
                      : "preference-badge"
                  }
                >
                  {loc}
                </button>
              ))}
            </div>
            <label className="preferences-label">Bedrooms</label>
            <input
              className="preferences-input"
              type="number"
              min="1"
              max="5"
              value={renterPrefs.bedrooms}
              onChange={(e) =>
                setRenterPrefs({ ...renterPrefs, bedrooms: parseInt(e.target.value) })
              }
            />
            <label className="preferences-label">Bathrooms</label>
            <input
              className="preferences-input"
              type="number"
              step="1"
              min="1"
              max="3"
              value={renterPrefs.bathrooms}
              onChange={(e) =>
                setRenterPrefs({
                  ...renterPrefs,
                  bathrooms: parseFloat(e.target.value)
                })
              }
            />
          </div>
        );
      case 3:
        return (
          <div className="form-section">
            <h2 className="form-title">Amenities & more</h2>
            <p className="form-desc">What little extras make you feel at home? Add anything you like!</p>
            <h3 className="preferences-title">Property Amenities</h3>
            <div className="preference-chips">
              {renterPrefs.amenities.map((amenity) => (
                <span className="preference-chip selected" key={amenity}>
                  {amenity}
                  <button
                    className="remove-btn"
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              className="preferences-input"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="Add custom amenity"
            />
            <button
              type="button"
              className="preferences-btn-outline"
              onClick={addAmenity}
            >
              Add
            </button>
            <div className="preferences-divider" />
            <div className="preference-badges">
              {amenitiesOptions.map(
                (amenity) =>
                  !renterPrefs.amenities.includes(amenity) && (
                    <button
                      key={amenity}
                      type="button"
                      className="preference-badge"
                      onClick={() => handleAmenityToggle(amenity)}
                    >
                      + {amenity}
                    </button>
                  )
              )}
            </div>
            <label className="preferences-label">Pets Allowed?</label>
            <select
              className="preferences-select"
              value={renterPrefs.pets_allowed ? "Yes" : "No"}
              onChange={e => setRenterPrefs({ ...renterPrefs, pets_allowed: e.target.value === "Yes" })}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <label className="preferences-label">Preferred Lease Length (months)</label>
            <input
              className="preferences-input"
              type="number"
              value={renterPrefs.lease_length}
              onChange={e => setRenterPrefs({ ...renterPrefs, lease_length: parseInt(e.target.value) })}
            />
          </div>
        );
      default:
        return null;
    }
  }

  // -------- Landlord Form -----------
  function renderLandlordPrefs() {
    return (
      <div className="form-section">
        <h2 className="form-title">Tenant Requirements</h2>
        <p className="form-desc">What do you expect from your ideal tenant? Select or add any preferences.</p>
        <div className="preference-chips">
          {landlordPrefs.tenant_preferences.map((pref) => (
            <span className="preference-chip selected" key={pref}>
              {pref}
              <button
                className="remove-btn"
                type="button"
                onClick={() => removeTenantPreference(pref)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          className="preferences-input"
          value={newTenantPref}
          onChange={(e) => setNewTenantPref(e.target.value)}
          placeholder="Add custom requirement"
        />
        <button
          type="button"
          className="preferences-btn-outline"
          onClick={addTenantPreference}
        >
          Add
        </button>
        <div className="preferences-divider" />
        <div className="preference-badges">
          {tenantRequirements.map(
            (req) =>
              !landlordPrefs.tenant_preferences.includes(req) && (
                <button
                  key={req}
                  type="button"
                  className="preference-badge"
                  onClick={() =>
                    setLandlordPrefs((prev) => ({
                      ...prev,
                      tenant_preferences: [...prev.tenant_preferences, req]
                    }))
                  }
                >
                  + {req}
                </button>
              )
          )}
        </div>
        <label className="preferences-label">Default Lease Length (months)</label>
        <input
          className="preferences-input"
          type="number"
          value={landlordPrefs.lease_length}
          onChange={e => setLandlordPrefs({ ...landlordPrefs, lease_length: parseInt(e.target.value) })}
        />
        <label className="preferences-label">Pets Allowed?</label>
        <select
          className="preferences-select"
          value={landlordPrefs.pets_allowed ? "Yes" : "No"}
          onChange={e => setLandlordPrefs({ ...landlordPrefs, pets_allowed: e.target.value === "Yes" })}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
    );
  }

  // --------- Render ---------
  return (
    <div className="preferences-card">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (userType === "landlord") {
            await handleComplete();
          } else {
            if (step === 3) {
              await handleComplete();
            } else {
              await handleNext();
            }
          }
        }}
      >
        <div className="step-indicator">
          {userType === "renter" ? `Step ${step} of 3` : null}
        </div>
        {error && <div className="form-error">{error}</div>}
        {userType === "renter"
          ? renderRenterStep()
          : renderLandlordPrefs()}
        <div className="form-actions">
          {userType === "renter" && step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="preferences-btn-outline"
              disabled={loading}
            >
              Back
            </button>
          )}
          <button type="submit" className="preferences-btn" disabled={loading}>
            {loading
              ? "Saving..."
              : userType === "renter"
                ? step === 3
                  ? "Save Preferences"
                  : "Next"
                : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}

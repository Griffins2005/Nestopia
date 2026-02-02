import React from "react";

function ListChips({ items }) {
  if (!items || !items.length) return <i>None</i>;
  return (
    <div className="chips-list">
      {items.map(i => (
        <span className="chip chip-green" key={i}>{i}</span>
      ))}
    </div>
  );
}

export default function PreferencesDisplayCard({ preferences, userType, onEdit }) {
  if (!preferences)
    return <div className="preferences-info-card">No preferences saved yet.</div>;

  if (userType === "renter") {
    return (
      <div className="preferences-info-card">
        <div className="preferences-info-card-header">
          <div className="preferences-title">Housing Preferences</div>
          <button className="profile-card-edit-btn" onClick={onEdit}>Edit</button>
        </div>
        <div className="preferences-details-row">
          <div className="preferences-details-col">
            <div className="pref-list">
              <span className="pref-label">Budget Range</span>
              <span className="pref-budget">${preferences.budget_min} - ${preferences.budget_max}<span className="pref-budget-suffix">/month</span></span>
            </div>
            <div className="pref-list">
              <span className="pref-label">Preferred Location</span>
              <span>{preferences.locations?.join(", ")}</span>
            </div>
            <div>
              <span className="pref-label">Desired Amenities</span>
              <ListChips items={preferences.amenities} />
            </div>
          </div>
          <div className="preferences-details-col">
            <div>
              <span className="pref-label">Bedrooms & Bathrooms</span>
              <span>{preferences.bedrooms} bedrooms, {preferences.bathrooms}+ bathrooms</span>
            </div>
            <div>
              <span className="pref-label">Property Types</span>
              <div className="chips-list">
                {(preferences.property_type || []).map(type => (
                  <span className="chip chip-dark" key={type}>{type}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // landlord
    return (
      <div className="preferences-info-card">
        <div className="preferences-info-card-header">
          <div className="preferences-title">Tenant Preferences</div>
          <button className="profile-card-edit-btn" onClick={onEdit}>Edit</button>
        </div>
        <div className="preferences-details-row">
          <div className="preferences-details-col">
            <div>
              <span className="pref-label">Tenant Requirements</span>
              <ListChips items={preferences.tenant_preferences} />
            </div>
            <div>
              <span className="pref-label">Lease Length</span>
              <span>{preferences.lease_length} months</span>
            </div>
          </div>
          <div className="preferences-details-col">
            <div>
              <span className="pref-label">Pets Allowed</span>
              <span>{preferences.pets_allowed ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

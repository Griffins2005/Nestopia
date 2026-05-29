// src/components/preferences/display.js
import React from "react";
import { Icon } from "../Icons";
import { formatLocationLabel, locationKey } from "../../api/geo";
import { formatMoveInDisplay } from "../../api/preferences";

function ListChips({ items, variant = "green" }) {
  if (!items?.length) return null;
  return (
    <div className="chips-list">
      {items.map((i) => (
        <span className={`chip chip-${variant}`} key={i}>{i}</span>
      ))}
    </div>
  );
}

function formatBudget(min, max) {
  if (min == null && max == null) return null;
  const lo = min != null ? `$${Number(min).toLocaleString()}` : "Any";
  const hi = max != null ? `$${Number(max).toLocaleString()}` : "Any";
  return `${lo} – ${hi}`;
}

function formatBedBath(bedrooms, bathrooms) {
  const parts = [];
  if (bedrooms != null) {
    parts.push(bedrooms === 0 ? "Studio" : `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}`);
  }
  if (bathrooms != null) {
    parts.push(`${bathrooms}+ bathroom${bathrooms !== 1 ? "s" : ""}`);
  }
  return parts.join(", ") || null;
}

export function formatLeaseLengthDisplay(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isNaN(n) && n > 0) {
    return n === 1 ? "1 month lease" : `${n} month lease`;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (/lease/i.test(text)) return text;
  const match = text.match(/\d+/);
  if (match) {
    const months = Number(match[0]);
    return months === 1 ? "1 month lease" : `${months} month lease`;
  }
  return text;
}

function formatMoveInAndLease(prefs) {
  const parts = [];
  const moveIn = prefs.move_in || prefs.move_in_date;
  if (moveIn) {
    const label = formatMoveInDisplay(moveIn) || moveIn;
    if (label) parts.push(label);
  }
  const lease = formatLeaseLengthDisplay(prefs.lease_length);
  if (lease) parts.push(lease);
  return parts.join(" · ") || null;
}

function isMeaningfulChoice(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized !== "no preference" && normalized !== "";
}

function LocationChips({ locations }) {
  if (!locations?.length) return null;
  return (
    <div className="pref-location-chips">
      {locations.map((loc) => (
        <span key={locationKey(loc)} className="location-chip readonly">
          {formatLocationLabel(loc)}
        </span>
      ))}
    </div>
  );
}

function parseHouseRules(houseRules) {
  if (Array.isArray(houseRules)) return houseRules.filter(Boolean);
  if (!houseRules) return [];
  return String(houseRules).split(/[,;]\s*/).filter(Boolean);
}

export function getListingTenantRequirements(listing) {
  const tenantPrefs = listing?.tenant_preferences || [];
  const customReqs = listing?.tenant_custom_requirements || [];
  const houseRules = parseHouseRules(listing?.house_rules);
  const lease = formatLeaseLengthDisplay(listing?.lease_length);
  const pets = listing?.pets;
  const hasContent = Boolean(
    tenantPrefs.length || customReqs.length || houseRules.length || lease || pets
  );
  return { tenantPrefs, customReqs, houseRules, lease, pets, hasContent };
}

export function ListingTenantRequirementsCard({ listing, onEdit, compact = false, isOwner = false }) {
  const { tenantPrefs, customReqs, houseRules, lease, pets, hasContent } = getListingTenantRequirements(listing);

  if (!hasContent && !onEdit) return null;

  return (
    <div className={`preferences-info-card${compact ? " preferences-info-card-compact" : ""}`}>
      <div className="preferences-info-card-header">
        <div>
          <div className="preferences-title">Tenant requirements</div>
          <p className="preferences-info-card-desc">
            {isOwner
              ? "What you expect from tenants for this property."
              : "What the host expects from tenants."}
          </p>
        </div>
        {onEdit && (
          <button type="button" className="profile-card-edit-btn" onClick={onEdit}>
            <Icon name="pen" /> Edit
          </button>
        )}
      </div>
      {!hasContent ? (
        <p className="preferences-info-card-desc">No tenant requirements set yet.</p>
      ) : (
        <div className="preferences-summary-grid">
          {tenantPrefs.length > 0 && (
            <div className="pref-field pref-field-full">
              <span className="pref-label">Requirements</span>
              <ListChips items={tenantPrefs} variant="dark" />
            </div>
          )}
          {pets && (
            <div className="pref-field">
              <span className="pref-label">Pet policy</span>
              <span className="pref-value">{pets}</span>
            </div>
          )}
          {lease && (
            <div className="pref-field">
              <span className="pref-label">Lease length</span>
              <span className="pref-value">{lease}</span>
            </div>
          )}
          {customReqs.length > 0 && (
            <div className="pref-field pref-field-full">
              <span className="pref-label">Custom rules</span>
              <ListChips items={customReqs} variant="green" />
            </div>
          )}
          {houseRules.length > 0 && (
            <div className="pref-field pref-field-full">
              <span className="pref-label">House rules</span>
              <ListChips items={houseRules} variant="green" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PreferencesDisplayCard({ preferences, userType = 'renter', onEdit }) {
  if (userType !== 'renter') return null;

  if (!preferences) {
    return (
      <div className="preferences-info-card preferences-info-card-empty">
        <div>
          <div className="preferences-title">Housing preferences</div>
          <p className="preferences-info-card-desc">
            Set your budget, neighborhoods, and must-haves so we can match you with homes that fit.
          </p>
        </div>
        <button type="button" className="profile-card-edit-btn" onClick={onEdit}>
          <Icon name="pen" /> Set up preferences
        </button>
      </div>
    );
  }

  if (userType === "renter") {
    const budget = formatBudget(preferences.budget_min, preferences.budget_max ?? preferences.max_rent);
    const bedBath = formatBedBath(preferences.bedrooms, preferences.bathrooms);
    const locations = preferences.locations || [];
    const buildingAmenities = preferences.building_amenities || [];
    const amenities = preferences.amenities || [];
    const customPrefs = preferences.custom_preferences || [];
    const moveInLease = formatMoveInAndLease(preferences);
    const household = preferences.household_size ?? preferences.household;
    const lifestyle = [
      isMeaningfulChoice(preferences.smoking_preference) && {
        label: "Smoking",
        value: preferences.smoking_preference,
      },
      isMeaningfulChoice(preferences.noise_tolerance) && {
        label: "Noise",
        value: preferences.noise_tolerance,
      },
      isMeaningfulChoice(preferences.visitor_flexibility) && {
        label: "Guests",
        value: preferences.visitor_flexibility,
      },
    ].filter(Boolean);

    return (
      <div className="preferences-info-card">
        <div className="preferences-info-card-header">
          <div>
            <div className="preferences-title">Housing preferences</div>
            <p className="preferences-info-card-desc">Your preferences for finding the perfect home.</p>
          </div>
          <button type="button" className="profile-card-edit-btn" onClick={onEdit}>
            <Icon name="pen" /> Edit
          </button>
        </div>

        <div className="preferences-summary-grid">
          {budget && (
            <div className="pref-field pref-field-budget">
              <span className="pref-label">Budget range</span>
              <span className="pref-budget">{budget}<span className="pref-budget-suffix">/month</span></span>
            </div>
          )}
          {bedBath && (
            <div className="pref-field">
              <span className="pref-label">Bedrooms &amp; bathrooms</span>
              <span className="pref-value">{bedBath}</span>
            </div>
          )}
          {locations.length > 0 && (
            <div className="pref-field pref-field-full pref-field-locations">
              <span className="pref-label">Preferred locations</span>
              <LocationChips locations={locations} />
            </div>
          )}
          {moveInLease && (
            <div className="pref-field">
              <span className="pref-label">Move-in &amp; lease</span>
              <span className="pref-value">{moveInLease}</span>
            </div>
          )}
          {household != null && (
            <div className="pref-field">
              <span className="pref-label">Household size</span>
              <span className="pref-value">
                {household} {household === 1 ? "person" : "people"}
              </span>
            </div>
          )}
          {preferences.pets_allowed != null && (
            <div className="pref-field">
              <span className="pref-label">Pets</span>
              <span className="pref-value">{preferences.pets_allowed ? "Pet friendly" : "No pets"}</span>
            </div>
          )}
          {buildingAmenities.length > 0 && (
            <div className="pref-field pref-field-full">
              <span className="pref-label">Building amenities</span>
              <ListChips items={buildingAmenities} variant="dark" />
            </div>
          )}
        </div>

        {lifestyle.length > 0 && (
          <div className="pref-amenities-block">
            <span className="pref-label">Lifestyle preferences</span>
            <div className="preferences-summary-grid pref-lifestyle-grid">
              {lifestyle.map(({ label, value }) => (
                <div className="pref-field" key={label}>
                  <span className="pref-label">{label}</span>
                  <span className="pref-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {amenities.length > 0 && (
          <div className="pref-amenities-block">
            <span className="pref-label">Desired amenities</span>
            <ListChips items={amenities} variant="green" />
          </div>
        )}

        {customPrefs.length > 0 && (
          <div className="pref-amenities-block">
            <span className="pref-label">Other preferences</span>
            <ListChips items={customPrefs} variant="green" />
          </div>
        )}
      </div>
    );
  }

  return null;
}

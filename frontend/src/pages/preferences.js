import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GeoLocationSearch from '../components/GeoLocationSearch';
import { MoveInFields, AmenitiesPicker } from '../components/preferences/form';
import { parseMoveInWindow, formatMoveInForApi, clampNumber } from '../api/preferences';
import { useNestopia } from '../context/NestopiaContext';

export default function Preferences() {
  const navigate = useNavigate();
  const { preferences, savePreferences, flashToast } = useNestopia();

  const init = preferences || {};
  const initMoveIn = parseMoveInWindow(init.move_in || init.move_in_date);
  const [form, setForm] = useState({
    budget_min: init.budget_min ?? 2000,
    budget_max: init.budget_max ?? 3500,
    bedrooms: init.bedrooms ?? 1,
    bathrooms: init.bathrooms ?? 1,
    household: init.household ?? 1,
    locations: (init.locations || []).map((l) =>
      typeof l === 'string' ? { label: l, lat: null, lng: null } : l
    ),
    move_in_from: initMoveIn.from,
    move_in_to: initMoveIn.to,
    lease_length: init.lease_length || "12 months",
    amenities: init.amenities ? [...init.amenities] : [],
    pets: init.pets || "No pets",
  });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (f) => {
    const e = {};
    if (Number(f.budget_min) <= 0) e.budget_min = "Set a minimum budget.";
    if (Number(f.budget_max) <= Number(f.budget_min)) e.budget_max = "Max must be above your minimum.";
    if (!f.locations.length) e.locations = "Pick at least one neighborhood.";
    if (!f.move_in_from) e.move_in = "Pick a move-in start date.";
    else if (f.move_in_to && f.move_in_to < f.move_in_from) e.move_in = "End date must be after start.";
    return e;
  };

  const errors = touched ? validate(form) : {};

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await savePreferences({
        ...form,
        move_in: formatMoveInForApi(form.move_in_from, form.move_in_to),
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        household: Number(form.household),
      });
      flashToast("Preferences saved! Here are your matches.");
      navigate('/matches');
    } catch (err) {
      flashToast("Failed to save preferences. Try again.");
    }
    setSaving(false);
  };

  return (
    <div className="form-shell">
      <div className="form-head">
        <p className="eyebrow">Your preferences</p>
        <h1>Tell us your vibe</h1>
        <p>We compare these against every home to surface the ones that already feel like you.</p>
      </div>

      <form className="ntp-form" onSubmit={submit} noValidate>
        <div className="form-field">
          <label className="form-label">Monthly budget</label>
          <div className="budget-row">
            <div className={"budget-cell" + (touched && errors.budget_min ? " has-error" : "")}>
              <span className="adorn">$</span>
              <input className="form-input" type="number" min="0" value={form.budget_min} onChange={(e) => set("budget_min", e.target.value)} />
            </div>
            <span className="budget-dash">to</span>
            <div className={"budget-cell" + (touched && errors.budget_max ? " has-error" : "")}>
              <span className="adorn">$</span>
              <input className="form-input" type="number" min="0" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} />
            </div>
          </div>
          {touched && (errors.budget_min || errors.budget_max) && (
            <span className="field-error">{errors.budget_min || errors.budget_max}</span>
          )}
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label className="form-label">Bedrooms</label>
            <input className="form-input" type="number" min={0} max={6} value={form.bedrooms}
              onChange={(e) => { const v = clampNumber(e.target.value, 0, 6); if (v !== undefined) set("bedrooms", v); }} />
            <p className="form-hint">0 = studio</p>
          </div>
          <div className="form-field">
            <label className="form-label">Bathrooms</label>
            <input className="form-input" type="number" min={1} max={5} value={form.bathrooms}
              onChange={(e) => { const v = clampNumber(e.target.value, 1, 5); if (v !== undefined) set("bathrooms", v); }} />
          </div>
          <div className="form-field">
            <label className="form-label">Household size</label>
            <input className="form-input" type="number" min={1} value={form.household}
              onChange={(e) => { const v = clampNumber(e.target.value, 1); if (v !== undefined) set("household", v); }} />
          </div>
        </div>

        <div className={"form-field" + (touched && errors.locations ? " has-error" : "")}>
          <label className="form-label">Preferred neighborhoods</label>
          <p className="form-hint">Search and select all areas you&apos;d consider — you can pick as many as you like.</p>
          <GeoLocationSearch
            value={form.locations}
            onChange={(locations) => set("locations", locations)}
            error={touched && errors.locations ? errors.locations : ''}
          />
        </div>

        <div className={"form-field" + (touched && errors.move_in ? " has-error" : "")}>
          <label className="form-label">Move-in window</label>
          <MoveInFields
            from={form.move_in_from}
            to={form.move_in_to}
            onChange={({ from, to }) => setForm((f) => ({ ...f, move_in_from: from, move_in_to: to }))}
            error={errors.move_in}
            touched={touched}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Lease length</label>
          <select className="form-input" value={form.lease_length} onChange={(e) => set("lease_length", e.target.value)}>
            <option>6 months</option><option>12 months</option><option>12–24 months</option><option>Month-to-month</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Pets</label>
          <div className="seg-row">
            {["No pets", "Cat", "Small dog", "Dog"].map((p) => (
              <button type="button" key={p} className={"seg" + (form.pets === p ? " active" : "")} onClick={() => set("pets", p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Must-have amenities</label>
          <p className="form-hint">Pick suggestions or add your own.</p>
          <AmenitiesPicker value={form.amenities} onChange={(amenities) => set("amenities", amenities)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="cta-btn" disabled={saving}>
            {saving ? "Saving…" : "Save preferences & see matches"}
          </button>
        </div>
      </form>
    </div>
  );
}

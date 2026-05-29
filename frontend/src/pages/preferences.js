import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { useNestopia } from '../context/NestopiaContext';

const AMENITY_OPTIONS = [
  "Pet-friendly", "Private garden", "In-unit laundry", "Dishwasher", "Parking",
  "Gym", "Rooftop", "Doorman", "Storage", "Balcony", "Pool", "EV charging",
  "Furnished", "Air conditioning", "Hardwood floors", "Natural light",
];

const LOCATIONS = ["Park Slope", "Bed-Stuy", "Williamsburg", "Fort Greene", "Seattle, WA", "Atlanta, GA", "Ithaca, NY"];

export default function Preferences() {
  const navigate = useNavigate();
  const { preferences, savePreferences, flashToast } = useNestopia();

  const init = preferences || {};
  const [form, setForm] = useState({
    budget_min: init.budget_min ?? 2000,
    budget_max: init.budget_max ?? 3500,
    bedrooms: init.bedrooms ?? 1,
    bathrooms: init.bathrooms ?? 1,
    household: init.household ?? 1,
    locations: init.locations || [],
    move_in: init.move_in || "",
    lease_length: init.lease_length || "12 months",
    amenities: init.amenities ? [...init.amenities] : [],
    pets: init.pets || "No pets",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleIn = (key, val) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val] }));

  const validate = (f) => {
    const e = {};
    if (Number(f.budget_min) <= 0) e.budget_min = "Set a minimum budget.";
    if (Number(f.budget_max) <= Number(f.budget_min)) e.budget_max = "Max must be above your minimum.";
    if (!f.locations.length) e.locations = "Pick at least one neighborhood.";
    if (!f.move_in.trim()) e.move_in = "When do you hope to move?";
    return e;
  };

  useEffect(() => {
    if (touched) setErrors(validate(form));
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await savePreferences({
        ...form,
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
            <select className="form-input" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}>
              <option value="0">Studio</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Bathrooms</label>
            <select className="form-input" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)}>
              <option value="1">1+</option><option value="2">2+</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Household size</label>
            <input className="form-input" type="number" min="1" value={form.household} onChange={(e) => set("household", e.target.value)} />
          </div>
        </div>

        <div className={"form-field" + (touched && errors.locations ? " has-error" : "")}>
          <label className="form-label">Preferred neighborhoods</label>
          <div className="chip-pick">
            {LOCATIONS.map((l) => (
              <button type="button" key={l} className={"pick" + (form.locations.includes(l) ? " active" : "")} onClick={() => toggleIn("locations", l)}>
                {form.locations.includes(l) && <Icon name="circle-check" />} {l}
              </button>
            ))}
          </div>
          {touched && errors.locations && <span className="field-error">{errors.locations}</span>}
        </div>

        <div className="form-grid-2">
          <div className={"form-field" + (touched && errors.move_in ? " has-error" : "")}>
            <label className="form-label">Move-in window</label>
            <input className="form-input" value={form.move_in} onChange={(e) => set("move_in", e.target.value)} placeholder="Aug 1 – Sep 15" />
            {touched && errors.move_in && <span className="field-error">{errors.move_in}</span>}
          </div>
          <div className="form-field">
            <label className="form-label">Lease length</label>
            <select className="form-input" value={form.lease_length} onChange={(e) => set("lease_length", e.target.value)}>
              <option>6 months</option><option>12 months</option><option>12–24 months</option><option>Month-to-month</option>
            </select>
          </div>
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
          <div className="chip-pick">
            {AMENITY_OPTIONS.slice(0, 12).map((a) => (
              <button type="button" key={a} className={"pick" + (form.amenities.includes(a) ? " active" : "")} onClick={() => toggleIn("amenities", a)}>
                {form.amenities.includes(a) && <Icon name="circle-check" />} {a}
              </button>
            ))}
          </div>
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

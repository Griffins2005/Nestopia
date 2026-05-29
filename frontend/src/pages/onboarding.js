import React, { useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import AuthContext from '../context/authContext';
import { useNestopia } from '../context/NestopiaContext';

const AMENITY_OPTIONS = [
  "Pet-friendly", "Private garden", "In-unit laundry", "Dishwasher", "Parking",
  "Gym", "Rooftop", "Doorman", "Storage", "Balcony", "Pool", "EV charging",
];

export default function Onboarding() {
  const { submitPreferences } = useContext(AuthContext);
  const { flashToast } = useNestopia();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'renter';

  const [form, setForm] = React.useState({
    budget_min: 1500,
    budget_max: 3000,
    bedrooms: 1,
    bathrooms: 1,
    household: 1,
    locations: [],
    move_in: "",
    lease_length: "12 months",
    amenities: [],
    pets: "No pets",
  });
  const [saving, setSaving] = React.useState(false);

  const LOCATIONS = ["Park Slope", "Bed-Stuy", "Williamsburg", "Fort Greene", "Seattle, WA", "Atlanta, GA", "Ithaca, NY"];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleIn = (key, val) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await submitPreferences({
        ...form,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        household: Number(form.household),
      }, role);
      flashToast("Preferences saved! Welcome to Nestopia.");
    } catch (err) {
      flashToast("Could not save preferences — you can update them anytime in your profile.");
      navigate('/profile');
    }
    setSaving(false);
  };

  const skip = () => navigate('/profile');

  return (
    <div className="form-shell">
      <div className="form-head">
        <p className="eyebrow">Almost there</p>
        <h1>{role === 'renter' ? "Tell us your vibe" : "Describe your ideal tenant"}</h1>
        <p>Help us personalise your matches right from day one.</p>
      </div>

      <form className="ntp-form" onSubmit={submit} noValidate>
        {role === 'renter' && (
          <>
            <div className="form-field">
              <label className="form-label">Monthly budget</label>
              <div className="budget-row">
                <div className="budget-cell">
                  <span className="adorn">$</span>
                  <input className="form-input" type="number" min="0" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} />
                </div>
                <span className="budget-dash">to</span>
                <div className="budget-cell">
                  <span className="adorn">$</span>
                  <input className="form-input" type="number" min="0" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field">
                <label className="form-label">Bedrooms</label>
                <select className="form-input" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
                  <option value="0">Studio</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Bathrooms</label>
                <select className="form-input" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}>
                  <option value="1">1+</option><option value="2">2+</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Household size</label>
                <input className="form-input" type="number" min="1" value={form.household} onChange={e => set('household', e.target.value)} />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Preferred neighborhoods</label>
              <div className="chip-pick">
                {LOCATIONS.map(l => (
                  <button type="button" key={l} className={"pick" + (form.locations.includes(l) ? " active" : "")} onClick={() => toggleIn('locations', l)}>
                    {form.locations.includes(l) && <Icon name="circle-check" />} {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Move-in window</label>
                <input className="form-input" value={form.move_in} onChange={e => set('move_in', e.target.value)} placeholder="Aug 1 – Sep 15" />
              </div>
              <div className="form-field">
                <label className="form-label">Lease length</label>
                <select className="form-input" value={form.lease_length} onChange={e => set('lease_length', e.target.value)}>
                  <option>6 months</option><option>12 months</option><option>12–24 months</option><option>Month-to-month</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Pets</label>
              <div className="seg-row">
                {["No pets", "Cat", "Small dog", "Dog"].map(p => (
                  <button type="button" key={p} className={"seg" + (form.pets === p ? " active" : "")} onClick={() => set('pets', p)}>{p}</button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Must-have amenities</label>
              <div className="chip-pick">
                {AMENITY_OPTIONS.slice(0, 12).map(a => (
                  <button type="button" key={a} className={"pick" + (form.amenities.includes(a) ? " active" : "")} onClick={() => toggleIn('amenities', a)}>
                    {form.amenities.includes(a) && <Icon name="circle-check" />} {a}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="cta-btn" disabled={saving}>{saving ? 'Saving…' : 'Save & continue'}</button>
          <button type="button" className="cta-btn ghost" onClick={skip}>Skip for now</button>
        </div>
      </form>
    </div>
  );
}

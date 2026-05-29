import React, { useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GeoLocationSearch from '../components/GeoLocationSearch';
import { MoveInFields, AmenitiesPicker } from '../components/preferences/form';
import { formatMoveInForApi, clampNumber } from '../api/preferences';
import AuthContext from '../context/authContext';
import { useNestopia } from '../context/NestopiaContext';

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
    move_in_from: '',
    move_in_to: '',
    lease_length: "12 months",
    amenities: [],
    pets: "No pets",
  });
  const [saving, setSaving] = React.useState(false);
  const [locError, setLocError] = React.useState('');
  const [moveInError, setMoveInError] = React.useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (role === 'landlord') {
    return (
      <div className="form-shell">
        <div className="form-head">
          <p className="eyebrow">Welcome</p>
          <h1>Ready to list your home?</h1>
          <p>
            Tenant requirements are set on each listing. When you add a property, you can define what you
            expect from tenants — or import requirements from another listing you already own.
          </p>
        </div>
        <div className="form-actions">
          <button type="button" className="cta-btn" onClick={() => navigate('/listing/new')}>
            Create a listing
          </button>
          <button type="button" className="cta-btn ghost" onClick={() => navigate('/profile')}>
            Go to profile
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.locations.length) {
      setLocError('Pick at least one neighborhood.');
      return;
    }
    setLocError('');
    if (!form.move_in_from) {
      setMoveInError('Pick a move-in start date.');
      return;
    }
    if (form.move_in_to && form.move_in_to < form.move_in_from) {
      setMoveInError('End date must be after start.');
      return;
    }
    setMoveInError('');
    setSaving(true);
    try {
      await submitPreferences({
        ...form,
        move_in: formatMoveInForApi(form.move_in_from, form.move_in_to),
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        household: Number(form.household),
      }, 'renter');
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
        <h1>Tell us your vibe</h1>
        <p>Help us personalise your matches right from day one.</p>
      </div>

      <form className="ntp-form" onSubmit={submit} noValidate>
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
            <input className="form-input" type="number" min={0} max={6} value={form.bedrooms}
              onChange={(e) => { const v = clampNumber(e.target.value, 0, 6); if (v !== undefined) set('bedrooms', v); }} />
            <p className="form-hint">0 = studio</p>
          </div>
          <div className="form-field">
            <label className="form-label">Bathrooms</label>
            <input className="form-input" type="number" min={1} max={5} value={form.bathrooms}
              onChange={(e) => { const v = clampNumber(e.target.value, 1, 5); if (v !== undefined) set('bathrooms', v); }} />
          </div>
          <div className="form-field">
            <label className="form-label">Household size</label>
            <input className="form-input" type="number" min={1} value={form.household}
              onChange={(e) => { const v = clampNumber(e.target.value, 1); if (v !== undefined) set('household', v); }} />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Preferred neighborhoods</label>
          <p className="form-hint">Select every area you&apos;d happily live in.</p>
          <GeoLocationSearch
            value={form.locations}
            onChange={(locations) => set('locations', locations)}
            error={locError}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Move-in window</label>
          <MoveInFields
            idPrefix="onboard-move-in"
            from={form.move_in_from}
            to={form.move_in_to}
            onChange={({ from, to }) => setForm((f) => ({ ...f, move_in_from: from, move_in_to: to }))}
            error={moveInError}
            touched={Boolean(moveInError)}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Lease length</label>
          <select className="form-input" value={form.lease_length} onChange={e => set('lease_length', e.target.value)}>
            <option>6 months</option><option>12 months</option><option>12–24 months</option><option>Month-to-month</option>
          </select>
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
          <p className="form-hint">Pick suggestions or add your own.</p>
          <AmenitiesPicker value={form.amenities} onChange={(amenities) => set('amenities', amenities)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="cta-btn" disabled={saving}>{saving ? 'Saving…' : 'Save & continue'}</button>
          <button type="button" className="cta-btn ghost" onClick={skip}>Skip for now</button>
        </div>
      </form>
    </div>
  );
}

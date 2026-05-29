import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { useNestopia } from '../context/NestopiaContext';
import { getListingById } from '../api/listings';

const AMENITY_OPTIONS = [
  "Pet-friendly", "Private garden", "In-unit laundry", "Dishwasher", "Parking",
  "Gym", "Rooftop", "Doorman", "Storage", "Balcony", "Pool", "EV charging",
  "Furnished", "Air conditioning", "Hardwood floors", "Natural light",
  "Stoop", "Backyard", "Bike storage", "Elevator",
];

export default function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { addListing, updateListing, deleteListing, flashToast } = useNestopia();

  const [form, setForm] = useState({
    title: "", location: "", rent_price: "", bedrooms: "",
    bathrooms: "", sqft: "", available_from: "", lease_length: "12 months",
    pets: "No pets", description: "", house_rules: "", amenities: [],
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    getListingById(id)
      .then(res => {
        const l = res.data;
        setForm({
          title: l.title || "",
          location: l.location || "",
          rent_price: l.rent_price ?? "",
          bedrooms: l.bedrooms ?? "",
          bathrooms: l.bathrooms ?? "",
          sqft: l.sqft ?? "",
          available_from: l.available_from || "",
          lease_length: l.lease_length || "12 months",
          pets: l.pets || "No pets",
          description: l.description || "",
          house_rules: l.house_rules || "",
          amenities: l.amenities ? [...l.amenities] : [],
        });
        setLoading(false);
      })
      .catch(() => navigate('/listings'));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const validate = (f) => {
    const e = {};
    if (!f.title.trim()) e.title = "Give your home a title.";
    else if (f.title.trim().length < 6) e.title = "A few more words helps renters picture it.";
    if (!f.location.trim()) e.location = "Where is it? Neighborhood, city.";
    if (f.rent_price === "" || Number(f.rent_price) <= 0) e.rent_price = "Enter a monthly rent.";
    if (f.bedrooms === "" || Number(f.bedrooms) < 0) e.bedrooms = "Enter bedrooms (0 for studio).";
    if (f.bathrooms === "" || Number(f.bathrooms) <= 0) e.bathrooms = "Enter bathrooms.";
    if (!f.available_from.trim()) e.available_from = "When can someone move in?";
    if (!f.description.trim() || f.description.trim().length < 20) e.description = "Tell the story — at least a sentence or two.";
    return e;
  };

  const toggleAmenity = (a) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));

  useEffect(() => {
    if (Object.keys(touched).length) setErrors(validate(form));
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched({ title: 1, location: 1, rent_price: 1, bedrooms: 1, bathrooms: 1, available_from: 1, description: 1 });
    if (Object.keys(errs).length) return;

    const data = {
      ...form,
      rent_price: Number(form.rent_price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqft: form.sqft === "" ? null : Number(form.sqft),
    };

    try {
      if (isEditing) {
        await updateListing(Number(id), data);
        flashToast("Listing updated.");
        navigate(`/listing/${id}`);
      } else {
        const created = await addListing(data);
        flashToast("Listing published!");
        navigate(`/listing/${created.id}`);
      }
    } catch (err) {
      flashToast("Failed to save listing. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(Number(id));
      flashToast("Listing deleted.");
      navigate('/listings');
    } catch (err) {
      flashToast("Failed to delete listing.");
    }
  };

  const fieldCls = (k) => "form-field" + (touched[k] && errors[k] ? " has-error" : "");

  if (loading) return <div className="form-shell"><p style={{ padding: "2rem" }}>Loading…</p></div>;

  return (
    <div className="form-shell">
      <button className="detail-back" onClick={() => navigate(isEditing ? `/listing/${id}` : '/listings')}>
        <Icon name="arrow-left" /> {isEditing ? "Back to listing" : "Back to listings"}
      </button>

      <div className="form-head">
        <p className="eyebrow">{isEditing ? "Edit listing" : "New listing"}</p>
        <h1>{isEditing ? "Update your home" : "List your home on Nestopia"}</h1>
        <p>Renters see this exactly as you write it. Warm, honest detail earns the best matches.</p>
      </div>

      <form className="ntp-form" onSubmit={submit} noValidate>
        <div className={fieldCls("title")}>
          <label className="form-label">Listing title</label>
          <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} onBlur={() => blur("title")} placeholder="Sun-filled 2-bed with garden" />
          {touched.title && errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className={fieldCls("location")}>
          <label className="form-label">Location</label>
          <input className="form-input" value={form.location} onChange={(e) => set("location", e.target.value)} onBlur={() => blur("location")} placeholder="Park Slope, Brooklyn" />
          {touched.location && errors.location && <span className="field-error">{errors.location}</span>}
        </div>

        <div className="form-grid-3">
          <div className={fieldCls("rent_price")}>
            <label className="form-label">Rent ($/mo)</label>
            <input className="form-input" type="number" min="0" value={form.rent_price} onChange={(e) => set("rent_price", e.target.value)} onBlur={() => blur("rent_price")} placeholder="3250" />
            {touched.rent_price && errors.rent_price && <span className="field-error">{errors.rent_price}</span>}
          </div>
          <div className={fieldCls("bedrooms")}>
            <label className="form-label">Bedrooms</label>
            <input className="form-input" type="number" min="0" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} onBlur={() => blur("bedrooms")} placeholder="2" />
            {touched.bedrooms && errors.bedrooms && <span className="field-error">{errors.bedrooms}</span>}
          </div>
          <div className={fieldCls("bathrooms")}>
            <label className="form-label">Bathrooms</label>
            <input className="form-input" type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} onBlur={() => blur("bathrooms")} placeholder="1" />
            {touched.bathrooms && errors.bathrooms && <span className="field-error">{errors.bathrooms}</span>}
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label className="form-label">Square feet <span className="opt">(optional)</span></label>
            <input className="form-input" type="number" min="0" value={form.sqft} onChange={(e) => set("sqft", e.target.value)} placeholder="980" />
          </div>
          <div className={fieldCls("available_from")}>
            <label className="form-label">Available from</label>
            <input className="form-input" value={form.available_from} onChange={(e) => set("available_from", e.target.value)} onBlur={() => blur("available_from")} placeholder="Aug 1" />
            {touched.available_from && errors.available_from && <span className="field-error">{errors.available_from}</span>}
          </div>
          <div className="form-field">
            <label className="form-label">Lease length</label>
            <select className="form-input" value={form.lease_length} onChange={(e) => set("lease_length", e.target.value)}>
              <option>6 months</option>
              <option>12 months</option>
              <option>12–24 months</option>
              <option>Month-to-month</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Pet policy</label>
          <div className="seg-row">
            {["No pets", "Cats only", "Cats & small dogs", "Cats & dogs"].map((p) => (
              <button type="button" key={p} className={"seg" + (form.pets === p ? " active" : "")} onClick={() => set("pets", p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className={fieldCls("description")}>
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="4" value={form.description} onChange={(e) => set("description", e.target.value)} onBlur={() => blur("description")} placeholder="A bright corner garden apartment on a quiet block…" />
          {touched.description && errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Amenities</label>
          <div className="chip-pick">
            {AMENITY_OPTIONS.map((a) => (
              <button type="button" key={a} className={"pick" + (form.amenities.includes(a) ? " active" : "")} onClick={() => toggleAmenity(a)}>
                {form.amenities.includes(a) && <Icon name="circle-check" />} {a}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">House rules <span className="opt">(optional)</span></label>
          <textarea className="form-input" rows="2" value={form.house_rules} onChange={(e) => set("house_rules", e.target.value)} placeholder="Quiet hours after 10 PM. No smoking inside." />
        </div>

        <div className="form-actions">
          <button type="submit" className="cta-btn">{isEditing ? "Save changes" : "Publish listing"}</button>
          <button type="button" className="cta-btn ghost" onClick={() => navigate(isEditing ? `/listing/${id}` : '/listings')}>Cancel</button>
          {isEditing && (
            <button type="button" className="cta-btn danger-text" onClick={handleDelete}>
              <Icon name="trash" /> Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

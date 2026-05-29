import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icons';
import GeoLocationSearch from '../components/GeoLocationSearch';
import { ChipPickerWithCustom, LISTING_AMENITY_SUGGESTIONS, TENANT_REQUIREMENT_SUGGESTIONS } from '../components/preferences/form';
import { getListingById, uploadListingImage, listingImageUrl, getMyListings } from '../api/listings';
import { clampNumber } from '../api/preferences';
import { formatLocationLabel } from '../api/geo';
import { useNestopia } from '../context/NestopiaContext';

const todayIso = () => new Date().toISOString().slice(0, 10);

function parseAvailableDate(stored) {
  if (!stored) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
  return '';
}

export default function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { addListing, updateListing, deleteListing, flashToast } = useNestopia();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "", location: "", latitude: null, longitude: null, rent_price: "", bedrooms: "",
    bathrooms: "", sqft: "", available_from: "", lease_length: "12 months",
    pets: "No pets", description: "", house_rules: "", amenities: [], images: [],
    tenant_preferences: [], tenant_custom_requirements: [],
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [otherListings, setOtherListings] = useState([]);
  const [importSourceId, setImportSourceId] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    getListingById(id)
      .then(res => {
        const l = res.data;
        setForm({
          title: l.title || "",
          location: l.location || "",
          latitude: l.latitude ?? l.lat ?? null,
          longitude: l.longitude ?? l.lng ?? null,
          rent_price: l.rent_price ?? "",
          bedrooms: l.bedrooms ?? "",
          bathrooms: l.bathrooms ?? "",
          sqft: l.sqft ?? "",
          available_from: parseAvailableDate(l.available_from),
          lease_length: l.lease_length || "12 months",
          pets: l.pets || "No pets",
          description: l.description || "",
          house_rules: l.house_rules || "",
          amenities: l.amenities ? [...l.amenities] : [],
          images: l.images ? [...l.images] : [],
          tenant_preferences: l.tenant_preferences ? [...l.tenant_preferences] : [],
          tenant_custom_requirements: l.tenant_custom_requirements ? [...l.tenant_custom_requirements] : [],
        });
        setLoading(false);
      })
      .catch(() => navigate('/listings'));
  }, [id, isEditing, navigate]);

  useEffect(() => {
    getMyListings()
      .then((res) => {
        const listings = (res.data || [])
          .slice()
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .filter((l) => !isEditing || String(l.id) !== String(id));
        setOtherListings(listings);
        if (listings.length > 0) setImportSourceId(String(listings[0].id));
      })
      .catch(() => setOtherListings([]));
  }, [isEditing, id]);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === '#tenant-requirements') {
      document.getElementById('tenant-requirements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  const applyTenantTemplate = (source) => {
    if (!source) return;
    const lease = source.lease_length;
    const rules = source.house_rules;
    const houseRules = Array.isArray(rules) ? rules.join(', ') : (rules || '');
    setForm((f) => ({
      ...f,
      tenant_preferences: source.tenant_preferences ? [...source.tenant_preferences] : [],
      tenant_custom_requirements: source.tenant_custom_requirements ? [...source.tenant_custom_requirements] : [],
      pets: source.pets || f.pets,
      lease_length: typeof lease === 'number' ? `${lease} months` : (lease || f.lease_length),
      house_rules: houseRules || f.house_rules,
    }));
    flashToast(`Tenant requirements imported from “${source.title}”.`);
  };

  const handleImportTenantRequirements = () => {
    const source = otherListings.find((l) => String(l.id) === importSourceId);
    if (!source) {
      flashToast('Choose a listing to import from.');
      return;
    }
    applyTenantTemplate(source);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const validate = (f) => {
    const e = {};
    if (!f.title.trim()) e.title = "Give your home a title.";
    else if (f.title.trim().length < 6) e.title = "A few more words helps renters picture it.";
    const loc = formatLocationLabel(f.location).trim();
    if (!loc) e.location = "Enter the property address.";
    else if (loc.length < 5) e.location = "Enter a complete street address or location.";
    if (f.rent_price === "" || Number(f.rent_price) <= 0) e.rent_price = "Enter a monthly rent.";
    if (f.bedrooms === "" || Number(f.bedrooms) < 0) e.bedrooms = "Enter bedrooms (0 for studio).";
    if (f.bathrooms === "" || Number(f.bathrooms) < 1) e.bathrooms = "Enter bathrooms.";
    if (!f.available_from) e.available_from = "Pick an available date.";
    if (!f.images?.length) e.images = "Add at least one property photo.";
    if (!f.description.trim() || f.description.trim().length < 20) e.description = "Tell the story — at least a sentence or two.";
    return e;
  };

  const allErrors = validate(form);
  const errors = Object.keys(touched).length ? allErrors : {};

  const onPhotoSelect = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const urls = [];
      for (const file of files) {
        const res = await uploadListingImage(file);
        urls.push(res.data.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      flashToast('Photo upload failed — try again.');
    }
    setUploadingPhotos(false);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setTouched({
      title: 1, location: 1, rent_price: 1, bedrooms: 1, bathrooms: 1,
      available_from: 1, description: 1, images: 1,
    });
    if (Object.keys(errs).length) return;

    const data = {
      ...form,
      location: typeof form.location === 'object' ? form.location.label : form.location,
      latitude: form.latitude ?? (form.location?.lat ?? null),
      longitude: form.longitude ?? (form.location?.lng ?? null),
      rent_price: Number(form.rent_price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqft: form.sqft === "" ? null : Number(form.sqft),
      images: form.images,
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
      flashToast(err?.response?.data?.detail || "Failed to save listing. Please try again.");
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
        <p className="eyebrow eyebrow-muted">{isEditing ? 'Edit listing' : 'New listing'}</p>
        <h1>{isEditing ? "Update your home" : "List your home on Nestopia"}</h1>
      </div>

      <form className="ntp-form" onSubmit={submit} noValidate>
        <div className={fieldCls("title")}>
          <label className="form-label">Listing title</label>
          <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} onBlur={() => blur("title")} placeholder="Sun-filled 2-bed with garden" />
          {touched.title && errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className={fieldCls("location")}>
          <label className="form-label">Property address</label>
          <GeoLocationSearch
            multiple={false}
            addressMode
            value={
              form.latitude != null && form.longitude != null
                ? { label: form.location, lat: form.latitude, lng: form.longitude }
                : form.location
            }
            onChange={(place) => {
              setForm((f) => ({
                ...f,
                location: place?.label || '',
                latitude: place?.lat ?? null,
                longitude: place?.lng ?? null,
              }));
            }}
            error={touched.location && errors.location ? errors.location : ''}
            placeholder="Full street address"
          />
        </div>

        <div className={fieldCls("images")}>
          <label className="form-label">Property photos</label>
          <p className="form-hint">At least one photo. First photo is the cover.</p>
          <div className="listing-photo-row">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="listing-photo-input"
              onChange={onPhotoSelect}
            />
            <button
              type="button"
              className="cta-btn ghost small"
              disabled={uploadingPhotos}
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadingPhotos ? 'Uploading…' : 'Add photos'}
            </button>
          </div>
          {form.images.length > 0 && (
            <div className="image-previews listing-photo-previews">
              {form.images.map((img, i) => (
                <div key={`${img}-${i}`} className="image-thumb">
                  <img src={listingImageUrl(img)} alt={`Property ${i + 1}`} />
                  {i === 0 && <span className="listing-photo-cover">Cover</span>}
                  <button type="button" className="remove-img-btn" onClick={() => removePhoto(i)} aria-label="Remove photo">×</button>
                </div>
              ))}
            </div>
          )}
          {touched.images && errors.images && <span className="field-error">{errors.images}</span>}
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
            <input className="form-input" type="number" min={1} max={5} value={form.bathrooms}
              onChange={(e) => { const v = clampNumber(e.target.value, 1, 5); if (v !== undefined) set("bathrooms", v); }}
              onBlur={() => blur("bathrooms")} placeholder="1" />
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
            <input
              className="form-input move-in-date"
              type="date"
              min={todayIso()}
              value={form.available_from}
              onChange={(e) => set("available_from", e.target.value)}
              onBlur={() => blur("available_from")}
            />
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
          <p className="form-hint">Add custom amenities below.</p>
          <ChipPickerWithCustom
            value={form.amenities}
            onChange={(amenities) => set("amenities", amenities)}
            suggestions={LISTING_AMENITY_SUGGESTIONS}
            placeholder="Add custom amenity"
          />
        </div>

        <div className="form-field" id="tenant-requirements">
          <label className="form-label">Tenant requirements</label>
          <p className="form-hint">
            Requirements saved on this listing only. You can import them from another property you own — photos, amenities, and other details stay separate.
          </p>
          {otherListings.length > 0 && (
            <div className="tenant-import-row">
              <label className="form-label" htmlFor="tenant-import-source">Import from another listing</label>
              <div className="tenant-import-picker">
                <select
                  id="tenant-import-source"
                  className="form-input"
                  value={importSourceId}
                  onChange={(e) => setImportSourceId(e.target.value)}
                >
                  {otherListings.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cta-btn ghost small"
                  onClick={handleImportTenantRequirements}
                >
                  Import requirements
                </button>
              </div>
            </div>
          )}
          <ChipPickerWithCustom
            value={form.tenant_preferences}
            onChange={(tenant_preferences) => set("tenant_preferences", tenant_preferences)}
            suggestions={TENANT_REQUIREMENT_SUGGESTIONS}
            placeholder="Add custom requirement"
            addLabel="Add"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Custom tenant rules <span className="opt">(optional)</span></label>
          <ChipPickerWithCustom
            value={form.tenant_custom_requirements}
            onChange={(tenant_custom_requirements) => set("tenant_custom_requirements", tenant_custom_requirements)}
            suggestions={[]}
            placeholder='e.g., "Quiet tenants preferred"'
            addLabel="Add rule"
          />
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

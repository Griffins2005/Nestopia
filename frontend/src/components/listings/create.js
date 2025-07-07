// src/components/listings/create.js
import React, { useContext, useState, useRef, useEffect } from "react";
import AuthContext from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Category groupings for UX only (not backend)
const PROPERTY_TYPES = [
  "Apartment", "House", "Condo", "Townhouse", "Studio"
];
const AMENITIES = [
  "Parking", "WiFi", "Laundry", "Garden", "Gym", "Air Conditioning", "Dishwasher", "Security System", "Pool", "Heating", "Balcony"
];
const PROPERTY_FEATURES = [
  "Hardwood Floors", "Walk-in Closet", "Updated Kitchen", "Storage Space",
  "Stainless Appliances", "Fireplace", "Modern Bathroom", "Granite Counters",
  "High Ceilings", "Natural Light"
];
const HOUSE_RULES = [
  "No Smoking", "No Pets", "Credit Check Required", "Background Check Required"
];

export default function CreateListingForm({ edit = false, initialFields = {}, onSubmitDone, onClose }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [fields, setFields] = useState({
    title: "", description: "", rent_price: "", property_type: "",
    address: "", city: "", state: "", zipcode: "",
    bedrooms: "", bathrooms: "", sqft: "",
    available_from: "", lease_length: "",
    amenities: [], features: [], rules: [],
    images: []
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [imageUploadType, setImageUploadType] = useState("upload");
  const [imageInput, setImageInput] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef();

  // Load for edit mode
  useEffect(() => {
    if (edit && initialFields && initialFields.id) {
      // Try to split location into address fields if possible, fallback gracefully
      let address = "", city = "", state = "", zipcode = "";
      if (initialFields.location) {
        const parts = initialFields.location.split(",");
        address = parts[0]?.trim() || "";
        if (parts.length > 1) {
          const cityStateZip = parts.slice(1).join(",").trim().split(" ");
          city = cityStateZip[0] || "";
          state = cityStateZip[1] || "";
          zipcode = cityStateZip[2] || "";
        }
      }
      setFields(f => ({
        ...f,
        ...initialFields,
        address,
        city,
        state,
        zipcode,
        images: initialFields.images || [],
        amenities: initialFields.amenities || [],
        features: initialFields.building_features || [], // If backend already returns as building_features
        rules: initialFields.house_rules || []
      }));
    }
  }, [edit, initialFields]);

  // Toggle select chip
  const toggleChip = (group, val) => {
    setFields(prev => ({
      ...prev,
      [group]: prev[group].includes(val)
        ? prev[group].filter(v => v !== val)
        : [...prev[group], val]
    }));
  };

  // Handle input changes
  const handleField = e => {
    const { name, value } = e.target;
    setFields(f => ({ ...f, [name]: value }));
  };

  // Image upload logic
  const handleImageUpload = async files => {
    const uploadedUrls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/listings/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      uploadedUrls.push(res.data.url);
    }
    setFields(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setImageFiles([]);
  };

  const handleClose = () => {
    // Reset the form and call onClose (if given)
    setFields({
      title: "", description: "", rent_price: "", property_type: "",
      address: "", city: "", state: "", zipcode: "",
      bedrooms: "", bathrooms: "", sqft: "",
      available_from: "", lease_length: "",
      amenities: [], features: [], rules: [], images: []
    });
    setError("");
    setStatusMessage("");
    if (onClose) onClose();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!fields.title || !fields.address || !fields.city || !fields.state || !fields.zipcode || !fields.rent_price || !fields.property_type) {
      setError("Please fill all required fields.");
      return;
    }
    // Combine location fields
    const location = `${fields.address}, ${fields.city}, ${fields.state} ${fields.zipcode}`.trim();

    try {
      const payload = {
        title: fields.title,
        description: fields.description,
        location,
        rent_price: parseInt(fields.rent_price),
        property_type: fields.property_type,
        bedrooms: parseInt(fields.bedrooms, 10) || 1,
        bathrooms: parseInt(fields.bathrooms, 10) || 1,
        sqft: parseInt(fields.sqft, 10) || undefined,
        available_from: fields.available_from,
        lease_length: parseInt(fields.lease_length, 10) || undefined,
        amenities: fields.amenities,
        building_features: fields.features, // map
        house_rules: fields.rules,          // map
        images: fields.images
      };
      if (edit) {
        await axios.put(`/api/listings/${initialFields.id}`, payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.accessToken}` }
        });
        setStatusMessage("Listing updated!");
      } else {
        await axios.post("/api/listings/", payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.accessToken}` }
        });
        setStatusMessage("Listing created!");
      }
      setTimeout(() => {
        if (onSubmitDone) onSubmitDone();
        else navigate("/profile");
      }, 1300);
    } catch (err) {
      setError("Failed to save listing.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-form">
        {/* X Close Button */}
        <button className="modal-close-x" onClick={handleClose} aria-label="Close form">
          ×
        </button>
        <h2 className="form-title">{edit ? "Edit Listing" : "Create New Listing"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="section-title">Basic Information</div>
          <div className="form-row">
            <div className="form-group">
              <label>Property Title *</label>
              <input name="title" placeholder="e.g., Modern Downtown Apartment" value={fields.title} onChange={handleField} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" placeholder="Describe your property..." value={fields.description} onChange={handleField} required rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Rent ($) *</label>
              <input name="rent_price" type="number" placeholder="2500" value={fields.rent_price} onChange={handleField} required />
            </div>
            <div className="form-group">
              <label>Property Type *</label>
              <select name="property_type" value={fields.property_type} onChange={handleField} required>
                <option value="">Select type</option>
                {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="section-title">Location</div>
          <div className="form-row">
            <div className="form-group">
              <label>Street Address *</label>
              <input name="address" placeholder="123 Main Street" value={fields.address} onChange={handleField} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <input name="city" value={fields.city} onChange={handleField} required />
            </div>
            <div className="form-group">
              <label>State *</label>
              <input name="state" value={fields.state} onChange={handleField} required />
            </div>
            <div className="form-group">
              <label>ZIP Code *</label>
              <input name="zipcode" value={fields.zipcode} onChange={handleField} required />
            </div>
          </div>

          {/* Property Details */}
          <div className="section-title">Property Details</div>
          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms *</label>
              <select name="bedrooms" value={fields.bedrooms} onChange={handleField} required>
                <option value="">Select</option>
                {[1,2,3,4,5].map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Bathrooms *</label>
              <select name="bathrooms" value={fields.bathrooms} onChange={handleField} required>
                <option value="">Select</option>
                {[1,2,3,4].map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Square Feet</label>
              <input name="sqft" type="number" value={fields.sqft} onChange={handleField} placeholder="1200" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Available From</label>
              <input name="available_from" type="date" value={fields.available_from} onChange={handleField} />
            </div>
            <div className="form-group">
              <label>Preferred Lease Length</label>
              <select name="lease_length" value={fields.lease_length} onChange={handleField}>
                <option value="">Select</option>
                {[6,12,18,24].map(x => <option key={x} value={x}>{x} months</option>)}
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div className="section-title">Amenities</div>
          <div className="chip-group">
            {AMENITIES.map(a => (
              <button type="button" key={a}
                className={`chip${fields.amenities.includes(a) ? " selected" : ""}`}
                onClick={() => toggleChip("amenities", a)}>{a}</button>
            ))}
          </div>

          {/* Property Features */}
          <div className="section-title">Property Features</div>
          <div className="chip-group">
            {PROPERTY_FEATURES.map(f => (
              <button type="button" key={f}
                className={`chip${fields.features.includes(f) ? " selected" : ""}`}
                onClick={() => toggleChip("features", f)}>{f}</button>
            ))}
          </div>

          {/* House Rules */}
          <div className="section-title">House Rules</div>
          <div className="chip-group">
            {HOUSE_RULES.map(r => (
              <button type="button" key={r}
                className={`chip${fields.rules.includes(r) ? " selected" : ""}`}
                onClick={() => toggleChip("rules", r)}>{r}</button>
            ))}
          </div>

          <div className="section-title">Images</div>
          <div className="upload-type-row">
            <label>
              <input
                type="radio"
                checked={imageUploadType === "upload"}
                onChange={() => setImageUploadType("upload")}
              />
              Upload Images
            </label>
            <label>
              <input
                type="radio"
                checked={imageUploadType === "link"}
                onChange={() => setImageUploadType("link")}
              />
              Use Image Link(s)
            </label>
          </div>

          {imageUploadType === "upload" && (
            <div className="file-upload-row">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={e => setImageFiles([...e.target.files])}
              />
              <button
                type="button"
                onClick={() => handleImageUpload(imageFiles)}
                disabled={!imageFiles.length}
                className="small-btn"
              >
                Upload Selected
              </button>
            </div>
          )}

          {imageUploadType === "link" && (
            <div className="link-upload-row">
              <input
                type="text"
                placeholder="Paste image URL"
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (imageInput.trim()) {
                    setFields(prev => ({ ...prev, images: [...prev.images, imageInput.trim()] }));
                    setImageInput("");
                  }
                }}
                disabled={!imageInput.trim()}
                className="small-btn"
              >
                Add
              </button>
            </div>
          )}

          <div className="image-previews">
            {fields.images.map((img, i) => (
              <div key={i} className="image-thumb">
                <img src={img} alt={`Listing ${i + 1}`} />
                <button
                  type="button"
                  className="remove-img-btn"
                  onClick={() => setFields(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                >×</button>
              </div>
            ))}
          </div>

          {/* Error and status */}
          {error && <div className="form-error">{error}</div>}
          {statusMessage && <div className="form-success">{statusMessage}</div>}

          {/* Submit buttons */}
          <div className="form-row right">
            <button type="button" className="cancel-btn" onClick={handleClose}>Cancel</button>
            <button type="submit" className="submit-btn">{edit ? "Update Listing" : "Create Listing"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

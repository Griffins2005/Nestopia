import React, { useState, useRef, useContext, useEffect } from "react";
import axios from "axios";
import avatar from "../../images/avatar.png";
import AuthContext from "../../context/authContext";
import { FiMapPin, FiCheckCircle, FiNavigation } from "react-icons/fi";

function isValidPhone(phone) {
  return !phone || /^(\+?\d{5,15})$/.test(phone);
}

const GOOGLE_PLACE_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";

export default function ProfileEditForm({ user, onSave, onCancel }) {
  const [name, setName] = useState(user.name || "");
  const [about, setAbout] = useState(user.about || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [profileDoc, setProfileDoc] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    user.profilePicture
      ? (user.profilePicture.startsWith("http")
        ? user.profilePicture
        : `${import.meta.env.REACT_APP_API_URL || "http://localhost:8000"}${user.profilePicture}`)
      : avatar
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [validity, setValidity] = useState({
    name: true,
    about: true,
    phone: true,
    location: true,
  });
  const fileInputRef = useRef();
  const { refreshProfile } = useContext(AuthContext);
  const locationDebounce = useRef(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (!location || !import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      setLocationSuggestions([]);
      return;
    }
    clearTimeout(locationDebounce.current);
    locationDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${GOOGLE_PLACE_ENDPOINT}?input=${encodeURIComponent(
            location
          )}&types=(cities)&key=${import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
        );
        const data = await res.json();
        if (data?.predictions) {
          setLocationSuggestions(data.predictions.slice(0, 5));
        }
      } catch (err) {
        setLocationSuggestions([]);
      }
    }, 300);
  }, [location]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&email=support@nestopia.com`,
            { headers: { Accept: "application/json" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state;
          const country = data.address?.country;
          setLocation([city, country].filter(Boolean).join(", "));
          setError("");
        } catch (err) {
          setError("Couldn't determine your city automatically.");
        }
        setDetectingLocation(false);
      },
      () => {
        setError("Location permission denied.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileDoc(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePicturePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setProfileDoc(file);
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePicturePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };
  const handleDragOver = (e) => { e.preventDefault(); };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/api/users/upload-profile-doc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      return res.data.file_url;
    } catch (e) {
      setError("Document upload failed.");
      return null;
    }
  };

  const validateFields = () => {
    const states = {
      name: name.trim().length >= 2,
      about: about.trim().length <= 400,
      phone: isValidPhone(phone),
      location: location.trim().length > 2,
    };
    setValidity(states);
    if (!states.name) return "Please enter your full name (min 2 characters).";
    if (!states.phone)
      return "Phone must be an international number like +167890986879.";
    if (!states.location)
      return "Choose a location so we can personalize your matches.";
    return null;
  };

  const handleSave = async () => {
    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    let fileUrl = user.profilePicture || avatar;
    if (profileDoc) {
      fileUrl = await handleUpload(profileDoc);
      if (!fileUrl) {
        setSaving(false);
        return;
      }
    }
    try {
      const res = await axios.patch(
        "/api/users/me",
        { name, about, phone, location, profilePicture: fileUrl },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      await refreshProfile?.();
      onSave(res.data);
    } catch (e) {
      setError("Failed to update profile.");
    }
    setSaving(false);
  };

  return (
    <div className="profile-edit-form card-surface">
      <div className="profile-form-grid">
        <div className="form-group span-2 profile-edit-banner">
          <div>
            <p className="eyebrow soft">Update your profile</p>
            <h2>Tell us about you</h2>
            <p className="form-desc">
              Add a friendly photo, a short bio, and where you’re based so hosts and renters know more about you.
            </p>
          </div>
        </div>

        <div className={`form-group ${!validity.name ? "has-error" : ""}`}>
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            placeholder="Full name"
          />
          {!validity.name && <span className="input-error">Enter at least 2 characters.</span>}
        </div>

        <div className={`form-group span-2 location-group ${!validity.location ? "has-error" : ""}`}>
          <label htmlFor="profile-location">Location</label>
          <div className="location-input-wrapper">
            <FiMapPin />
            <input
              id="profile-location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              maxLength={80}
              placeholder="City, Country"
            />
          </div>
          <button
            type="button"
            className="profile-btn-outline small secondary"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
          >
            <FiNavigation /> {detectingLocation ? "Detecting..." : "Use my location"}
          </button>
          {!validity.location && (
            <span className="input-error">Please select a city.</span>
          )}
          {locationSuggestions.length > 0 && (
            <div className="location-suggestions">
              {locationSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.place_id}
                  onClick={() => {
                    setLocation(suggestion.description);
                    setLocationSuggestions([]);
                  }}
                >
                  {suggestion.description}
                </button>
              ))}
            </div>
          )}
          <p className="input-hint">
            We use your city to show more accurate maps on listings.
          </p>
        </div>

        <div className={`form-group span-2 ${!validity.about ? "has-error" : ""}`}>
          <label htmlFor="profile-about">About</label>
          <textarea
            id="profile-about"
            value={about}
            onChange={e => setAbout(e.target.value)}
            maxLength={400}
            placeholder="What should people know about you?"
          />
          <div className="input-hint">
            {about.length}/400 characters
          </div>
        </div>

        <div className={`form-group ${!validity.phone ? "has-error" : ""}`}>
          <label htmlFor="profile-phone">Phone</label>
          <input
            id="profile-phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={20}
            placeholder="+167890986879"
          />
          {!validity.phone && (
            <span className="input-error">
              Use an international format like +167890986879.
            </span>
          )}
        </div>
      </div>

      <div
        className="profile-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <img
          src={profilePicturePreview}
          alt="Profile Preview"
          className="profile-edit-picture-preview"
        />
        <div>Drag & drop or click to upload</div>
        <button
          type="button"
          className="profile-btn-outline small"
          onClick={() => fileInputRef.current.click()}
        >
          Upload image
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="profile-edit-actions">
        <button onClick={handleSave} disabled={saving} className="profile-btn primary">
          {saving ? "Saving..." : (
            <>
              <FiCheckCircle /> Save changes
            </>
          )}
        </button>
        <button onClick={onCancel} className="profile-btn-outline">
          Cancel
        </button>
      </div>
    </div>
  );
}

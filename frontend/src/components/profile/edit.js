//src/components/profile/edit.js 
import React, { useState, useRef, useContext } from "react";
import axios from "axios";
import avatar from "../../images/avatar.png";
import AuthContext from "../../context/authContext";

function isValidPhone(phone) {
  return !phone || /^(\+?\d{10,15})$/.test(phone);
}

export default function ProfileEditForm({ user, onSave, onCancel }) {
  const [name, setName] = useState(user.name || "");
  const [about, setAbout] = useState(user.about || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [location, setLocation] = useState(user.location || "");
  const [profileDoc, setProfileDoc] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    user.profilePicture
      ? (user.profilePicture.startsWith("http")
        ? user.profilePicture
        : `${process.env.REACT_APP_API_URL || "http://localhost:8000"}${user.profilePicture}`)
      : avatar
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();
  const { refreshProfile } = useContext(AuthContext);

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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    if (!isValidPhone(phone)) {
      setError("Invalid phone number. Please enter a valid international phone.");
      setSaving(false);
      return;
    }
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
    <div className="profile-edit-form">
      <h2 className="form-title">Edit Profile</h2>
      <p className="form-desc">Make your profile yours. Add a friendly photo and share something about yourself!</p>
      <div>
        <label htmlFor="profile-name">Name</label>
        <input id="profile-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} />
      </div>
      <div>
        <label htmlFor="profile-location">Location</label>
        <input id="profile-location" value={location} onChange={e => setLocation(e.target.value)} maxLength={40} />
      </div>
      <div>
        <label htmlFor="profile-about">About</label>
        <textarea id="profile-about" value={about} onChange={e => setAbout(e.target.value)} maxLength={220} />
      </div>
      <div>
        <label htmlFor="profile-phone">Phone</label>
        <input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} maxLength={25} placeholder="+254712345678" />
      </div>
      <div>
        <label>Profile Picture</label>
        <div
          className="profile-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current.click()}
          style={{ maxWidth: 220, minHeight: 120, margin: "0 auto" }}
        >
          <img
            src={profilePicturePreview}
            alt="Profile Preview"
            className="profile-edit-picture-preview"
            style={{ maxWidth: "85px", maxHeight: "85px" }}
          />
          <div style={{ fontSize: ".98rem" }}>Drag & drop image, or click to select file</div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div style={{ marginTop: "1.2rem", display: "flex", gap: 12 }}>
        <button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button onClick={onCancel} style={{ marginLeft: 10 }}>Cancel</button>
      </div>
    </div>
  );
}

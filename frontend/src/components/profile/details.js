// src/components/profile/details.js 
import React from "react";
import avatar from "../../images/avatar.png";

function initials(name) {
  if (!name) return "JD";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatMemberSince(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch {
    return "N/A";
  }
}

export default function ProfileDetailsCard({ user, onEdit }) {
  const memberSince = formatMemberSince(user.createdAt || user.created_at);
  const profilePicUrl =
    user.profilePicture && !user.profilePicture.includes("avatar.png")
      ? (user.profilePicture.startsWith("http")
          ? user.profilePicture
          : `${process.env.REACT_APP_API_URL || "http://localhost:8000"}${user.profilePicture}`)
      : avatar;

  return (
    <div className="profile-info-card">
      <div className="profile-info-card-header">
        <div className="profile-avatar-lg">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="profile" />
          ) : (
            <span className="profile-avatar-fallback">
              {initials(user.name)}
            </span>
          )}
        </div>
        <div>
          <h2 className="profile-info-title">{user.name}</h2>
          <div className="profile-info-email">{user.email}</div>
          <div className="profile-info-role">{user.role === "renter" ? (
            <span className="chip chip-green">Renter</span>
          ) : (
            <span className="chip chip-green">Landlord</span>
          )}</div>
        </div>
        <button className="profile-card-edit-btn" onClick={onEdit}>
          Edit
        </button>
      </div>
      <div className="profile-info-card-meta">
        <div>
          <span className="profile-info-meta-label">Member Since</span>
          <div>{memberSince}</div>
        </div>
        <div>
          <span className="profile-info-meta-label">Location</span>
          <div>{user.location || <i>Not set</i>}</div>
        </div>
      </div>
      <div className="profile-info-card-bio">
        <span className="profile-info-meta-label">Bio</span>
        <div>{user.about || "No bio added yet."}</div>
      </div>
    </div>
  );
}

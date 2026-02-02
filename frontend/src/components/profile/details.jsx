import React from "react";
import avatar from "../../images/avatar.png";
import { FiEdit2, FiMapPin, FiMail, FiPhone, FiLock } from "react-icons/fi";

function initials(name) {
  if (!name) return "JD";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function formatMemberSince(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  } catch {
    return "N/A";
  }
}

function maskedPhone(phone) {
  if (!phone) return "Not added";
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 4)}•••${phone.slice(-2)}`;
}

export default function ProfileDetailsCard({ user, onEdit, onChangePassword }) {
  const memberSince = formatMemberSince(user.createdAt || user.created_at);
  const profilePicUrl =
    user.profilePicture && !user.profilePicture.includes("avatar.png")
      ? (user.profilePicture.startsWith("http")
          ? user.profilePicture
          : `${import.meta.env.REACT_APP_API_URL || "http://localhost:8000"}${user.profilePicture}`)
      : avatar;

  return (
    <section className="profile-summary card-surface">
      <div className="profile-summary-grid">
        <div className="profile-summary-main">
          <div className="summary-row top">
            <div className="profile-summary-avatar">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="profile" />
              ) : (
                <span className="profile-avatar-fallback">
                  {initials(user.name)}
                </span>
              )}
            </div>
            <div className="summary-headings">
              <div className="summary-title-row">
                <div>
                  <p className="eyebrow soft">Member since {memberSince}</p>
                  <h2>{user.name || "Your profile"}</h2>
                </div>
                <button className="profile-card-edit-btn inline" onClick={onEdit}>
                  <FiEdit2 /> Edit profile
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-summary-body">
          <div>
            <span className="profile-info-meta-label">Role</span>
            <p className="profile-summary-text stacked">
              <span className="chip chip-green">{user.role === "renter" ? "Renter" : "Landlord"}</span>
            </p>
          </div>
          <div>
            <span className="profile-info-meta-label">Email</span>
            <p className="profile-summary-text stacked">
              <FiMail /> {user.email}
            </p>
          </div>
          <div>
            <span className="profile-info-meta-label">Location</span>
            <p className="profile-summary-text stacked">
              <FiMapPin /> {user.location || "Not set"}
            </p>
          </div>
          <div>
            <span className="profile-info-meta-label">Phone</span>
            <p className="profile-summary-text stacked">
              <FiPhone /> {maskedPhone(user.phone)}
            </p>
          </div>
        </div>
        <div className="profile-summary-bio">
          <span className="profile-info-meta-label">About</span>
          <p>{user.about || "No bio added yet."}</p>
        </div>
        <div className="profile-summary-footer">
          {onChangePassword && (
            <button
              className="profile-btn-outline full-width"
              onClick={onChangePassword}
            >
              <FiLock /> Change password
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

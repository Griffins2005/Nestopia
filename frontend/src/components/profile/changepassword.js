// src/components/profile/changePassword.js
import React, { useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/authContext";

export default function ChangePasswordForm({ user, onDone }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const { logout } = useContext(AuthContext);

  const getStrength = (pw) => {
    if (!pw) return "";
    if (pw.length < 8) return "Weak";
    if (/\d/.test(pw) && /[A-Z]/.test(pw) && /[a-z]/.test(pw)) return "Strong";
    return "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await axios.post(
        "/api/users/change-password",
        { current_password: current, new_password: newPass },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setMsg("✅ Password changed. Please log in again.");
      setTimeout(() => {
        logout();
      }, 1800);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to change password");
    }
    setSaving(false);
  };

  const disableSubmit =
    !current || !newPass || !confirm || saving || getStrength(newPass) === "Weak";

  return (
    <form className="profile-password-form profile-edit-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Change Password</h2>
      <p className="form-desc">Protect your account by choosing a strong password.</p>
      <div>
        <label htmlFor="current-pw">Current Password</label>
        <input id="current-pw" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="new-pw">New Password</label>
        <input id="new-pw" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
        <div className="pw-strength">
          {newPass && <span>Password Strength: {getStrength(newPass)}</span>}
        </div>
      </div>
      <div>
        <label htmlFor="confirm-pw">Confirm New Password</label>
        <input id="confirm-pw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-success">{msg}</div>}
      <div style={{ marginTop: "1.2rem", display: "flex", gap: 12 }}>
        <button type="submit" disabled={disableSubmit}>
          {saving ? "Changing..." : "Change Password"}
        </button>
        <button type="button" onClick={onDone} style={{ marginLeft: 10 }}>Cancel</button>
      </div>
    </form>
  );
}

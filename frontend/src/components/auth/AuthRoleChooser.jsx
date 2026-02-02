import React from "react";

export default function AuthRoleChooser({ role, setRole, disabled }) {
  return (
    <div className="auth-role-chooser">
      <label htmlFor="role" className="form-label">Continue as:</label>
      <select
        id="role"
        value={role}
        onChange={e => setRole(e.target.value)}
        className="form-select"
        disabled={disabled}
      >
        <option value="renter">Renter</option>
        <option value="landlord">Landlord</option>
      </select>
    </div>
  );
}

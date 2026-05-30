//src/components/auth/googleButton.js
import React from "react";
import { API_BASE_URL } from "../../api/getBaseUrl";
import endpoints from "../../api/endpoints";

export default function GoogleButton({ role, disabled }) {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}${endpoints.auth.googleLogin(role)}`;
  };

  return (
    <button type="button" onClick={handleGoogleLogin} className="btn btn-google" disabled={disabled}>
      Continue with Google
    </button>
  );
}

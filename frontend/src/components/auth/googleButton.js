//src/components/auth/googleButton.js
import React from "react";

export default function GoogleButton({ role, disabled }) {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/api/auth/google/login?role=${role}`;
  };

  return (
    <button type="button" onClick={handleGoogleLogin} className="btn btn-google" disabled={disabled}>
      Continue with Google
    </button>
  );
}

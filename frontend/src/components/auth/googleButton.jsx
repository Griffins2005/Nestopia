import React from "react";

export default function GoogleButton({ role, disabled }) {
  const handleGoogleLogin = () => {
    const baseUrl =
      import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
    window.location.href = `${baseUrl}/api/auth/google/login?role=${role}`;
  };

  return (
    <button type="button" onClick={handleGoogleLogin} className="btn btn-google" disabled={disabled}>
      Continue with Google
    </button>
  );
}

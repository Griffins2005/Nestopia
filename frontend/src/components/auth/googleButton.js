import React from "react";

export default function GoogleButton({ role }) {
  const handleGoogleLogin = () => {
    const roleParam = role ? `?role=${role}` : "";
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/api/auth/google/login${roleParam}`;
  };

  return (
    <button onClick={handleGoogleLogin} className="btn btn-google">
      Continue with Google
    </button>
  );
}

import React, { useEffect, useContext } from "react";
import AuthContext from "../context/authContext";

export default function OAuthCallback() {
  const { handleGoogleCallback } = useContext(AuthContext);

  useEffect(() => {
    handleGoogleCallback();
  }, [handleGoogleCallback]);

  return <div>Logging you in…</div>;
}

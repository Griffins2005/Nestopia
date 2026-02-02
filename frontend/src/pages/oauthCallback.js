//src/pages/oauthCallback.js
import React, { useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import AuthContext from "../context/authContext";

export default function OAuthCallback() {
  const { handleGoogleCallback } = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleGoogleCallback(token);
    }
  }, [searchParams, handleGoogleCallback]);

  return <div>Logging you in…</div>;
}

// src/context/authContext.js
import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { setUnauthorizedHandler } from "../api/axiosConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const handlingUnauthorized = useRef(false);

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const setAuthenticatedUser = useCallback((userData) => {
    setUser(userData || null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    if (handlingUnauthorized.current) return;
    handlingUnauthorized.current = true;
    clearAuth();

    const path = window.location.pathname;
    if (path !== "/login" && path !== "/signup") {
      navigate("/login", {
        replace: true,
        state: {
          from: { pathname: path },
          message: "Your session has expired. Please sign in again.",
        },
      });
    }

    setTimeout(() => {
      handlingUnauthorized.current = false;
    }, 500);
  }, [clearAuth, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const restoreSession = useCallback(async () => {
    try {
      const userRes = await api.get("/api/users/me");
      setAuthenticatedUser(userRes.data);
      return userRes.data;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, setAuthenticatedUser]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await restoreSession();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  async function signup(email, password, role, name = "") {
    await api.post("/api/auth/signup", { email, password, role, name: name || undefined });
    const userData = await restoreSession();
    if (role === 'landlord') {
      navigate('/profile');
    } else {
      navigate(`/onboarding?role=${role}`);
    }
    return userData;
  }

  async function login(email, password, role) {
    const res = await api.post("/api/auth/login", { email, password, role });
    if (res.data?.requires_2fa) {
      return {
        requires2fa: true,
        challengeToken: res.data.challenge_token,
      };
    }
    const userData = await restoreSession();
    routeAfterAuth(userData);
    return userData;
  }

  async function verify2fa(challengeToken, code) {
    await api.post("/api/auth/verify-2fa", {
      challenge_token: challengeToken,
      code,
    });
    const userData = await restoreSession();
    routeAfterAuth(userData);
    return userData;
  }

  function routeAfterAuth(userData) {
    if (!userData.renter_preferences && userData.role === "renter") {
      navigate("/onboarding?role=renter");
    } else {
      navigate(location.state?.from?.pathname || "/profile");
    }
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* cookie may already be gone */
    }
    clearAuth();
    navigate("/");
  }

  async function handleGoogleCallback() {
    const userData = await restoreSession();
    if (!userData) {
      navigate("/login", {
        state: { error: "Google sign-in did not complete. Please try again." },
      });
      return;
    }

    if (!userData.renter_preferences && userData.role === "renter") {
      navigate("/onboarding?role=renter");
    } else {
      navigate(location.state?.from?.pathname || "/profile");
    }
  }

  async function submitPreferences(preferences, role) {
    const url = role === "renter" ? "/api/preferences/renter" : "/api/preferences/landlord";
    await api.post(url, preferences);
    await restoreSession();
    navigate("/profile");
  }

  async function refreshProfile() {
    return restoreSession();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        verify2fa,
        logout,
        handleGoogleCallback,
        submitPreferences,
        refreshProfile,
        setUser: setAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

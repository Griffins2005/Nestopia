//src/context/authContext.js
// src/context/authContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const extractDetail = (error) => {
  const detail = error?.response?.data?.detail;
  if (!detail) {
    return { code: null, message: null };
  }
  if (typeof detail === "string") {
    return { code: detail, message: detail };
  }
  return { code: detail.code, message: detail.message };
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Load user from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const { token, user } = JSON.parse(stored);
      setToken(token);
      setUser({ ...user, accessToken: token });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // Axios interceptor to handle 401s globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && location.pathname !== "/login" && location.pathname !== "/signup") {
          // Only redirect if not already on auth pages
          const currentPath = location.pathname;
          navigate("/login", {
            state: {
              from: { pathname: currentPath },
              message: "Your session has expired. Please sign in again.",
            },
          });
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate, location]);

  // Util: Save auth to state + localStorage
  const saveAuth = (token, user) => {
    setToken(token);
    setUser({ ...user, accessToken: token });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("auth", JSON.stringify({ token, user }));
  };

  // Util: Clear auth from state + localStorage
  const clearAuth = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth");
  };

  // ----- SIGN UP -----
  async function signup(email, password, role) {
    const res = await axios.post("/api/auth/signup", { email, password, role });
    const { access_token } = res.data;
    const userRes = await axios.get("/api/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    saveAuth(access_token, userRes.data);
    navigate(`/onboarding?role=${role}`);
  }

  // ----- LOGIN -----
  async function login(email, password, role) {
    const res = await axios.post("/api/auth/login", { email, password, role });
    const { access_token } = res.data;
    const userRes = await axios.get("/api/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    saveAuth(access_token, userRes.data);

    if (!userRes.data.renter_preferences && userRes.data.role === "renter") {
      navigate("/onboarding?role=renter");
    } else if (!userRes.data.landlord_preferences && userRes.data.role === "landlord") {
      navigate("/onboarding?role=landlord");
    } else {
      const from = location.state?.from?.pathname || "/profile";
      navigate(from);
    }
  }

  // ----- LOGOUT -----
  function logout() {
    clearAuth();
    navigate("/");
  }

  // ----- HANDLE GOOGLE OAUTH CALLBACK -----
  async function handleGoogleCallback(tokenFromURL) {
    try {
      const userRes = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${tokenFromURL}` },
      });
      saveAuth(tokenFromURL, userRes.data);

      if (!userRes.data.renter_preferences && userRes.data.role === "renter") {
        navigate("/onboarding?role=renter");
      } else if (!userRes.data.landlord_preferences && userRes.data.role === "landlord") {
        navigate("/onboarding?role=landlord");
      } else {
        const from = location.state?.from?.pathname || "/profile";
        navigate(from);
      }
    } catch (err) {
      const detail = extractDetail(err);
      // Google tried to login but user actually created with email/password before
      if (err.response && err.response.status === 403 && detail.code === "email_only") {
        navigate("/login", {
          state: {
            error: "This account was created with email & password. Please log in using email, or sign up with Google for a new account.",
          },
        });
      } else if (err.response && err.response.status === 404) {
        navigate("/signup", {
          state: {
            error: "No account found for this Google account. Please sign up.",
          },
        });
      } else {
        throw err;
      }
    }
  }

  // ----- SUBMIT PREFERENCES (after onboarding) -----
  async function submitPreferences(preferences, role) {
    const url =
      role === "renter"
        ? "/api/preferences/renter"
        : "/api/preferences/landlord";
    await axios.post(url, preferences, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Refresh user info
    const userRes = await axios.get("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser({ ...userRes.data, accessToken: token });
    localStorage.setItem("auth", JSON.stringify({ token, user: userRes.data }));
    navigate("/profile");
  }

  // ----- REFRESH PROFILE (after editing profile info) -----
  async function refreshProfile() {
    if (!token) return;
    const userRes = await axios.get("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser({ ...userRes.data, accessToken: token });
    localStorage.setItem("auth", JSON.stringify({ token, user: userRes.data }));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        handleGoogleCallback,
        submitPreferences,
        refreshProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
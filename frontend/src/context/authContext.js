import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

axios.defaults.baseURL = "http://localhost:8000"; // Always

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const { token, user } = JSON.parse(stored);
      setToken(token);
      // Always attach accessToken to user object!
      setUser({ ...user, accessToken: token });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const saveAuth = (token, user) => {
    setToken(token);
    setUser({ ...user, accessToken: token });
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("auth", JSON.stringify({ token, user }));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth");
  };

  async function signup(email, password, role) {
    const res = await axios.post("/api/auth/signup", { email, password, role });
    const { access_token } = res.data;
    const userRes = await axios.get("/api/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    saveAuth(access_token, userRes.data);
    navigate(`/onboarding?role=${role}`);
  }

  async function login(email, password) {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
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
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 404 || err.response.status === 401)
      ) {
        navigate("/signup", {
          state: {
            error: "No account is associated with that email. Please sign up.",
            email,
          },
        });
      }
      throw err;
    }
  }

  function logout() {
    clearAuth();
    navigate("/");
  }

  async function handleGoogleCallback(tokenFromURL) {
    try {
      const userRes = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${tokenFromURL}` },
      });
      saveAuth(tokenFromURL, userRes.data);

      if (
        !userRes.data.renter_preferences &&
        userRes.data.role === "renter"
      ) {
        navigate("/onboarding?role=renter");
      } else if (
        !userRes.data.landlord_preferences &&
        userRes.data.role === "landlord"
      ) {
        navigate("/onboarding?role=landlord");
      } else {
        const from = location.state?.from?.pathname || "/profile";
        navigate(from);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        navigate("/signup", {
          state: {
            error: "No account is associated with that Google account. Please sign up.",
          },
        });
      } else {
        throw err;
      }
    }
  }

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

  // Universal profile updater (after profile edit)
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
        refreshProfile, // so ProfileEditForm can call it if desired
        setUser, // pass this for explicit updating as needed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

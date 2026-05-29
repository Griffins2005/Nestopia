import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import AuthContext from "./context/authContext";
import { NestopiaProvider, useNestopia } from "./context/NestopiaContext";

import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import Listings from "./pages/listings";
import ListingDetail from "./pages/listingDetail";
import ListingForm from "./pages/listingForm";
import Matches from "./pages/matches";
import Saved from "./pages/saved";
import Preferences from "./pages/preferences";
import Profile from "./pages/profile";
import UserProfile from "./pages/userProfile";
import OAuthCallback from "./pages/oauthCallback";
import Onboarding from "./pages/onboarding";

function Toast() {
  const { toast } = useNestopia();
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      background: "var(--ntp-green-700, #0f5f42)", color: "#fff",
      padding: "0.6rem 1.4rem", borderRadius: "2rem", fontSize: "0.95rem",
      fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      pointerEvents: "none",
    }}>
      {toast}
    </div>
  );
}

function RequireAuth({ children }) {
  const { user } = useNestopia();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppInner() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: "3rem", textAlign: "center", color: "var(--ntp-gray-500)" }}>
        Loading…
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/listing/new" element={<RequireAuth><ListingForm /></RequireAuth>} />
          <Route path="/listing/edit/:id" element={<RequireAuth><ListingForm /></RequireAuth>} />
          <Route path="/matches" element={<RequireAuth><Matches /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
          <Route path="/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/users/:id" element={<RequireAuth><UserProfile /></RequireAuth>} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NestopiaProvider>
          <AppInner />
        </NestopiaProvider>
      </AuthProvider>
    </Router>
  );
}

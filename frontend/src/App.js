import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, matchPath } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
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

const INSIGHT_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/listings",
  "/listing/new",
  "/listing/edit/:id",
  "/listing/:id",
  "/matches",
  "/saved",
  "/preferences",
  "/profile",
  "/users/:id",
  "/oauth-callback",
  "/onboarding",
];

function Insights() {
  const { pathname } = useLocation();
  const route = INSIGHT_ROUTES.find((pattern) => matchPath({ path: pattern, end: true }, pathname)) || pathname;

  return (
    <>
      <Analytics route={route} path={pathname} />
      <SpeedInsights route={route} />
    </>
  );
}

function Toast() {
  const { toast } = useNestopia();
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      background: "var(--ntp-green-700, #0f5e37)", color: "#fff",
      padding: "0.6rem 1.4rem", borderRadius: "2rem", fontSize: "0.95rem",
      fontWeight: 600, zIndex: 9999,
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
          <Insights />
        </NestopiaProvider>
      </AuthProvider>
    </Router>
  );
}

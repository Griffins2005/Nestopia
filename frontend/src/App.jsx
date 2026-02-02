import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import Home from "./pages/home";
import LoginForm from "./components/auth/loginform";
import SignupForm from "./components/auth/signupform";
import SavedListingsPage from "./components/listings/saved";
import Navbar from "./components/navbar";
import OAuthCallback from "./pages/oauthCallback";
import OnboardingPage from "./pages/onboarding";
import ProfilePage from "./pages/profile";
import ListingsPage from "./pages/listings";
import EditListingPage from "./components/listings/edit";
import ListingDetailsPage from "./components/listings/details";
import RequireAuth from "./components/RequireAuth";

function LoginWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const expired = params.get("expired") === "1";
  return <LoginForm sessionExpired={expired} />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginWrapper />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route
              path="/saved"
              element={
                <RequireAuth>
                  <SavedListingsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/listing/edit/:id"
              element={
                <RequireAuth>
                  <EditListingPage />
                </RequireAuth>
              }
            />
            <Route path="/listing/:id" element={<ListingDetailsPage />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <OnboardingPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

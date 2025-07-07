import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation} from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import Home from "./pages/home";
import LoginForm from "./components/auth/loginform";
import SignupForm from "./components/auth/signupform";
import ChatPage from "./pages/chatPage";
import SavedListingsPage from "./components/listings/saved";
import PaymentSuccess from "./pages/paymentSucess";
import WalletConnect from "./components/wallet/connect";
import PaymentButton from "./components/payments/paymentButton";
import Navbar from "./components/navbar";
import OAuthCallback from "./pages/oauthCallback";
import OnboardingPage from "./pages/onboarding";
import ProfilePage from "./pages/profile";
import ListingsPage from "./pages/listings";
import EditListingPage from "./components/listings/edit";
import ListingDetailsPage from "./components/listings/details";

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
            <Route path="/saved" element={<SavedListingsPage/>} />
            <Route path="/listing/edit/:id" element={<EditListingPage />} />
            <Route path="/listing/edit/:id" element={<EditListingPage />} />
            <Route path="/listing/:id" element={<ListingDetailsPage />} />
            <Route path="/chat" element={<ChatPage /> }/>
            <Route path="/wallet" element={<WalletConnect /> }/>
            <Route path="/profile" element={ <ProfilePage /> }/>
            <Route path="/pay" element={ <PaymentButton />}/>
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

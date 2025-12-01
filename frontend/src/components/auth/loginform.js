// src/components/auth/loginform.js
import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../../context/authContext";
import AuthRoleChooser from "./AuthRoleChooser";
import GoogleButton from "./googleButton";
import { FiEye, FiEyeOff } from "react-icons/fi";

const authClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

const NETWORK_ERROR_MESSAGE =
  "We couldn’t reach Nestopia right now. Check your internet connection or make sure the server at http://localhost:8000 is running.";

const parseDetail = (error) => {
  if (!error?.response || error.code === "ERR_NETWORK") {
    return { code: "network_error", message: NETWORK_ERROR_MESSAGE };
  }
  const detail = error.response.data?.detail;
  if (!detail) {
    return { code: null, message: error?.message || NETWORK_ERROR_MESSAGE };
  }
  if (typeof detail === "string") {
    return { code: detail, message: detail };
  }
  return { code: detail.code, message: detail.message };
};

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("expired") === "1";

  const [role, setRole] = useState(location.state?.role || "renter");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.error || location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState(location.state?.email || "");
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [issuedToken, setIssuedToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      const detail = parseDetail(err);
      if (detail.code === "google_only") {
        setError("This account was created via Google. Please log in with Google.");
      } else if (detail.code === "email_only") {
        setError("This account was created with email/password. Please log in with your email credentials.");
      } else {
        setError(detail.message || "Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  const toggleReset = () => {
    setResetOpen((prev) => !prev);
    setResetError("");
    setResetMessage("");
    if (!resetOpen && !resetEmail) {
      setResetEmail(email);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      const response = await authClient.post("/api/auth/password-reset/request", {
        email: resetEmail || email,
        role,
      });
      setResetMessage(response.data?.message || "Reset token generated.");
      setIssuedToken(response.data?.reset_token || "");
    } catch (err) {
      const detail = parseDetail(err);
      setResetError(detail.message || "Unable to generate a reset token.");
    }
    setResetLoading(false);
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    if (resetPassword !== resetPasswordConfirm) {
      setResetError("Passwords do not match.");
      return;
    }
    const tokenToUse = (resetTokenInput || issuedToken || "").trim();
    if (!tokenToUse) {
      setResetError("Enter the reset token you received via email.");
      return;
    }
    setResetLoading(true);
    try {
      const response = await authClient.post("/api/auth/password-reset/confirm", {
        token: tokenToUse,
        new_password: resetPassword,
        confirm_password: resetPasswordConfirm,
      });
      setResetMessage(response.data?.message || "Password updated. You can log in now.");
      setResetTokenInput("");
      setIssuedToken("");
      setResetPassword("");
      setResetPasswordConfirm("");
    } catch (err) {
      const detail = parseDetail(err);
      setResetError(detail.message || "Unable to reset password.");
    }
    setResetLoading(false);
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">Log In</h2>
      <AuthRoleChooser role={role} setRole={setRole} disabled={loading} />
      {sessionExpired && (
        <div className="form-error">Your session has expired. Please log in again.</div>
      )}
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="form-input-with-toggle">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              maxLength={256}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <p className="input-hint">Use at least 5 characters (max 256).</p>
        </div>
        <button type="submit" className="btn btn-primary form-button" disabled={loading}>
          Log In
        </button>
        <div className="divider">or</div>
        <GoogleButton role={role} disabled={loading} />
      </form>
      <button type="button" className="link-button reset-toggle" onClick={toggleReset}>
        {resetOpen ? "Hide password reset" : "Forgot password? Reset it"}
      </button>
      {resetOpen && (
        <div className="auth-reset-card">
          <h3 className="reset-title">Reset password</h3>
          {resetError && <div className="form-error">{resetError}</div>}
          {resetMessage && <div className="form-success">{resetMessage}</div>}
          <form onSubmit={handleResetRequest}>
            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">Account email</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                disabled={resetLoading}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-secondary form-button" disabled={resetLoading}>
              Send reset token
            </button>
          </form>
          <p className="reset-hint-text">
            We’ll email a one-time reset token to the address above. If you can’t find it, request a new token or reach out to support@nestopia.com.
          </p>
          {issuedToken && (
            <div className="reset-token-hint">
              <p className="hint-label">Reset token (shown here for local testing):</p>
              <code className="token-value">{issuedToken}</code>
            </div>
          )}
          <form onSubmit={handleResetConfirm}>
            <div className="form-group">
              <label htmlFor="reset-token" className="form-label">Enter reset token</label>
              <input
                id="reset-token"
                type="text"
                className="form-input"
                value={resetTokenInput}
                onChange={e => setResetTokenInput(e.target.value)}
                placeholder="Paste token here"
                disabled={resetLoading}
                required={!issuedToken}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-password" className="form-label">New password</label>
              <div className="form-input-with-toggle">
                <input
                  id="reset-password"
                  type={showResetPassword ? "text" : "password"}
                  className="form-input"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  maxLength={256}
                  disabled={resetLoading}
                  required
                  minLength={5}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowResetPassword((prev) => !prev)}
                  aria-label={showResetPassword ? "Hide new password" : "Show new password"}
                  disabled={resetLoading}
                >
                  {showResetPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reset-password-confirm" className="form-label">Confirm new password</label>
              <div className="form-input-with-toggle">
                <input
                  id="reset-password-confirm"
                  type={showResetConfirm ? "text" : "password"}
                  className="form-input"
                  value={resetPasswordConfirm}
                  onChange={e => setResetPasswordConfirm(e.target.value)}
                  maxLength={256}
                  disabled={resetLoading}
                  required
                  minLength={5}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowResetConfirm((prev) => !prev)}
                  aria-label={showResetConfirm ? "Hide confirm password" : "Show confirm password"}
                  disabled={resetLoading}
                >
                  {showResetConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary form-button" disabled={resetLoading}>
              Update password
            </button>
          </form>
          <p className="reset-hint-text">
            Lost the code? Tap “Send reset token” again to receive a brand new one.
          </p>
        </div>
      )}
      <p className="form-footer">
        Don’t have an account? <Link to="/signup" className="nav-link">Sign Up</Link>
      </p>
    </div>
  );
}
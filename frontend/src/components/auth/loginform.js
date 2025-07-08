// src/components/auth/loginform.js
import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import AuthRoleChooser from "./AuthRoleChooser";
import GoogleButton from "./googleButton";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("expired") === "1";

  const [role, setRole] = useState(location.state?.role || "renter");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(location.state?.error || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      const code = err.response?.data?.detail;
      if (code === "google_only") {
        setError("This account was created via Google. Please log in with Google.");
      } else if (code === "email_only") {
        setError("This account was created with email/password. Please log in with your email credentials.");
      } else {
        setError(code || "Login failed");
      }
    }
    setLoading(false);
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
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary form-button" disabled={loading}>
          Log In
        </button>
        <div className="divider">or</div>
        <GoogleButton role={role} disabled={loading} />
      </form>
      <p className="form-footer">
        Don’t have an account? <Link to="/signup" className="nav-link">Sign Up</Link>
      </p>
    </div>
  );
}
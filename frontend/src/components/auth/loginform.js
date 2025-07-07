// src/components/auth/loginform.js
import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import GoogleButton from "./googleButton";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("expired") === "1";

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(location.state?.error || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      setError(msg);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">Log In</h2>
      {sessionExpired && (
        <div className="form-error">
          Your session has expired. Please log in again.
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="divider">or</div>
          <GoogleButton />
        </div>
        <button type="submit" className="btn btn-primary form-button">Log In</button>
      </form>
      <p className="form-footer">
        Don’t have an account? <Link to="/signup" className="nav-link">Sign Up</Link>
      </p>
    </div>
  );
}

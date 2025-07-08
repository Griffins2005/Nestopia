//src/components/auth/signupform.js
import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import AuthRoleChooser from "./AuthRoleChooser";
import GoogleButton from "./googleButton";

export default function SignupForm() {
  const { signup } = useContext(AuthContext);
  const location = useLocation();

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
      await signup(email, password, role);
    } catch (err) {
      const code = err.response?.data?.detail;
      if (code === "google_only") {
        setError("This email was registered via Google. Please use 'Continue with Google' to sign in.");
      } else {
        setError(code || "Signup failed");
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">Sign Up</h2>
      <AuthRoleChooser role={role} setRole={setRole} disabled={loading} />
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
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-secondary form-button" disabled={loading}>
          Sign Up
        </button>
        <div className="divider">or</div>
        <GoogleButton role={role} disabled={loading} />
      </form>
      <p className="form-footer">
        Already have an account? <Link to="/login" className="nav-link">Log In</Link>
      </p>
    </div>
  );
}
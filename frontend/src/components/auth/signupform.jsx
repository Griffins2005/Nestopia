import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../context/authContext";
import AuthRoleChooser from "./AuthRoleChooser";
import GoogleButton from "./googleButton";
import { FiEye, FiEyeOff } from "react-icons/fi";

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

export default function SignupForm() {
  const { signup } = useContext(AuthContext);
  const location = useLocation();

  const [role, setRole] = useState(location.state?.role || "renter");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.error || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, role);
    } catch (err) {
      const detail = parseDetail(err);
      if (detail.code === "google_only") {
        setError("This email was registered via Google. Please use 'Continue with Google' to sign in.");
      } else {
        setError(detail.message || "Signup failed. Please try again.");
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
              autoComplete="new-password"
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

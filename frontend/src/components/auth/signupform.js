import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom"; // useNavigate
import AuthContext from "../../context/authContext";
import GoogleButton from "./googleButton";

export default function SignupForm() {
  const { signup } = useContext(AuthContext);
  //const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("renter");
  const [error, setError] = useState(location.state?.error || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(email, password, role);
    } catch (err) {
      const msg = err.response?.data?.detail || "Signup failed";
      setError(msg);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="form-title">Sign Up</h2>
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
          <GoogleButton role={role} />
        </div>
        <div className="form-group">
          <label htmlFor="role" className="form-label">I am a…</label>
          <select
            id="role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="renter">Renter</option>
            <option value="landlord">Landlord</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary form-button">
          Sign Up
        </button>
      </form>
      <p className="form-footer">
        Already have an account? <Link to="/login" className="nav-link">Log In</Link>
      </p>
    </div>
  );
}

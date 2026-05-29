import React, { useState, useEffect, useContext } from 'react';
import { Icon } from '../components/Icons';
import AuthContext from '../context/authContext';

export default function Login() {
  const { login, signup } = useContext(AuthContext);

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("renter");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (f, m) => {
    const e = {};
    if (m === "signup" && !f.name.trim()) e.name = "What should we call you?";
    if (!f.email.trim()) e.email = "Enter your email.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "That email looks off — check it over.";
    if (!f.password) e.password = "Enter a password.";
    else if (m === "signup" && f.password.length < 8) e.password = "Use at least 8 characters.";
    if (m === "signup" && f.confirm !== f.password) e.confirm = "Passwords don't match.";
    return e;
  };

  useEffect(() => {
    if (touched) setErrors(validate(form, mode));
  }, [form, mode]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form, mode);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError("");
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password, role);
      } else {
        await signup(form.email.trim(), form.password, role);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setApiError(detail);
      else if (detail?.message) setApiError(detail.message);
      else setApiError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const googleLogin = () => {
    window.location.href = `${apiBase}/api/auth/google/login?role=${role}`;
  };

  const fieldErr = (k) => touched && errors[k];

  return (
    <div className="auth-container">
      <h2 className="form-title">{mode === "login" ? "Welcome back" : "Create your profile"}</h2>
      <p className="form-sub">
        {mode === "login"
          ? "Sign in to see homes that already feel like yours."
          : "Tell us a little about you — we'll match you with hosts who fit."}
      </p>

      <div className="auth-role-row">
        <button type="button" className={role === "renter" ? "active" : ""} onClick={() => setRole("renter")}>I'm renting</button>
        <button type="button" className={role === "landlord" ? "active" : ""} onClick={() => setRole("landlord")}>I'm hosting</button>
      </div>

      {apiError && (
        <div className="field-error" style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "#fff0f0", borderRadius: 8 }}>
          {apiError}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }} noValidate>
        {mode === "signup" && (
          <div className={"auth-field" + (fieldErr("name") ? " has-error" : "")}>
            <label className="form-label">Full name</label>
            <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
            {fieldErr("name") && <span className="field-error">{errors.name}</span>}
          </div>
        )}
        <div className={"auth-field" + (fieldErr("email") ? " has-error" : "")}>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          {fieldErr("email") && <span className="field-error">{errors.email}</span>}
        </div>
        <div className={"auth-field" + (fieldErr("password") ? " has-error" : "")}>
          <label className="form-label">Password</label>
          <div className="pw-wrap">
            <input className="form-input" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>{showPw ? "Hide" : "Show"}</button>
          </div>
          {fieldErr("password") && <span className="field-error">{errors.password}</span>}
        </div>
        {mode === "signup" && (
          <div className={"auth-field" + (fieldErr("confirm") ? " has-error" : "")}>
            <label className="form-label">Confirm password</label>
            <input className="form-input" type={showPw ? "text" : "password"} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
            {fieldErr("confirm") && <span className="field-error">{errors.confirm}</span>}
          </div>
        )}

        <button type="submit" className="auth-btn" style={{ marginTop: "0.4rem" }} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create profile"}
        </button>
      </form>

      <div className="auth-divider">— or —</div>
      <button className="auth-btn google" onClick={googleLogin}>
        <Icon name="g" style={{ color: "#0f7c5a" }} /> Continue with Google
      </button>

      <p className="auth-footer">
        {mode === "login" ? (
          <>New to Nestopia? <span className="link" onClick={() => { setMode("signup"); setTouched(false); setApiError(""); }}>Create a profile</span></>
        ) : (
          <>Already have an account? <span className="link" onClick={() => { setMode("login"); setTouched(false); setApiError(""); }}>Sign in</span></>
        )}
      </p>
    </div>
  );
}

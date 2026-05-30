import React, { useState, useContext } from 'react';
import { Icon } from '../components/Icons';
import AuthContext from '../context/authContext';
import PasswordStrength from '../components/PasswordStrength';
import { isStrongPassword } from '../api/auth';
import { API_BASE_URL } from '../api/getBaseUrl';

export default function Login() {
  const { login, signup, verify2fa } = useContext(AuthContext);

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("renter");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const googleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login?role=${role}`;
  };

  const isRenter = role === "renter";

  const validate = (f, m) => {
    const e = {};
    if (m === "signup" && !f.name.trim()) e.name = "Enter your name.";
    if (!f.email.trim()) e.email = "Enter your email.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "Invalid email.";
    if (!f.password) e.password = "Enter a password.";
    else if (m === "signup" && !isStrongPassword(f.password)) e.password = "Password too weak.";
    if (m === "signup" && f.confirm !== f.password) e.confirm = "Passwords don't match.";
    return e;
  };

  const errors = touched ? validate(form, mode) : {};

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form, mode);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setApiError("");
    try {
      if (needs2fa) {
        await verify2fa(challengeToken, totpCode);
        return;
      }
      if (mode === "login") {
        const result = await login(form.email.trim(), form.password, role);
        if (result?.requires2fa) {
          setNeeds2fa(true);
          setChallengeToken(result.challengeToken);
          setApiError("");
          setLoading(false);
          return;
        }
      } else {
        await signup(form.email.trim(), form.password, role, form.name.trim());
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setApiError(detail);
      else if (detail?.message) setApiError(detail.message);
      else setApiError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fieldErr = (k) => touched && errors[k];

  const reset2fa = () => {
    setNeeds2fa(false);
    setChallengeToken("");
    setTotpCode("");
    setApiError("");
  };

  const title = needs2fa
    ? "Verify it's you"
    : mode === "login"
      ? "Welcome back"
      : isRenter
        ? "Sign up to rent"
        : "Sign up to host";

  const subtitle = needs2fa
    ? "Enter your 6-digit code."
    : mode === "login"
      ? isRenter
        ? "Sign in as a renter."
        : "Sign in as a host."
      : isRenter
        ? "Browse and match with listings."
        : "Publish and manage listings.";

  return (
    <div className="auth-container">
      <h2 className="form-title">{title}</h2>
      <p className="form-sub">{subtitle}</p>

      {!needs2fa && (
        <div className="auth-role-row">
          <button type="button" className={role === "renter" ? "active" : ""} onClick={() => setRole("renter")}>I'm renting</button>
          <button type="button" className={role === "landlord" ? "active" : ""} onClick={() => setRole("landlord")}>I'm hosting</button>
        </div>
      )}

      {apiError && (
        <div className="field-error auth-banner-error">
          {apiError}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }} noValidate>
        {needs2fa ? (
          <div className="auth-field">
            <label className="form-label">Authenticator code</label>
            <input
              className="form-input totp-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
            />
          </div>
        ) : (
          <>
            {mode === "signup" && (
              <div className={"auth-field" + (fieldErr("name") ? " has-error" : "")}>
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
                {fieldErr("name") && <span className="field-error">{errors.name}</span>}
              </div>
            )}
            <div className={"auth-field" + (fieldErr("email") ? " has-error" : "")}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={needs2fa} />
              {fieldErr("email") && <span className="field-error">{errors.email}</span>}
            </div>
            <div className={"auth-field" + (fieldErr("password") ? " has-error" : "")}>
              <label className="form-label">Password</label>
              <div className="pw-wrap">
                <input className="form-input" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>{showPw ? "Hide" : "Show"}</button>
              </div>
              {mode === "signup" && <PasswordStrength password={form.password} />}
              {fieldErr("password") && <span className="field-error">{errors.password}</span>}
            </div>
            {mode === "signup" && (
              <div className={"auth-field" + (fieldErr("confirm") ? " has-error" : "")}>
                <label className="form-label">Confirm password</label>
                <input className="form-input" type={showPw ? "text" : "password"} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
                {fieldErr("confirm") && <span className="field-error">{errors.confirm}</span>}
              </div>
            )}
          </>
        )}

        <button type="submit" className="auth-btn" style={{ marginTop: "0.4rem" }} disabled={loading || (needs2fa && totpCode.length < 6)}>
          {loading ? "Please wait…" : needs2fa ? "Verify" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        {needs2fa && (
          <button type="button" className="auth-btn ghost" onClick={reset2fa}>
            Back to sign in
          </button>
        )}
      </form>

      {!needs2fa && (
        <>
          <div className="auth-divider">— or —</div>
          <button className="auth-btn google" onClick={googleLogin}>
            <Icon name="g" style={{ color: "#0f7c5a" }} /> Continue with Google
          </button>

          <p className="auth-footer">
            {mode === "login" ? (
              <>New to Nestopia? <span className="link" onClick={() => { setMode("signup"); setTouched(false); setApiError(""); }}>Sign up</span></>
            ) : (
              <>Already have an account? <span className="link" onClick={() => { setMode("login"); setTouched(false); setApiError(""); }}>Sign in</span></>
            )}
          </p>
        </>
      )}
    </div>
  );
}

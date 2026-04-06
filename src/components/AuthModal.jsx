// src/components/AuthModal.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal({ initialView = "login", onClose }) {
  const [view, setView]   = useState(initialView);
  const [err, setErr]     = useState("");
  const [ok, setOk]       = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, forgotPassword } = useAuth();

  // Login
  const [lEmail, setLEmail] = useState("");
  const [lPass,  setLPass]  = useState("");

  // Register
  const [rName,  setRName]  = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rPass,  setRPass]  = useState("");

  // Forgot
  const [fEmail, setFEmail] = useState("");

  const clearMessages = () => { setErr(""); setOk(""); };

  const firebaseError = (code) => {
    const map = {
      "auth/invalid-credential":    "Wrong email or password.",
      "auth/user-not-found":        "No account with this email.",
      "auth/wrong-password":        "Wrong password.",
      "auth/email-already-in-use":  "Account with this email already exists.",
      "auth/weak-password":         "Password must be at least 6 characters.",
      "auth/invalid-email":         "Invalid email address.",
      "auth/too-many-requests":     "Too many attempts. Try again later.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  const handleLogin = async (e) => {
    e.preventDefault(); clearMessages();
    if (!lEmail || !lPass) { setErr("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(lEmail, lPass);
      onClose();
    } catch (e) { setErr(firebaseError(e.code)); }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); clearMessages();
    if (!rName || !rEmail || !rPass) { setErr("Please fill in name, email and password."); return; }
    if (rPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register(rName, rEmail, rPhone, rPass);
      setOk("✓ Account created! Welcome to NepalBite.");
      setTimeout(onClose, 1500);
    } catch (e) { setErr(firebaseError(e.code)); }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault(); clearMessages();
    if (!fEmail) { setErr("Please enter your email."); return; }
    setLoading(true);
    try {
      await forgotPassword(fEmail);
      setOk("✓ Reset email sent! Check your inbox and spam folder.");
    } catch (e) { setErr(firebaseError(e.code)); }
    setLoading(false);
  };

  const switchView = (v) => { setView(v); clearMessages(); };

  const SUBTITLES = { login: "Welcome back 🙏", register: "Join NepalBite — it's free", forgot: "Reset your password" };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-box">
        <button className="auth-close" onClick={onClose}>✕</button>
        <div className="auth-logo">Nepal<span>Bite</span></div>
        <div className="auth-sub">{SUBTITLES[view]}</div>

        {/* Tabs — only for login/register */}
        {view !== "forgot" && (
          <div className="auth-tabs">
            <button className={`auth-tab${view === "login" ? " on" : ""}`} onClick={() => switchView("login")}>Sign In</button>
            <button className={`auth-tab${view === "register" ? " on" : ""}`} onClick={() => switchView("register")}>Register</button>
          </div>
        )}

        {/* LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@email.com" value={lEmail} onChange={e => setLEmail(e.target.value)}/>
            <label className="form-label" style={{marginTop:".65rem"}}>Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={lPass} onChange={e => setLPass(e.target.value)}/>
            <button type="button" className="forgot-link" onClick={() => switchView("forgot")}>Forgot password?</button>
            {err && <div className="auth-err">{err}</div>}
            {ok  && <div className="auth-ok">{ok}</div>}
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <div className="auth-switch">No account? <span onClick={() => switchView("register")}>Register free</span></div>
          </form>
        )}

        {/* REGISTER */}
        {view === "register" && (
          <form onSubmit={handleRegister}>
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Ramesh Shrestha" value={rName} onChange={e => setRName(e.target.value)}/>
            <label className="form-label" style={{marginTop:".65rem"}}>Email</label>
            <input className="form-input" type="email" placeholder="you@email.com" value={rEmail} onChange={e => setREmail(e.target.value)}/>
            <label className="form-label" style={{marginTop:".65rem"}}>Phone (optional)</label>
            <input className="form-input" type="tel" placeholder="+977 98XXXXXXXX" value={rPhone} onChange={e => setRPhone(e.target.value)}/>
            <label className="form-label" style={{marginTop:".65rem"}}>Password (min 6 chars)</label>
            <input className="form-input" type="password" placeholder="••••••••" value={rPass} onChange={e => setRPass(e.target.value)}/>
            {err && <div className="auth-err">{err}</div>}
            {ok  && <div className="auth-ok">{ok}</div>}
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Account →"}
            </button>
            <div className="auth-switch">Already have an account? <span onClick={() => switchView("login")}>Sign In</span></div>
          </form>
        )}

        {/* FORGOT */}
        {view === "forgot" && (
          <form onSubmit={handleForgot}>
            <p className="forgot-desc">Enter your email and Firebase will send a reset link instantly.</p>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@email.com" value={fEmail} onChange={e => setFEmail(e.target.value)}/>
            {err && <div className="auth-err">{err}</div>}
            {ok  && <div className="auth-ok">{ok}</div>}
            <button className="auth-btn" type="submit" disabled={loading || !!ok}>
              {loading ? "Sending…" : ok ? "Email Sent ✓" : "Send Reset Email →"}
            </button>
            <div className="auth-switch"><span onClick={() => switchView("login")}>← Back to Sign In</span></div>
          </form>
        )}
      </div>
    </div>
  );
}

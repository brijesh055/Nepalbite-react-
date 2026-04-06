// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AuthModal from "./AuthModal";
import "./Navbar.css";

export default function Navbar() {
  const [solid, setSolid]         = useState(false);
  const [mobOpen, setMobOpen]     = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [authView, setAuthView]   = useState("login");
  const [userMenu, setUserMenu]   = useState(false);
  const { user, logout }          = useAuth();
  const { totalQty, setCartOpen } = useCart();
  const userMenuRef               = useRef(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const links = [
    { href: "#famous",  label: "Signature" },
    { href: "#menu",    label: "Menu" },
    { href: "#stories", label: "Stories" },
    { href: "#gallery", label: "Gallery" },
    { href: "#about",   label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const openAuth = (view) => { setAuthView(view); setAuthOpen(true); };

  return (
    <>
      <nav className={`navbar${solid ? " solid" : ""}`}>
        <a className="nav-logo" href="#home">Nepal<span>Bite</span></a>

        <ul className="nav-links">
          {links.map(l => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>

        <div className="nav-right">
          {user ? (
            <div className="nav-user-wrap" ref={userMenuRef}>
              <button className="nav-user-chip" onClick={() => setUserMenu(!userMenu)}>
                <span className="nav-av">
                  {(user.displayName || user.email)[0].toUpperCase()}
                </span>
                <span className="nav-uname">
                  {user.displayName || user.email.split("@")[0]}
                </span>
                <span className="nav-arrow">▾</span>
              </button>
              {userMenu && (
                <div className="user-dropdown">
                  <button onClick={() => { setUserMenu(false); openAuth("forgot"); }}>
                    🔒 Reset Password
                  </button>
                  <button onClick={() => { setUserMenu(false); logout(); }}>
                    ← Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-outline" onClick={() => openAuth("login")}>
              Sign In
            </button>
          )}

          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒
            {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
          </button>

          <button className="ham-btn" onClick={() => setMobOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`mob-nav${mobOpen ? " open" : ""}`}>
        <button className="mob-close" onClick={() => setMobOpen(false)}>✕</button>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMobOpen(false)}>
            {l.label}
          </a>
        ))}
      </div>

      {authOpen && (
        <AuthModal
          initialView={authView}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </>
  );
}

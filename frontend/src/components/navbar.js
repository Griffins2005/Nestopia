//src/components/navbar.js
import React, { useContext, useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/authContext";
import {
  FaSearch,
  FaCompass,
  FaRegHeart,
  FaUserCircle,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logo from "../images/nestopia-logo.png";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Handle search (used in both desktop and drawer)
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchRef.current.value.trim();
    if (q) {
      navigate(`/explore?q=${encodeURIComponent(q)}`);
      setDrawerOpen(false);
    }
  };

  // Navigation helpers
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    setDrawerOpen(false);
    navigate("/");
  };

  const buildAuthState = (targetPath) =>
    !user
      ? {
          from: {
            pathname: targetPath,
          },
        }
      : undefined;

  // Drawer accessibility: close on ESC or outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [drawerOpen]);

  return (
    <>
      <nav className="navbar-ntp">
        {/* Hamburger - Mobile only */}
        <button
          className="navbar-ntp-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>

        {/* LEFT: Logo */}
        <div
          className="navbar-ntp-left"
          tabIndex={0}
          onClick={() => navigate("/")}
          onKeyPress={e => e.key === "Enter" && navigate("/")}
        >
          <img
            src={logo}
            alt="Nestopia Logo"
            className="navbar-ntp-logo"
          />
          <span className="navbar-ntp-title">Nestopia</span>
        </div>

        {/* CENTER: Search Bar (desktop only) */}
        <div className="navbar-ntp-center">
          <form onSubmit={handleSearch} className="navbar-ntp-search-form" role="search">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search homes, apartments…"
              className="navbar-ntp-search"
              aria-label="Search homes or apartments"
            />
            <button type="submit" className="navbar-ntp-search-btn" aria-label="Search">
              <FaSearch />
            </button>
          </form>
        </div>

        {/* RIGHT: Action Icons (desktop only) */}
        <div className="navbar-ntp-right">
          <Link to="/listings" className="navbar-ntp-icon" title="Explore" aria-label="Explore listings">
            <FaCompass />
          </Link>
          <Link
            to={user ? "/saved" : "/login"}
            state={buildAuthState("/saved")}
            className="navbar-ntp-icon"
            title="Saved Listings"
            aria-label="Saved Listings"
          >
            <FaRegHeart />
          </Link>
          <Link
            to={user ? "/profile" : "/login"}
            state={buildAuthState("/profile")}
            className="navbar-ntp-icon"
            title={user ? "Profile" : "Login"}
            aria-label={user ? "Profile" : "Login"}
          >
            <FaUserCircle />
          </Link>
          {user && (
            <button className="navbar-ntp-logout" onClick={handleLogout} aria-label="Log out of your account" title="Logout">
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`navbar-ntp-drawer-backdrop${drawerOpen ? " open" : ""}`}></div>
      <aside
        className={`navbar-ntp-drawer${drawerOpen ? " open" : ""}`}
        ref={drawerRef}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
      >
        <button
          className="navbar-ntp-drawer-close"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <FaTimes />
        </button>
        <div className="navbar-ntp-drawer-logo" onClick={() => {navigate("/"); setDrawerOpen(false);}}>
          <img src={logo} alt="Nestopia Logo" />
          <span>Nestopia</span>
        </div>
        <form onSubmit={handleSearch} className="navbar-ntp-drawer-search">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search homes, apartments…"
            aria-label="Search homes or apartments"
          />
          <button type="submit" aria-label="Search">
            <FaSearch />
          </button>
        </form>
        <nav className="navbar-ntp-drawer-links">
          <Link to="/listings" onClick={() => setDrawerOpen(false)}>
            <FaCompass /> Explore
          </Link>
          <Link
            to={user ? "/saved" : "/login"}
            state={buildAuthState("/saved")}
            onClick={() => setDrawerOpen(false)}
          >
            <FaRegHeart /> Saved
          </Link>
          <Link
            to={user ? "/profile" : "/login"}
            state={buildAuthState("/profile")}
            onClick={() => setDrawerOpen(false)}
          >
            <FaUserCircle /> {user ? "Profile" : "Login"}
          </Link>
          {user && (
            <button className="navbar-ntp-drawer-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}

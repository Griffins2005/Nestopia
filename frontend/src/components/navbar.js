import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Icon, RegIcon } from './Icons';
import { useNestopia } from '../context/NestopiaContext';

export default function Navbar() {
  const { user, logout, flashToast } = useNestopia();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    navigate(`/listings${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const handleLogout = () => { logout(); flashToast('Signed out.'); };
  const iconCls = (path) => `navbar-ntp-icon${location.pathname === path ? ' active' : ''}`;

  return (
    <nav className="navbar-ntp">
      <div
        className="navbar-ntp-left"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/')}
      >
        <span className="navbar-ntp-logo">
          <img src="/assets/nestopia-logo.png" alt="Nestopia" />
        </span>
        <span className="navbar-ntp-title">Nestopia</span>
      </div>

      <div className="navbar-ntp-center">
        <form className="navbar-ntp-search-form" onSubmit={submit} role="search">
          <input
            className="navbar-ntp-search"
            placeholder="Search homes, apartments…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search"
          />
          <button type="submit" className="navbar-ntp-search-btn" aria-label="Search">
            <Icon name="magnifying-glass" />
          </button>
        </form>
      </div>

      <div className="navbar-ntp-right">
        <Link to="/listings" className={iconCls('/listings')} title="Explore">
          <Icon name="compass" />
        </Link>

        {(!user || user.role === 'renter') && (
          <Link to={user ? '/matches' : '/login'} className={iconCls('/matches')} title="Your matches">
            <Icon name="sparkles" />
          </Link>
        )}

        {user?.role === 'landlord' && (
          <Link to="/listing/new" className={iconCls('/listing/new')} title="Add listing">
            <Icon name="plus" />
          </Link>
        )}

        <Link to={user ? '/saved' : '/login'} className={iconCls('/saved')} title="Saved">
          <RegIcon name="heart" />
        </Link>

        <Link to={user ? '/profile' : '/login'} className={iconCls('/profile')} title={user ? 'Profile' : 'Login'}>
          <Icon name="circle-user" />
        </Link>

        {user && (
          <button className="navbar-ntp-icon logout" title="Sign out" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="sign-out" />
          </button>
        )}
      </div>
    </nav>
  );
}

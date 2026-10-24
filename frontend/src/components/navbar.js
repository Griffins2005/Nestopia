import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import { useNestopia } from '../context/NestopiaContext';

export default function Navbar() {
  const { user, logout, flashToast } = useNestopia();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); flashToast('Signed out.'); };

  const isActive = (path) => {
    if (path === '/listings') {
      return location.pathname === '/listings'
        || (location.pathname.startsWith('/listing/') && location.pathname !== '/listing/new');
    }
    return location.pathname === path;
  };

  const item = (path) => (isActive(path) ? 'is-active' : undefined);

  return (
    <nav className="navbar-ntp desk-nav">
      <div
        className="navbar-ntp-brand"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        <span className="navbar-ntp-logo">
          <img src="/assets/nestopia-logo.svg" alt="" aria-hidden="true" />
        </span>
        <span className="navbar-ntp-title">Nestopia</span>
      </div>

      <div className="desk-nav-main">
        <div className="desk-nav-links">
          <Link to="/listings" className={item('/listings')}>Explore</Link>
          {(!user || user.role === 'renter') && (
            <Link to={user ? '/matches' : '/login'} className={item('/matches')}>Your matches</Link>
          )}
          <Link to={user ? '/saved' : '/login'} className={`desk-nav-icon${isActive('/saved') ? ' is-active' : ''}`} aria-label="Saved">
            <Icon name="nav-saved" />
          </Link>
          {user?.role === 'landlord' && (
            <Link to="/listing/new" className={item('/listing/new')}>List a place</Link>
          )}
        </div>

        <div className="desk-nav-end">
          {user && (
            <button type="button" className="desk-nav-quiet" onClick={handleLogout}>Sign out</button>
          )}
          <Link
            to={user ? '/profile' : '/login'}
            className={`desk-nav-login desk-nav-icon${isActive('/profile') ? ' is-active' : ''}`}
            aria-label={user ? 'Profile' : 'Log in'}
          >
            <Icon name="nav-profile" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, isAdmin, isContributor, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          <img src="/tcet-logo.png" alt="TCET Logo" className="navbar__logo-img" />
          <div className="navbar__brand-text">
            <span className="navbar__brand-title">TCET</span>
            <span className="navbar__brand-sub">Multicon - W</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'active' : ''}`
            }
          >
            Browse Papers
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to={isAdmin ? '/admin' : '/dashboard'}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'active' : ''}`
              }
            >
              {isAdmin ? 'Admin Panel' : 'My Dashboard'}
            </NavLink>
          )}
        </nav>

        {/* Auth actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <div className="navbar__user-menu">
              <span className="navbar__user-badge">
                <span style={{ fontSize: '0.8rem' }}>{isAdmin ? '🎓' : '👤'}</span>
                <span className="navbar__user-name">{user?.name}</span>
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar__auth-btns">
              <Link to="/login" className="btn btn-primary btn-sm navbar__login-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Log In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          <Link to="/" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/search" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Browse Papers</Link>
          {isAuthenticated && (
            <Link
              to={isAdmin ? '/admin' : '/dashboard'}
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {isAdmin ? 'Admin Panel' : 'My Dashboard'}
            </Link>
          )}
          {isAuthenticated ? (
            <button className="navbar__mobile-link navbar__mobile-logout" onClick={handleLogout}>
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Log In</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardLink = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'counselor'
    ? '/counselor'
    : '/student';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">🧠</span>
          <span className="brand-name">MindBridge</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Get Help</Link>

          {user && (
            <Link to={dashboardLink} className={`nav-link ${isActive(dashboardLink) ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-info">
                <span className={`role-dot role-${user.role}`} />
                {user.name}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary btn-sm">Sign In</button>
            </Link>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
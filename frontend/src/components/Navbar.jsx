import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Only regular non-admin users show user state on the public website
  const isRegularUser = user && user.role !== 'admin' && user.username?.toLowerCase() !== 'admin';

  return (
    <nav className="navbar">
      <div className="container flex justify-between align-center">
        <Link to="/" className="navbar-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19.4C19.7314 3 20 3.26863 20 3.6V16.7143C20 17.9767 18.9767 19 17.7143 19H4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19M4 19H17.7143M8 7H16M8 11H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>BookVerse</span>
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', fontWeight: '600' }}>
          <Link to="/">Home</Link>
          <Link to="/books">Books</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/books">E-Resources</Link>
          <Link to="/">About</Link>
          <Link to="/">Contact</Link>
          <Link to="/register">Membership</Link>
          
          {isRegularUser ? (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '0.5rem' }}>Hi, {user.username}</span>
              <Link to="/dashboard" style={{ color: 'var(--accent)' }}>My Library</Link>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', marginLeft: '0.5rem' }}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

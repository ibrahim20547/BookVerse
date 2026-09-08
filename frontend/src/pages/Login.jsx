import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your username or email first to reset your password.');
    } else {
      setError('');
      setResetMessage('A password reset link has been sent to your email address (if it exists).');
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div className="text-center mb-2">
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Login to access your library account.</p>
        </div>
        
        {error && (
          <div style={{ background: '#fde8e8', color: '#9b1c1c', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        {resetMessage && (
          <div style={{ background: '#e6f4ea', color: '#1e4b2e', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: '500' }}>
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter your username or email"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group mb-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              className="form-control mt-1" 
              placeholder="Enter your password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary mt-2" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>Login</button>
        </form>
        
        <div className="text-center mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: '600' }}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

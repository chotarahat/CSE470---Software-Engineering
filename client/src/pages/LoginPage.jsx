import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'counselor' ? '/counselor' : '/student';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let u;
      if (mode === 'login') {
        u = await login(form.email, form.password);
      } else {
        u = await register(form.name, form.email, form.password);
      }
      const dest = u.role === 'admin' ? '/admin' : u.role === 'counselor' ? '/counselor' : '/student';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <span className="login-logo">🧠</span>
          <h2>Ventify</h2>
          <p>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <p>No account? <button className="link-btn" onClick={() => { setMode('register'); setError(''); }}>Register here</button></p>
          ) : (
            <p>Already have one? <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
          )}
        </div>

        <div className="alert alert-info" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
          Students can submit tickets without signing in. Sign in only if you're a counselor or admin.
        </div>
      </div>
    </div>
  );
}

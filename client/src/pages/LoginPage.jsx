import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyMFA } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login, register,setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [mfaStep,setMfaStep]=useState(false);
  const [mfaToken,setMfaToken]=useState('');
  const [tempUserId,setTempUserId]=useState(null);
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
      if (mode === 'login') {
        const res=await login(form.email,form.password);
        if (res.mfaRequired){
          setMfaStep(true);
          setTempUserId(res.userId);
          setLoading(false);
          return;
        }
      } else {
          await register(form.name, form.email, form.password);
      }
      // const dest = u.role === 'admin' ? '/admin' : u.role === 'counselor' ? '/counselor' : '/student';
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication Failed');
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) =>{
    e.preventDefault();
    setError('');
    setLoading(true);
    try{
      const res=await verifyMFA({userId:tempUserId,token:mfaToken});
      localStorage.setItem('token',res.data.token);
      setUser(res.data);
      const dest = res.data.role==='admin' ? '/admin':'/counselor';
      navigate(dest);
    }catch(err){
      setError(err.response?.data?.message|| 'Invalid 2FA code');
      setLoading(false);
    }
  };
  if(mfaStep){
    return (
      <div className="page login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <form className="card" onSubmit={handleMfaSubmit} style={{ maxWidth: '400px', width: '100%' }}>
          <h2>Security Verification</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Please enter the 6-digit code from your Authenticator app.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <input
              type="text"
              placeholder="000000"
              maxLength="6"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              required
              style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Login'}
          </button>
        </form>
      </div>
    );
  }

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

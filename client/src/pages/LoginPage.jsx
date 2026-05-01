import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyMFA, resetPassword } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login, register,setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forget'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // We will create this API endpoint next
      await resetPassword(form.email, form.password); 
      alert("Password changed successfully! You can now log in.");
      setMode('login'); // Switch back to login view
      setForm({ ...form, password: '' }); // Clear the password field
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
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
    <div className="page login-page" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
        </h2>
        
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={mode === 'forgot' ? handleResetPassword : handleSubmit}>
          
          {/* ── NAME FIELD (Only for Register) ── */}
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Dr. Jane Doe or Anonymous"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}

          {/* ── EMAIL FIELD (For All Modes) ── */}
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

          {/* ── PASSWORD FIELD (For Login & Register) ── */}
          {mode !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    className="link-btn" 
                    style={{ fontSize: '0.75rem' }} 
                    onClick={() => { setMode('forgot'); setError(''); }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {/* ── NEW PASSWORD FIELD (Only for Forgot Password) ── */}
          {mode === 'forgot' && (
            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength="6"
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Please wait...' : 
             mode === 'login' ? 'Sign In' : 
             mode === 'register' ? 'Create Account' : 
             'Change Password'}
          </button>
        </form>

        {/* ── BOTTOM SWITCH LINKS ── */}
        <div className="login-switch" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <p>No account? <button className="link-btn" onClick={() => { setMode('register'); setError(''); }}>Register here</button></p>
          ) : mode === 'register' ? (
            <p>Already have one? <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
          ) : (
            <p>Remembered your password? <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Back to Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
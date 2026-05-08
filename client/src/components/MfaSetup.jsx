import React, { useState } from 'react';
import api from '../services/api'; // Changed this line to import the default api instance

export default function MfaSetup() {
  const [step, setStep] = useState(1); 
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to get headers safely
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      // Send the request directly with the auth headers attached
      const res = await api.post('/users/generate-mfa', {}, getAuthHeaders());
      
      const qrUrl = res.data ? res.data.qrCodeUrl : res.qrCodeUrl;
      setQrCodeUrl(qrUrl);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Send the request directly with the payload AND the auth headers attached
      await api.post('/users/enable-mfa', { token: mfaToken }, getAuthHeaders());
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'green' }}>
        <h3 style={{ color: 'green' }}>✅ 2FA Successfully Enabled</h3>
        <p>Your account is now secured with Microsoft Authenticator.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {step === 1 && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h3>Two-Factor Authentication</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Secure your counselor account by requiring a 6-digit code from the Authenticator app every time you log in.
          </p>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
            {loading ? 'Generating...' : 'Set Up 2FA'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p><strong>1. Scan this QR Code</strong> using your Microsoft Authenticator app.</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px' }} />
            ) : (
                <div className="spinner" />
            )}
          </div>
          
          <p><strong>2. Enter the 6-digit code</strong> the app generates below to verify setup.</p>
          <form onSubmit={handleEnable} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="000000"
              maxLength="6"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              required
              style={{ flex: 1, fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.25rem' }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </form>
          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
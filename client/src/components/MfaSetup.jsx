import React, { useState } from 'react';
import { generateMFA, enableMFA } from '../services/api';

export default function MfaSetup() {
  const [step, setStep] = useState(1); // 1: Start, 2: Scan QR, 3: Success
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateMFA();
      setQrCodeUrl(res.data.qrCodeUrl);
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
      await enableMFA({ token: mfaToken });
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
        <h3 style={{ color: 'green' }}>✅ 2FA Successfully Enabled!</h3>
        <p>Your account is now secured. You will be prompted for a code on your next login.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Two-Factor Authentication (2FA)</h2>
      
      {error && <div className="alert alert-error" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {step === 1 && (
        <div>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Secure your counselor account by requiring a 6-digit code from the Google Authenticator app every time you log in.
          </p>
          <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
            {loading ? 'Generating...' : 'Set Up 2FA'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p><strong>1. Scan this QR Code</strong> using your Google Authenticator app.</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            <img src={qrCodeUrl} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px' }} />
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
        </div>
      )}
    </div>
  );
}
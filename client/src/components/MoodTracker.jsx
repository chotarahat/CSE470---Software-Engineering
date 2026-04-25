import React, { useState, useEffect } from 'react';

export default function MoodTracker() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // 1. Keep Device ID in localStorage so their backend history is preserved
  const getDeviceId = () => {
    let id = localStorage.getItem('ventify_device_id');
    if (!id) {
      id = window.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem('ventify_device_id', id);
    }
    return id;
  };

  // 2. 🚀 FIX: Use sessionStorage so it pops up every new session/sign-in
  useEffect(() => {
    const hasLoggedThisSession = sessionStorage.getItem('ventify_session_logged');
    if (!hasLoggedThisSession) {
      setHasLoggedToday(false);
      // Wait 1.5 seconds after page load before showing the popup
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleMoodSubmit = async (score, emotionTag) => {
    setLoading(true);
    const deviceId = getDeviceId();

    try {
      const response = await fetch('http://localhost:5000/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, score, emotionTag }),
      });

      if (response.ok || response.status === 201) {
        // 3. 🚀 FIX: Save the completion flag to sessionStorage
        sessionStorage.setItem('ventify_session_logged', 'true');
        setShowThankYou(true);
        
        // Show the thank you message for 2 seconds, then close the popup entirely
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to log mood", error);
    } finally {
      setLoading(false);
    }
  };

  // If they already logged this session, or closed the popup, render nothing!
  if (!isVisible || hasLoggedToday) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        
        {/* Close Button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            // Optional: If they click 'X', count it as 'seen' for this session so it doesn't annoy them on every page click
            sessionStorage.setItem('ventify_session_logged', 'true'); 
          }} 
          style={styles.closeBtn}
          title="Dismiss"
        >
          ✕
        </button>

        {showThankYou ? (
          <div style={{ padding: '2rem 1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Thanks for checking in! 🌟</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Have a great day.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>How are you feeling right now?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your check-in is 100% anonymous.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { score: 1, tag: 'overwhelmed', emoji: '😫', label: 'Overwhelmed' },
                { score: 2, tag: 'sad',         emoji: '😔', label: 'Sad' },
                { score: 3, tag: 'neutral',     emoji: '😐', label: 'Neutral' },
                { score: 4, tag: 'content',     emoji: '🙂', label: 'Content' },
                { score: 5, tag: 'happy',       emoji: '😊', label: 'Happy' },
              ].map((mood) => (
                <button
                  key={mood.score}
                  onClick={() => handleMoodSubmit(mood.score, mood.tag)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    minWidth: '80px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ fontSize: '2rem' }}>{mood.emoji}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline styles for the Overlay Popup
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    position: 'relative',
    backgroundColor: 'var(--bg-card)',
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '550px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '1px solid var(--border)'
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '15px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.2rem',
    cursor: 'pointer',
  }
};
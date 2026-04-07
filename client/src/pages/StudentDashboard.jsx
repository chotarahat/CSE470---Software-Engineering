import React, { useState, useEffect } from 'react';
import { trackTicket } from '../services/api';
import TicketForm from '../components/TicketForm';
import TicketChat from '../components/TicketChat';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const [tab, setTab] = useState('submit'); // 'submit', 'track', 'chat'
  
  // State for newly submitted ticket success screen
  const [newTicketData, setNewTicketData] = useState(null);
  
  // State for tracking an existing ticket
  const [trackForm, setTrackForm] = useState({ ticketId: '', token: '' });
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);

  // When a ticket is successfully submitted from the TicketForm component
  const handleTicketSubmitSuccess = (data) => {
    setNewTicketData(data);
    
    // Auto-fill the tracking form so they can easily check it later
    setTrackForm({ ticketId: data.ticketId, token: data.anonymousToken });
    setTab('track');
    
    // Save to local storage for convenience (optional, but good UX)
    const saved = JSON.parse(localStorage.getItem('savedTickets') || '[]');
    saved.push({ ticketId: data.ticketId, token: data.anonymousToken, date: new Date().toISOString() });
    localStorage.setItem('savedTickets', JSON.stringify(saved));
  };

  // Handle tracking an existing ticket
  const handleTrackSubmit = async (e) => {
    e?.preventDefault();
    if (!trackForm.ticketId || !trackForm.token) {
      return setTrackError('Please provide both Ticket ID and Token.');
    }
    
    setTrackingLoading(true);
    setTrackError('');
    setTrackedTicket(null);
    
    try {
      const res = await trackTicket(trackForm.ticketId, trackForm.token);
      setTrackedTicket(res.data);
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Could not find ticket. Check your ID and Token.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // Load a saved ticket from local storage
  const loadSavedTicket = (ticketId, token) => {
    setTrackForm({ ticketId, token });
    // Small timeout to allow state to update before fetching
    setTimeout(() => handleTrackSubmit(), 0); 
  };

  return (
    <div className="page student-dashboard">
      <div className="dashboard-header">
        <h1>Student Support Portal</h1>
        <p>Get help securely and completely anonymously.</p>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
          📝 Submit Ticket
        </button>
        <button className={`tab-btn ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>
          🔍 Track Status
        </button>
        {trackedTicket && (
          <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            💬 Active Chat
          </button>
        )}
      </div>

      {/* ── SUBMIT TAB ── */}
      {tab === 'submit' && (
        <div className="tab-panel card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Describe Your Concern</h2>
          <TicketForm onSuccess={handleTicketSubmitSuccess} />
        </div>
      )}

      {/* ── TRACK TAB ── */}
      {tab === 'track' && (
        <div className="tab-panel grid-2">
          
          {/* Tracking Form */}
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Track Existing Ticket</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Enter your Ticket ID and anonymous token to view status and counselor replies.
            </p>
            
            {trackError && <div className="alert alert-error">{trackError}</div>}
            
            <form onSubmit={handleTrackSubmit}>
              <div className="form-group">
                <label>Ticket ID (e.g. TKT-ABC123)</label>
                <input 
                  type="text" 
                  placeholder="TKT-" 
                  value={trackForm.ticketId} 
                  onChange={(e) => setTrackForm({ ...trackForm, ticketId: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Anonymous Token</label>
                <input 
                  type="text" 
                  placeholder="Paste your long secure token here" 
                  value={trackForm.token} 
                  onChange={(e) => setTrackForm({ ...trackForm, token: e.target.value })}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={trackingLoading}>
                {trackingLoading ? 'Searching...' : 'Check Status'}
              </button>
            </form>

            {/* Success screen showing the new token (Only shows right after submission) */}
            {newTicketData && newTicketData.ticketId === trackForm.ticketId && (
              <div className="token-box" style={{ marginTop: '2rem', borderColor: 'var(--accent)' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  ✅ Ticket Submitted Successfully!
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Please save this token. It is the <strong>only</strong> way to access your ticket replies.
                </p>
                <div className="token-row">
                  <span className="token-label">Your Ticket ID</span>
                  <span className="token-value">{newTicketData.ticketId}</span>
                </div>
                <div className="token-row">
                  <span className="token-label">Your Secure Token</span>
                  <span className="token-value token-long">{newTicketData.anonymousToken}</span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Details Panel (Shows when a ticket is successfully tracked) */}
          {trackedTicket ? (
            <div className="card" style={{ borderColor: 'var(--accent-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2>Ticket Details</h2>
                <span className={`badge badge-${trackedTicket.status === 'resolved' || trackedTicket.status === 'closed' ? 'resolved' : 'open'}`}>
                  {trackedTicket.status.toUpperCase()}
                </span>
              </div>
              
              <div className="ticket-info-grid">
                <div>
                  <span className="info-label">Category</span>
                  <span>{trackedTicket.category?.name || 'Uncategorized'}</span>
                </div>
                <div>
                  <span className="info-label">Priority</span>
                  <span className={`badge badge-${trackedTicket.priority}`}>{trackedTicket.priority}</span>
                </div>
                <div style={{ gridColumn: '1 / -1', margin: '0.5rem 0', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <span className="info-label" style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>Matched Specialist</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎓</span>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {trackedTicket.assignedCounselor || 'System Assigning...'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Verified Professional
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <span className='info-label'>Submitted On</span>
                  <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                </div>

                {/* <div>
                  <span className="info-label">Counselor</span>
                  <span style={{ fontWeight: '500' }}>{trackedTicket.assignedCounselor}</span>
                </div>
  
                <div style={{gridColumn:'1/-1',marginTop:'0.5rem',borderTop:'1px dashed var(--border)',paddingTop:'0.5rem'}}>
                  <span className='info-label'>Matched Specialist</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎓</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                      {trackedTicket.assignedCounselor || 'General Support assigned'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="info-label">Priority</span>
                  <span className={`badge badge-${trackedTicket.priority}`}>{trackedTicket.priority}</span>
                </div>
                <div>
                  <span className="info-label">Submitted</span>
                  <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                </div> */}
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <span className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {trackedTicket.description}
                </p>
              </div>

              <button 
                className="btn btn-secondary btn-full" 
                style={{ marginTop: '2rem' }}
                onClick={() => setTab('chat')}
              >
                Open Conversation Window
              </button>
            </div>
          ) : (
            <SavedTicketsPanel onLoadTicket={loadSavedTicket} />
          )}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && trackedTicket && (
        <div className="tab-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Conversation with {trackedTicket.assignedCounselor}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setTab('track')}>← Back to Details</button>
          </div>
          <TicketChat 
            ticket={trackedTicket} 
            anonymousToken={trackForm.token} 
          />
        </div>
      )}
    </div>
  );
}

// Sub-component to show recent tickets saved to localStorage
function SavedTicketsPanel({ onLoadTicket }) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('savedTickets') || '[]');
    setSaved(data.reverse().slice(0, 5)); // Show last 5
  }, []);

  if (saved.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>Your recent tickets will appear here.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Recent Tickets (This Browser)</h3>
      {saved.map((t, i) => (
        <div key={i} className="saved-ticket-row card" style={{ padding: '0.75rem', background: 'var(--bg-surface)' }}>
          <div className="saved-ticket-info">
            <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{t.ticketId}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleString()}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onLoadTicket(t.ticketId, t.token)}>
            Load
          </button>
        </div>
      ))}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
        Note: Clearing your browser data will clear this history. Always save your token elsewhere!
      </p>
    </div>
  );
}
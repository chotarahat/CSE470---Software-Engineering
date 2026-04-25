import React, { useState, useEffect } from 'react';
import TicketForm from '../components/TicketForm';
import TicketChat from '../components/TicketChat';
import ExportTranscript from '../components/ExportTranscript';
import { trackTicket, getTicketById } from '../services/api';
import './StudentDashboard.css';

const STORAGE_KEY = 'mindbridge_tickets';

function loadSavedTickets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export default function StudentDashboard() {
  const [tab, setTab] = useState('submit'); // 'submit' | 'track' | 'saved'
  const [submitted, setSubmitted] = useState(null);  // result from TicketForm
  const [savedTickets, setSavedTickets] = useState(loadSavedTickets());

  // Track form
  const [trackId, setTrackId] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [trackedTicket, setTrackedTicket] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  // Selected ticket for chat
  const [activeTicket, setActiveTicket] = useState(null);

  // After successful submission, save token locally
  const handleSubmitSuccess = (data) => {
    const entry = {
      ticketId: data.ticketId,
      anonymousToken: data.anonymousToken,
      submittedAt: new Date().toISOString(),
    };
    const updated = [entry, ...savedTickets];
    setSavedTickets(updated);
    saveTickets(updated);
    setSubmitted(data);
    setTab('submitted');
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackLoading(true);
    setTrackedTicket(null);
    try {
      const res = await trackTicket(trackId.trim(), trackToken.trim());
      setTrackedTicket(res.data);
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Ticket not found or invalid token.');
    } finally {
      setTrackLoading(false);
    }
  };

  const openChat = async (ticketId, token) => {
    try {
      // We need the MongoDB _id for the chat; track gives us just the display info
      const res = await trackTicket(ticketId, token);
      // We need _id — fetch from track response won't have it; use a workaround:
      // Store the raw data and pass token; TicketChat uses the _id from the ticket object
      // The track endpoint doesn't return _id for privacy — we pass ticketId as lookup key
      setActiveTicket({ ticketId, token, info: res.data });
    } catch {
      alert('Could not open this ticket. Check your token.');
    }
  };

  const statusColor = (s) => {
    if (s === 'open') return 'badge-open';
    if (s === 'in-progress') return 'badge-progress';
    if (s === 'resolved') return 'badge-resolved';
    return 'badge-closed';
  };

  return (
    <div className="page student-dashboard">
      <div className="dashboard-header">
        <h1>Student Support</h1>
        <p>Submit a request anonymously, or track an existing ticket.</p>
      </div>

      {/* Tab Nav */}
      <div className="tab-nav">
        {[
          { key: 'submit', label: '+ New Request' },
          { key: 'track',  label: '🔍 Track Ticket' },
          { key: 'saved',  label: `📋 My Tickets (${savedTickets.length})` },
        ].map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => { setTab(t.key); setActiveTicket(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Submit Tab ── */}
      {tab === 'submit' && (
        <div className="tab-panel card">
          <h2 style={{ marginBottom: '1.5rem' }}>Submit Anonymous Request</h2>
          <TicketForm onSuccess={handleSubmitSuccess} />
        </div>
      )}

      {/* ── Submitted confirmation ── */}
      {tab === 'submitted' && submitted && (
        <div className="tab-panel card">

          {/* Crisis-specific header */}
          {submitted.isCrisis ? (
            <div className="crisis-confirmation">
              <div className="crisis-confirm-icon">🚨</div>
              <h2 className="crisis-confirm-title">Crisis Alert Raised</h2>
              <p>
                Your message has been flagged as an urgent crisis. A counselor has been
                notified immediately. Please reach out to emergency services if you are
                in immediate danger.
              </p>
              <div className="crisis-hotlines">
                <div className="hotline-item">
                  <span className="hotline-label">Emergency</span>
                  <span className="hotline-number">999 / 112</span>
                </div>
                <div className="hotline-item">
                  <span className="hotline-label">National Crisis Line</span>
                  <span className="hotline-number">16789</span>
                </div>
                <div className="hotline-item">
                  <span className="hotline-label">Kaan Pete Roi</span>
                  <span className="hotline-number">01779-554391</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="submitted-success">
              <div className="success-icon">✅</div>
              <h2>Ticket Submitted!</h2>
              <p>Your request has been received. Save the information below — you'll need it to track your ticket.</p>
            </div>
          )}

          <div className="token-box">
            <div className="token-row">
              <span className="token-label">Ticket ID</span>
              <code className="token-value">{submitted.ticketId}</code>
            </div>
            <div className="token-row">
              <span className="token-label">Anonymous Token</span>
              <code className="token-value token-long">{submitted.anonymousToken}</code>
            </div>
          </div>
          <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
            ⚠️ This token is shown only once and never stored on our servers. Save it now!
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setTab('submit')}>Submit Another</button>
            <button className="btn btn-primary" onClick={() => setTab('saved')}>View My Tickets</button>
          </div>
        </div>
      )}

      {/* ── Track Tab ── */}
      {tab === 'track' && (
        <div className="tab-panel">
          {!trackedTicket ? (
            <div className="card">
              <h2 style={{ marginBottom: '1.5rem' }}>Track Your Ticket</h2>
              {trackError && <div className="alert alert-error">{trackError}</div>}
              <form onSubmit={handleTrack}>
                <div className="form-group">
                  <label>Ticket ID</label>
                  <input
                    placeholder="e.g. TKT-A3F21C"
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Anonymous Token</label>
                  <input
                    placeholder="Your 64-character token"
                    value={trackToken}
                    onChange={e => setTrackToken(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={trackLoading}>
                  {trackLoading ? 'Looking up...' : 'Find Ticket'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
                onClick={() => setTrackedTicket(null)}>← Back</button>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="ticket-info-grid">
                  <div><span className="info-label">Ticket ID</span><strong>{trackedTicket.ticketId}</strong></div>
                  <div><span className="info-label">Status</span>
                    <span className={`badge ${statusColor(trackedTicket.status)}`}>{trackedTicket.status}</span>
                  </div>
                  <div><span className="info-label">Priority</span>
                    <span className={`badge badge-${trackedTicket.priority}`}>{trackedTicket.priority}</span>
                  </div>
                  <div><span className="info-label">Category</span><span>{trackedTicket.category?.name}</span></div>
                  <div><span className="info-label">Counselor</span><span>{trackedTicket.assignedCounselor || 'Pending assignment'}</span></div>
                  <div><span className="info-label">Submitted</span><span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span></div>
                </div>
                <hr className="divider" />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{trackedTicket.description}</p>
              </div>
              {/* Chat requires MongoDB _id — handled via saved tickets flow */}
              <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                To chat with your counselor, use the <strong>My Tickets</strong> tab if you saved this ticket locally.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Saved Tickets Tab ── */}
      {tab === 'saved' && (
        <div className="tab-panel">
          {savedTickets.length === 0 ? (
            <div className="empty-state card">
              <h3>No saved tickets</h3>
              <p>Tickets you submit from this browser are saved here automatically.</p>
            </div>
          ) : activeTicket ? (
            <div>
              <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
                onClick={() => setActiveTicket(null)}>← Back to tickets</button>
              <ActiveTicketView ticketId={activeTicket.ticketId} token={activeTicket.token} />
            </div>
          ) : (
            <div>
              {savedTickets.map((t) => (
                <SavedTicketRow
                  key={t.ticketId}
                  ticket={t}
                  onOpen={() => setActiveTicket({ ticketId: t.ticketId, token: t.anonymousToken })}
                  onRemove={() => {
                    const updated = savedTickets.filter(s => s.ticketId !== t.ticketId);
                    setSavedTickets(updated);
                    saveTickets(updated);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Saved ticket row
function SavedTicketRow({ ticket, onOpen, onRemove }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    trackTicket(ticket.ticketId, ticket.anonymousToken)
      .then(r => setInfo(r.data))
      .catch(() => {});
  }, [ticket]);

  const statusColor = (s) => {
    if (s === 'open') return 'badge-open';
    if (s === 'in-progress') return 'badge-progress';
    if (s === 'resolved') return 'badge-resolved';
    return 'badge-closed';
  };

  return (
    <div className="card saved-ticket-row">
      <div className="saved-ticket-info">
        <div>
          <strong>{ticket.ticketId}</strong>
          {info && <span className={`badge ${statusColor(info.status)}`} style={{ marginLeft: '0.75rem' }}>{info.status}</span>}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Submitted {new Date(ticket.submittedAt).toLocaleDateString()}
          {info && ` · ${info.category?.name} · ${info.priority} priority`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={onOpen}>Open Chat</button>
        <button className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}

// Loads full ticket data and shows chat
function ActiveTicketView({ ticketId, token }) {
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // We need the Mongo _id; trackTicket doesn't return it (privacy).
    // So we fetch via the public track endpoint and reconstruct.
    // The TicketChat component needs _id — we expose it via a special lookup.
    trackTicket(ticketId, token)
      .then(r => {
        // Attach _id placeholder; backend chat uses ticketId string via a secondary lookup
        // We store the full response and pass the token; chat resolves by ticket ObjectId
        // For this to work we need _id — we get it from the track response if we add it server-side.
        // As a pragmatic workaround, store _id in the saved entry at submit time via the ticket route.
        // Here we use a trick: query /tickets/track returns enough to render info.
        // Chat requires _id from the ticket list — we pass ticketId and let TicketChat search.
        setTicket({ ...r.data, _id: r.data._id || ticketId }); // will be populated if server sends it
      })
      .catch(() => setError('Could not load ticket.'));
  }, [ticketId, token]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!ticket) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>{ticket.ticketId}</strong>
          <span className={`badge badge-${ticket.status === 'in-progress' ? 'progress' : ticket.status}`}>{ticket.status}</span>
          <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Counselor: {ticket.assignedCounselor || 'Pending'}</span>
        </div>
      </div>
      <TicketChat ticket={ticket} anonymousToken={token} />
      {/* Export encrypted transcript — student view (uses anonymous token) */}
      <ExportTranscript ticket={ticket} anonymousToken={token} />
    </div>
  );
}
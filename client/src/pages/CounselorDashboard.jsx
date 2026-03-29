import React, { useState, useEffect } from 'react';
import { getTickets, updateTicketStatus, toggleAvailability, acknowledgeCrisis } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TicketChat from '../components/TicketChat';
import './CounselorDashboard.css';

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [available, setAvailable]     = useState(user?.availability ?? true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ackLoading, setAckLoading]   = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      setTickets(res.data);
    } catch {/* silent */}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleToggle = async () => {
    try {
      const res = await toggleAvailability();
      setAvailable(res.data.availability);
    } catch {/* silent */}
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await updateTicketStatus(ticketId, status);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status } : t));
      if (activeTicket?._id === ticketId) setActiveTicket(prev => ({ ...prev, status }));
    } catch {/* silent */}
  };

  // Counselor acknowledges they have seen the crisis alert
  const handleAcknowledgeCrisis = async (ticketId) => {
    setAckLoading(true);
    try {
      await acknowledgeCrisis(ticketId);
      setTickets(prev =>
        prev.map(t => t._id === ticketId
          ? { ...t, crisisAcknowledged: true, crisisAcknowledgedAt: new Date().toISOString() }
          : t
        )
      );
      setActiveTicket(prev =>
        prev?._id === ticketId
          ? { ...prev, crisisAcknowledged: true, crisisAcknowledgedAt: new Date().toISOString() }
          : prev
      );
    } catch {/* silent */}
    finally { setAckLoading(false); }
  };

  // Crisis tickets float to the top of the list
  const sortedTickets = [...tickets].sort((a, b) => {
    if (a.isCrisis && !a.crisisAcknowledged && !(b.isCrisis && !b.crisisAcknowledged)) return -1;
    if (b.isCrisis && !b.crisisAcknowledged && !(a.isCrisis && !a.crisisAcknowledged)) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filtered = statusFilter === 'all'
    ? sortedTickets
    : sortedTickets.filter(t => t.status === statusFilter);

  const unacknowledgedCrisisCount = tickets.filter(t => t.isCrisis && !t.crisisAcknowledged).length;

  const statusBadge = (s) => {
    const map = {
      open: 'badge-open', assigned: 'badge-open',
      'in-progress': 'badge-progress', responded: 'badge-progress',
      resolved: 'badge-resolved', closed: 'badge-closed',
    };
    return map[s] || 'badge-closed';
  };

  return (
    <div className="page counselor-dashboard">

      {/* ── Crisis Alert Banner — shown at the very top if unacknowledged crises exist ── */}
      {unacknowledgedCrisisCount > 0 && (
        <div className="crisis-alert-banner">
          <div className="crisis-alert-left">
            <span className="crisis-alert-pulse" />
            <span className="crisis-alert-icon">🚨</span>
            <div>
              <strong>
                {unacknowledgedCrisisCount} Unacknowledged Crisis{unacknowledgedCrisisCount > 1 ? ' Alerts' : ' Alert'}
              </strong>
              <p>
                Crisis tickets are pinned at the top of your queue.
                Please respond immediately and acknowledge each alert.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="counselor-header">
        <div>
          <h1>Counselor Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong></p>
        </div>
        <div className="availability-toggle">
          <span className={`avail-dot ${available ? 'avail-on' : 'avail-off'}`} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {available ? 'Available' : 'Unavailable'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleToggle}>Toggle</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Assigned', val: tickets.length,                                             color: 'var(--accent)' },
          { label: 'Crisis Alerts',  val: tickets.filter(t => t.isCrisis).length,                    color: 'var(--red)' },
          { label: 'Unacknowledged', val: unacknowledgedCrisisCount,                                  color: 'var(--red)' },
          { label: 'In Progress',    val: tickets.filter(t => t.status === 'in-progress').length,     color: 'var(--yellow)' },
          { label: 'Resolved',       val: tickets.filter(t => t.status === 'resolved').length,        color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-number" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="counselor-body">
        {/* Ticket List */}
        <div className="ticket-list-panel">
          <div className="panel-header">
            <h3>My Tickets</h3>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', fontSize: '0.8rem' }}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="responded">Responded</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>No tickets found.</p></div>
          ) : (
            <div className="ticket-list">
              {filtered.map(t => (
                <div
                  key={t._id}
                  className={`ticket-item
                    ${activeTicket?._id === t._id ? 'active' : ''}
                    ${t.isCrisis && !t.crisisAcknowledged ? 'crisis-unacked' : ''}
                    ${t.isCrisis ? 'crisis-ticket' : ''}
                  `}
                  onClick={() => setActiveTicket(t)}
                >
                  <div className="ticket-item-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {t.isCrisis && (
                        <span className="crisis-tag" title={t.crisisAcknowledged ? 'Crisis — acknowledged' : 'Crisis — needs attention'}>
                          {t.crisisAcknowledged ? '✓🚨' : '🚨'}
                        </span>
                      )}
                      <code className="ticket-id">{t.ticketId}</code>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <span className={`badge ${statusBadge(t.status)}`}>{t.status}</span>
                    </div>
                  </div>
                  <p className="ticket-preview">{t.description?.slice(0, 80)}...</p>
                  <div className="ticket-meta">
                    <span>{t.category?.name}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail + Chat */}
        <div className="ticket-detail-panel">
          {!activeTicket ? (
            <div className="no-ticket-selected">
              <span>💬</span>
              <p>Select a ticket to view details and chat</p>
            </div>
          ) : (
            <div>
              {/* Crisis acknowledge banner inside detail panel */}
              {activeTicket.isCrisis && !activeTicket.crisisAcknowledged && (
                <div className="crisis-detail-banner">
                  <div className="crisis-detail-left">
                    <span style={{ fontSize: '1.5rem' }}>🚨</span>
                    <div>
                      <strong>Crisis Alert</strong>
                      <p>
                        This student's message triggered an automated crisis alert.
                        {activeTicket.crisisKeywords?.length > 0 && (
                          <> Keywords detected: <em>{activeTicket.crisisKeywords.join(', ')}</em>.</>
                        )}
                        {' '}Severity score: <strong>{activeTicket.severityScore}</strong>.
                        Respond immediately, then acknowledge this alert.
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleAcknowledgeCrisis(activeTicket._id)}
                    disabled={ackLoading}
                  >
                    {ackLoading ? 'Acknowledging...' : 'Acknowledge Alert'}
                  </button>
                </div>
              )}

              {/* Acknowledged notice */}
              {activeTicket.isCrisis && activeTicket.crisisAcknowledged && (
                <div className="crisis-acked-notice">
                  ✓ Crisis acknowledged at {new Date(activeTicket.crisisAcknowledgedAt).toLocaleString()}
                </div>
              )}

              {/* Ticket Info */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="detail-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <code className="ticket-id">{activeTicket.ticketId}</code>
                    {activeTicket.isCrisis && (
                      <span className="badge badge-urgent" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid #7a1f1f' }}>
                        🚨 CRISIS
                      </span>
                    )}
                    <span className={`badge ${statusBadge(activeTicket.status)}`}>{activeTicket.status}</span>
                    <span className={`badge badge-${activeTicket.priority}`}>{activeTicket.priority}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['in-progress', 'resolved', 'closed'].map(s => (
                      activeTicket.status !== s && (
                        <button key={s} className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(activeTicket._id, s)}>
                          Mark {s}
                        </button>
                      )
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activeTicket.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Category: {activeTicket.category?.name} ·
                  Submitted: {new Date(activeTicket.createdAt).toLocaleString()}
                </div>
              </div>

              <h3 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.95rem' }}>
                Conversation
              </h3>
              <TicketChat ticket={activeTicket} anonymousToken={null} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

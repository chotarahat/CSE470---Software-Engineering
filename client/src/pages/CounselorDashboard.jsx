import React, { useState, useEffect } from 'react';
import { getTickets, updateTicketStatus, toggleAvailability } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TicketChat from '../components/TicketChat';
import './CounselorDashboard.css';

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(user?.availability ?? true);

  // Fetch tickets assigned to this counselor
  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      setTickets(res.data);
      // Update selected ticket data if one is already selected
      if (selectedTicket) {
        const updated = res.data.find(t => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Set up a polling interval to check for new tickets every 15 seconds
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const res = await toggleAvailability();
      setIsAvailable(res.data.availability);
      if (!res.data.availability) {
        // If they went offline, backend auto-reassigns their tickets. 
        // We should refresh the list immediately.
        fetchTickets();
        setSelectedTicket(null); 
      }
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket._id, status);
      fetchTickets(); // Refresh to get updated status and timestamps
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const validTransitions = {
    'open': ['assigned', 'in-progress', 'closed'],
    'assigned': ['in-progress', 'responded', 'closed'],
    'in-progress': ['responded', 'resolved', 'closed'],
    'responded': ['in-progress', 'resolved', 'closed'],
    'resolved': ['closed', 'in-progress'],
    'closed': []
  };

  const allowedStatuses = selectedTicket ? (validTransitions[selectedTicket.status] || []) : [];

  return (
    <div className="page counselor-dashboard">
      
      {/* ── HEADER & AVAILABILITY TOGGLE ── */}
      <div className="counselor-header">
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p>Manage your assigned student support tickets.</p>
        </div>
        
        <button className="availability-toggle" onClick={handleToggleAvailability} style={{ cursor: 'pointer' }}>
          <span className={`avail-dot ${isAvailable ? 'avail-on' : 'avail-off'}`}></span>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isAvailable ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {isAvailable ? 'Accepting New Tickets' : 'Currently Offline'}
          </span>
        </button>
      </div>

      <div className="counselor-body">
        
        {/* ── LEFT PANEL: TICKET LIST ── */}
        <div className="ticket-list-panel">
          <div className="panel-header">
            <h3>Active Tickets ({tickets.filter(t => t.status !== 'closed').length})</h3>
          </div>
          <div className="ticket-list">
            {tickets.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                You have no assigned tickets right now.
              </div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket._id} 
                  className={`ticket-item ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="ticket-item-top">
                    <span className="ticket-id">{ticket.ticketId}</span>
                    <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
                  </div>
                  <div className="ticket-preview">
                    {ticket.description.substring(0, 50)}...
                  </div>
                  <div className="ticket-meta">
                    <span className={`badge badge-${ticket.status === 'resolved' ? 'resolved' : 'open'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                      {ticket.status}
                    </span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: TICKET DETAILS & CHAT ── */}
        <div className="ticket-detail-panel">
          {!selectedTicket ? (
            <div className="no-ticket-selected">
              <span>📭</span>
              <p>Select a ticket from the left to view details and reply.</p>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
              
              {/* Ticket Info Header */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div className="detail-header">
                  <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                      Ticket {selectedTicket.ticketId}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Category: {selectedTicket.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                  
                  {/* Status Updater */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</span>
                    <select 
                      value={selectedTicket.status} 
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      disabled={allowedStatuses.length === 0}
                    >
                      <option value={selectedTicket.status}>{selectedTicket.status} (Current)</option>
                      {allowedStatuses.map(status => (
                        <option key={status} value={status}>Mark as {status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Student's Concern:</strong><br/>
                  {selectedTicket.description}
                </div>
              </div>

              {/* Chat Component */}
              <div style={{ flex: 1, padding: '1rem' }}>
                <TicketChat ticket={selectedTicket} />
              </div>
              
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
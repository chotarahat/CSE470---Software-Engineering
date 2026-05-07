import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';

export default function AuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    if (status === 'SUCCESS') return 'var(--green)';
    if (status === 'FAILURE') return 'var(--red)';
    return 'var(--yellow)';
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="card" style={{ padding: '1.5rem', overflowX: 'auto', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Security Audit Trail</h2>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>Time</th>
            <th style={{ padding: '0.75rem' }}>User</th>
            <th style={{ padding: '0.75rem' }}>Action</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
            <th style={{ padding: '0.75rem' }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(log.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: '0.75rem' }}>
                {log.user ? <strong>{log.user.name}</strong> : <span style={{ color: 'var(--text-muted)' }}>System/Anonymous</span>}
              </td>
              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{log.action}</td>
              <td style={{ padding: '0.75rem', color: getStatusColor(log.status), fontWeight: 'bold' }}>
                {log.status}
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                {JSON.stringify(log.details).replace(/["{}]/g, ' ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useState } from 'react';
import { generateReport } from '../services/api';
import './GenerateReport.css';

/**
 * GenerateReport
 *
 * Shown in the Admin Dashboard Overview tab.
 * Clicking the button calls GET /api/reports/generate,
 * receives the plain-text report, and triggers a browser download.
 * Shows a preview of what the report contains before downloading.
 */
export default function GenerateReport() {
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [showInfo,  setShowInfo]  = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await generateReport();

      // Extract filename from Content-Disposition header if present
      const disp  = res.headers['content-disposition'] || '';
      const match = disp.match(/filename="(.+?)"/);
      const fname = match ? match[1] : `ventify-report-${Date.now()}.txt`;

      // Trigger browser file download
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Report downloaded: ${fname}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-report">
      <div className="report-card">
        {/* Header */}
        <div className="report-card-header">
          <div className="report-icon">📋</div>
          <div>
            <h3>Automated System Report</h3>
            <p>
              Generate a complete snapshot of all system activity —
              ticket stats, crisis summary, counselor workload, and 14-day trend.
            </p>
          </div>
        </div>

        {/* What's included toggle */}
        <button
          className="report-info-toggle"
          onClick={() => setShowInfo(v => !v)}
        >
          {showInfo ? '▲ Hide' : '▼ What\'s included'}
        </button>

        {showInfo && (
          <div className="report-info-body">
            {[
              { icon: '📊', label: 'Executive Summary', desc: 'Total tickets, resolution rate, avg response & resolution time' },
              { icon: '🎫', label: 'Status Breakdown',  desc: 'Open, assigned, in-progress, responded, resolved, closed counts with visual bars' },
              { icon: '⚡', label: 'Priority Distribution', desc: 'Urgent, high, medium, low breakdown with percentages' },
              { icon: '🗂️', label: 'Category Distribution', desc: 'Which mental health categories have the most tickets' },
              { icon: '🚨', label: 'Crisis Summary',    desc: 'Total crisis tickets, acknowledged vs unacknowledged, crisis rate' },
              { icon: '👥', label: 'Counselor Workload', desc: 'Active ticket count and availability per counselor' },
              { icon: '📈', label: 'Daily Trend',       desc: 'Ticket volume for each of the last 14 days' },
            ].map(item => (
              <div key={item.label} className="report-info-row">
                <span className="report-info-icon">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error / Success */}
        {error   && <div className="alert alert-error"   style={{ marginTop: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginTop: '1rem' }}>✓ {success}</div>}

        {/* Generate button */}
        <button
          className="btn btn-primary report-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <><span className="report-spinner" /> Generating Report...</>
          ) : (
            <>📥 Download System Report</>
          )}
        </button>

        <p className="report-note">
          Report is generated live from the database at the moment of download.
          No data is cached — always reflects current system state.
        </p>
      </div>
    </div>
  );
}
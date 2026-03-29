import React, { useState, useEffect } from 'react';
import { submitTicket, getCategories } from '../services/api';
import './TicketForm.css';

// Crisis keywords shown to student in real-time as they type
const CRISIS_HINT_WORDS = [
  'suicide','suicidal','kill myself','end my life','self harm','self-harm',
  'hurt myself','want to die','overdose','hopeless','no reason to live',
];

function hasCrisisHint(text) {
  const lower = text.toLowerCase();
  return CRISIS_HINT_WORDS.some(w => lower.includes(w));
}

export default function TicketForm({ onSuccess }) {
  const [categories, setCategories]   = useState([]);
  const [form, setForm]               = useState({ category: '', priority: 'medium', description: '' });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [showCrisisHint, setShowCrisisHint] = useState(false);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // Real-time crisis hint as student types
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, description: val }));
    setShowCrisisHint(hasCrisisHint(val) || form.priority === 'urgent');
  };

  const handlePriorityChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, priority: val }));
    setShowCrisisHint(val === 'urgent' || hasCrisisHint(form.description));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return setError('Please select a category.');
    if (form.description.length < 10) return setError('Please describe your concern in more detail.');
    setLoading(true);
    setError('');
    try {
      const res = await submitTicket(form);
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
          <option value="">Select a category...</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Priority Level</label>
        <select value={form.priority} onChange={handlePriorityChange}>
          <option value="low">Low — General guidance needed</option>
          <option value="medium">Medium — Struggling but stable</option>
          <option value="high">High — Significantly affected</option>
          <option value="urgent">Urgent — Need immediate help</option>
        </select>
      </div>

      <div className="form-group">
        <label>Describe Your Concern</label>
        <textarea
          rows={5}
          placeholder="Share what you're going through. Your identity will remain completely anonymous..."
          value={form.description}
          onChange={handleDescriptionChange}
          required
        />
      </div>

      {/* Real-time crisis hint — shown while typing */}
      {showCrisisHint && (
        <div className="crisis-hint-banner">
          <div className="crisis-hint-icon">🚨</div>
          <div>
            <strong>Are you in immediate danger?</strong>
            <p>
              Your message suggests you may be in crisis. Your ticket will be marked urgent and a
              counselor will be alerted immediately. If you are in immediate danger, please also contact:
            </p>
            <ul>
              <li>Emergency services: <strong>999 / 112</strong></li>
              <li>National crisis line: <strong>16789</strong> (Bangladesh)</li>
              <li>Kaan Pete Roi: <strong>01779-554391</strong></li>
            </ul>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
        🔒 Your identity is never stored. A unique token will be generated to track your ticket.
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Anonymously'}
      </button>
    </form>
  );
}

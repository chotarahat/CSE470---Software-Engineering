import React, { useState, useEffect } from 'react';
import { submitTicket, getCategories } from '../services/api';
import EmergencyOverlay from './EmergencyOverlay';
import { detectCrisis } from '../utils/crisisDetector';

export default function TicketForm({ onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', priority: 'medium', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCrisis = detectCrisis(form.description);
    if (isCrisis) {
      setShowEmergencyOverlay(true);
      return; 
    }
    if (!form.category) return setError('Please select a category.');
    if (form.description.length < 10) return setError('Please describe your concern in more detail.');
    setLoading(true);
    setError('');
    try {
      const res = await submitTicket(form);
      if (res.data.crisisFlag){
        // alert("EMERGENCY DETECTED: Based on your description. we strongly contacting the campus 24/7 hotline at 999 or local emergency services immediately.");
        setShowEmergencyOverlay(true);
      }
      
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Priority Level</label>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
        🔒 Your identity is never stored. A unique token will be generated to track your ticket.
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Anonymously'}
      </button>
    </form>
    {showEmergencyOverlay && (
    <EmergencyOverlay onClose={() => setShowEmergencyOverlay(false)} />
    )}
    </>
  );
}
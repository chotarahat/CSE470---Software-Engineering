import React, { useState, useEffect } from 'react';
import {
  getAnalytics, getTickets, getCounselors, createCounselor,
  reassignTicket, updateTicketStatus,
  getResources, createResource, deleteResource,
  getCategories, createCategory,
} from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="page admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage counselors, tickets, resources, and view system analytics.</p>
      </div>
      <div className="tab-nav">
        {[
          { key: 'overview',   label: '📊 Overview' },
          { key: 'tickets',    label: '🎫 Tickets' },
          { key: 'counselors', label: '👥 Counselors' },
          { key: 'resources',  label: '📚 Resources' },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview'   && <OverviewTab />}
      {tab === 'tickets'    && <TicketsTab />}
      {tab === 'counselors' && <CounselorsTab />}
      {tab === 'resources'  && <ResourcesTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Feature 5 — Overview / Analytics Tab
   Shows: totals, resolution rate, avg response time,
          priority dist, category dist, daily trend, workload
═══════════════════════════════════════════ */
function OverviewTab() {
  const [data, setData] = useState(null);
  useEffect(() => { getAnalytics().then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="overview-tab">

      {/* ── Headline stats ── */}
      <div className="stats-grid">
        {[
          { label: 'Total Tickets',  val: data.total,      color: 'var(--text-primary)' },
          { label: 'Open',           val: data.open,       color: 'var(--accent)' },
          { label: 'Assigned',       val: data.assigned,   color: 'var(--yellow)' },
          { label: 'In Progress',    val: data.inProgress, color: 'var(--yellow)' },
          { label: 'Responded',      val: data.responded,  color: 'var(--purple)' },
          { label: 'Resolved',       val: data.resolved,   color: 'var(--green)' },
          { label: 'Closed',         val: data.closed,     color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-number" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Crisis summary strip ── */}
      {(data.totalCrisis > 0) && (
        <div className="admin-crisis-strip">
          <span style={{ fontSize: '1.1rem' }}>🚨</span>
          <div>
            <strong>{data.totalCrisis} crisis ticket{data.totalCrisis !== 1 ? 's' : ''} total</strong>
            {data.unacknowledgedCrisis > 0 && (
              <span className="crisis-unacked-pill">
                {data.unacknowledgedCrisis} unacknowledged
              </span>
            )}
            {data.unacknowledgedCrisis === 0 && (
              <span style={{ color: 'var(--green)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                ✓ All acknowledged
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="kpi-row">
        <KpiCard
          title="Resolution Rate"
          value={`${data.resolutionRate}%`}
          sub="Resolved + Closed / Total"
          color="var(--green)"
          fill={data.resolutionRate}
        />
        <KpiCard
          title="Avg First Response"
          value={data.avgResponseTimeHours != null ? `${data.avgResponseTimeHours}h` : 'N/A'}
          sub="From assignment → first reply"
          color="var(--accent)"
          fill={null}
        />
        <KpiCard
          title="Avg Resolution Time"
          value={data.avgResolutionTimeHours != null ? `${data.avgResolutionTimeHours}h` : 'N/A'}
          sub="From submission → resolved"
          color="var(--purple)"
          fill={null}
        />
      </div>

      {/* ── Category + Priority distributions ── */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-section-title">Tickets by Category</h3>
          {data.byCategory.length === 0
            ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No data yet.</p>
            : data.byCategory.map((c, i) => (
              <BarRow key={i} label={c.name} count={c.count} total={data.total} color="var(--purple)" />
            ))}
        </div>

        <div className="card">
          <h3 className="card-section-title">Tickets by Priority</h3>
          {data.byPriority.map(p => (
            <BarRow
              key={p._id} label={p._id} count={p.count} total={data.total}
              badge={`badge-${p._id}`}
              color={p._id === 'urgent' ? 'var(--red)' : p._id === 'high' ? '#f97316' : p._id === 'medium' ? 'var(--yellow)' : 'var(--green)'}
            />
          ))}
        </div>
      </div>

      {/* ── Daily trend ── */}
      {data.dailyTrend.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-section-title">Daily Ticket Volume — Last 14 Days</h3>
          <TrendChart data={data.dailyTrend} />
        </div>
      )}

      {/* ── Counselor workload ── */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-section-title">Counselor Workload</h3>
        {data.counselorWorkload.length === 0
          ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No counselors yet.</p>
          : (
            <div className="workload-list">
              {data.counselorWorkload.map(c => (
                <div key={c._id} className="workload-row">
                  <div className="workload-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                  <div className="workload-info">
                    <strong>{c.name}</strong>
                    <span className={`badge ${c.availability ? 'badge-resolved' : 'badge-closed'}`}>
                      {c.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="workload-count">
                    <span className="workload-num">{c.activeCount}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>active</span>
                  </div>
                  <div className="workload-bar-track">
                    <div
                      className="workload-bar-fill"
                      style={{
                        width: data.counselorWorkload[0]?.activeCount > 0
                          ? `${Math.round((c.activeCount / data.counselorWorkload[0].activeCount) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

/* KPI Card with optional progress ring */
function KpiCard({ title, value, sub, color, fill }) {
  return (
    <div className="kpi-card card">
      {fill != null && (
        <div className="kpi-ring" style={{ '--fill': fill, '--color': color }}>
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${(fill / 100) * 100.53} 100.53`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <span className="kpi-ring-val" style={{ color }}>{value}</span>
        </div>
      )}
      {fill == null && <div className="kpi-big-val" style={{ color }}>{value}</div>}
      <div className="kpi-title">{title}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

/* Horizontal bar row */
function BarRow({ label, count, total, color, badge }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bar-row">
      {badge
        ? <span className={`badge ${badge}`} style={{ minWidth: 72 }}>{label}</span>
        : <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 110 }}>{label}</span>
      }
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-count">{count}</span>
    </div>
  );
}

/* Simple inline SVG bar chart for daily trend */
function TrendChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 600, H = 80, pad = 8;
  const barW = Math.max(4, (W - pad * 2) / data.length - 3);

  return (
    <div className="trend-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="trend-chart">
        {data.map((d, i) => {
          const barH = Math.max(3, ((d.count / max) * H));
          const x = pad + i * ((W - pad * 2) / data.length);
          const y = H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="2" fill="var(--accent)" opacity="0.8" />
              {data.length <= 14 && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="7" fill="var(--text-muted)">
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                  {d.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tickets Tab
═══════════════════════════════════════════ */
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([getTickets(), getCounselors()])
      .then(([t, c]) => { setTickets(t.data); setCounselors(c.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReassign = async (ticketId, counselorId) => {
    if (!counselorId) return;
    try {
      await reassignTicket(ticketId, counselorId);
      const res = await getTickets();
      setTickets(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Reassignment failed.');
    }
  };

  const handleStatus = async (ticketId, status) => {
    try {
      await updateTicketStatus(ticketId, status);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status } : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const statusBadge = s => ({ open: 'badge-open', assigned: 'badge-open', 'in-progress': 'badge-progress', responded: 'badge-progress', resolved: 'badge-resolved', closed: 'badge-closed' }[s] || '');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2>All Tickets</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Statuses</option>
          {['open','assigned','in-progress','responded','resolved','closed'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th><th>Crisis</th><th>Category</th><th>Priority</th>
              <th>Status</th><th>Counselor</th><th>Submitted</th><th>Change Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No tickets found.</td></tr>
              : filtered.map(t => (
                <tr key={t._id}>
                  <td><code style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>{t.ticketId}</code></td>
                  <td>
                    {t.isCrisis ? (
                      <span title={t.crisisAcknowledged ? 'Acknowledged' : 'Unacknowledged'}
                        style={{ fontSize: '1rem' }}>
                        {t.crisisAcknowledged ? '✓🚨' : '🚨'}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{t.category?.name || '—'}</td>
                  <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                  <td>
                    <select
                      value={t.assignedCounselor?._id || ''}
                      onChange={e => handleReassign(t._id, e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                    >
                      <option value="">Unassigned</option>
                      {counselors.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={e => handleStatus(t._id, e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                    >
                      {['open','assigned','in-progress','responded','resolved','closed'].map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Counselors Tab
═══════════════════════════════════════════ */
function CounselorsTab() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    getCounselors().then(r => setCounselors(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await createCounselor(form);
      setCounselors(prev => [...prev, res.data]);
      setForm({ name: '', email: '', password: '' });
      setMsg({ type: 'success', text: `Counselor "${res.data.name}" created.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' });
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="grid-2">
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Counselors ({counselors.length})</h2>
        {counselors.length === 0
          ? <div className="empty-state card"><p>No counselors yet.</p></div>
          : counselors.map(c => (
            <div key={c._id} className="card counselor-card">
              <div className="counselor-avatar">{c.name.charAt(0).toUpperCase()}</div>
              <div className="counselor-info">
                <strong>{c.name}</strong>
                <span>{c.email}</span>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                  <span className={`badge ${c.availability ? 'badge-resolved' : 'badge-closed'}`}>
                    {c.availability ? 'Available' : 'Unavailable'}
                  </span>
                  <span className="badge badge-open">{c.assignedTickets?.length || 0} assigned</span>
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Add Counselor</h2>
        {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Full Name</label>
            <input placeholder="Dr. Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group"><label>Email</label>
            <input type="email" placeholder="counselor@university.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group"><label>Temporary Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Create Counselor</button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Resources Tab
═══════════════════════════════════════════ */
function ResourcesTab() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', url: '', category: '', tags: '' });
  const [catForm, setCatForm] = useState({ name: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showCatForm, setShowCatForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const reload = async () => {
    const params = {};
    if (searchFilter) params.search = searchFilter;
    if (catFilter)    params.category = catFilter;
    const [r, c] = await Promise.all([getResources(params), getCategories()]);
    setResources(r.data);
    setCategories(c.data);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line
  // Re-fetch when filters change
  useEffect(() => {
    const t = setTimeout(reload, 350);
    return () => clearTimeout(t);
  }, [searchFilter, catFilter]); // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createResource({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
      setForm({ title: '', description: '', url: '', category: '', tags: '' });
      setMsg({ type: 'success', text: 'Resource added.' });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try { await deleteResource(id); reload(); } catch {/* silent */}
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    try {
      await createCategory(catForm);
      setCatForm({ name: '' });
      setShowCatForm(false);
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category.');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Add resource form */}
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>Add Resource</h2>
          {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group"><label>Title</label>
              <input placeholder="Resource title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group"><label>Description</label>
              <textarea rows={3} placeholder="Brief description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group"><label>URL (optional)</label>
              <input placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Tags (comma-separated)</label>
              <input placeholder="anxiety, stress, coping" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-full">Add Resource</button>
          </form>
        </div>

        {/* Categories */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Categories</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(v => !v)}>
              {showCatForm ? 'Cancel' : '+ New'}
            </button>
          </div>
          {showCatForm && (
            <form onSubmit={handleCreateCat} style={{ marginBottom: '1rem' }}>
              <div className="form-group"><label>Category Name</label>
                <input placeholder="e.g. Anxiety" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Create</button>
            </form>
          )}
          {categories.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No categories yet.</p>
            : categories.map(c => <div key={c._id} className="cat-row"><span>{c.name}</span></div>)
          }
        </div>
      </div>

      {/* Resource list with Feature 4 filters */}
      <div>
        <div className="section-header">
          <h2>All Resources ({resources.length})</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              style={{ width: 200 }}
              placeholder="🔍 Search..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Category</th><th>Tags</th><th>Added</th><th>Action</th></tr></thead>
            <tbody>
              {resources.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No resources found.</td></tr>
                : resources.map(r => (
                  <tr key={r._id}>
                    <td>
                      <strong style={{ fontSize: '0.875rem' }}>{r.title}</strong>
                      {r.url && <><br /><a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>View →</a></>}
                    </td>
                    <td><span className="badge badge-open">{r.category?.name}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.tags?.join(', ') || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


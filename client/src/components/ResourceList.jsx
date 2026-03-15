import React, { useState, useEffect } from 'react';
import { getResources, getCategories } from '../services/api';
import './ResourceList.css';

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      const res = await getResources(params);
      setResources(res.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchResources, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line
  }, [search, selectedCategory]);

  return (
    <div>
      <div className="resource-filters">
        <input
          type="text"
          placeholder="🔍  Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="resource-search"
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : resources.length === 0 ? (
        <div className="empty-state">
          <h3>No resources found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="resource-grid">
          {resources.map((r) => (
            <div key={r._id} className="resource-card card">
              <div className="resource-header">
                <span className="badge badge-open">{r.category?.name}</span>
              </div>
              <h3 className="resource-title">{r.title}</h3>
              <p className="resource-desc">{r.description}</p>
              {r.tags?.length > 0 && (
                <div className="resource-tags">
                  {r.tags.map((t, i) => (
                    <span key={i} className="resource-tag">{t}</span>
                  ))}
                </div>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  View Resource →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
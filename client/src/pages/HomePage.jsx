import React from 'react';
import { Link } from 'react-router-dom';
import ResourceList from '../components/ResourceList';
import MoodTracker from '../components/MoodTracker'; // 🚀 Imported the new tracker!
import './HomePage.css';

export default function HomePage() {

  // 🚀 The Bulletproof Scroll Function for the Resource Card
  const handleResourceClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    const target = document.getElementById('resources');
    if (target) {
      const yOffset = -70; // Adjusts for your fixed navbar
      const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">Safe · Anonymous · Confidential</div>
        <h1 className="hero-title">
          You don't have to face<br />
          <em>this alone.</em>
        </h1>
        <p className="hero-sub">
          Ventify connects you with professional counselors — completely anonymously.
          No account required. No identity stored.
        </p>
        <div className="hero-actions">
          <Link to="/student">
            <button className="btn btn-primary hero-btn">Get Support Now</button>
          </Link>
          <button onClick={handleResourceClick} className="btn btn-secondary hero-btn">
            Browse Resources
          </button>
        </div>
      </section>

      {/* 🚀 🚀 The Popup Mood Tracker */}
      <MoodTracker />

      {/* Features */}
      <section className="features">
        <div className="feature-grid">
          {[
            { icon: '🎭', title: 'Fully Anonymous', desc: 'No login required. Your identity is never linked to your request.' },
            { icon: '🩺', title: 'Real Counselors', desc: 'Trained professionals review and respond to every ticket.' },
            { icon: '🔐', title: 'Secure & Private', desc: 'JWT-based auth, bcrypt encryption, and role-based access control.' },
            { icon: '📚', title: 'Resource Library', desc: 'Curated self-help articles and guides available to everyone.', isLink: true },
          ].map((f) => (
            <div 
              key={f.title} 
              className={`feature-card card ${f.isLink ? 'resource-clickable-card' : ''}`}
              onClick={f.isLink ? handleResourceClick : undefined}
              style={f.isLink ? { 
                cursor: 'pointer', 
                border: '1px solid var(--accent)', 
                backgroundColor: 'var(--bg-hover)' 
              } : {}}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              
              {/* Visual Indicator for the clickable card */}
              {f.isLink && (
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                  Click to browse ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          {[
            { n: '01', title: 'Submit a Ticket', desc: 'Describe your concern anonymously. Choose a category and priority level.' },
            { n: '02', title: 'Get Assigned', desc: 'A counselor is automatically assigned to your ticket.' },
            { n: '03', title: 'Chat Securely', desc: 'Use your unique token to communicate back and forth.' },
            { n: '04', title: 'Access Resources', desc: 'Browse self-help materials at any time, no account needed.' },
          ].map((s) => (
            <div key={s.n} className="step-card">
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="resources-section" id="resources">
        <div className="section-header">
          <h2>Self-Help Resources</h2>
        </div>
        <ResourceList />
      </section>
    </div>
  );
}

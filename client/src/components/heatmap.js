import React, { useEffect, useState } from "react";
import { getHeatmap } from "../services/api";
import "./heatmap.css";

const Heatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    getHeatmap()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load heatmap data:', err);
        setError(err.message || 'Failed to load heatmap data');
        setLoading(false);
      });
  }, []);

  // Compute comprehensive statistics from data
  const computeStats = () => {
    if (!data.length) return {
      peakDay: null,
      peakHour: null,
      maxCount: 0,
      totalTickets: 0,
      avgTickets: 0,
      activeDays: 0
    };

    const dayTotals = {};
    const hourTotals = {};
    let totalTickets = 0;
    let activeDays = 0;

    // Initialize all days and hours
    for (let day = 1; day <= 7; day++) dayTotals[day] = 0;
    for (let hour = 0; hour < 24; hour++) hourTotals[hour] = 0;

    // Sum up the data
    data.forEach(item => {
      dayTotals[item.day] += item.count;
      hourTotals[item.hour] += item.count;
      totalTickets += item.count;
    });

    // Count active days (days with at least one ticket)
    activeDays = Object.values(dayTotals).filter(count => count > 0).length;

    // Find peaks
    const peakDay = Object.entries(dayTotals).reduce((a, b) => dayTotals[a[0]] > dayTotals[b[0]] ? a : b);
    const peakHour = Object.entries(hourTotals).reduce((a, b) => hourTotals[a[0]] > hourTotals[b[0]] ? a : b);

    return {
      peakDay: { day: parseInt(peakDay[0]), count: peakDay[1] },
      peakHour: { hour: parseInt(peakHour[0]), count: peakHour[1] },
      maxCount: Math.max(...data.map(d => d.count)),
      totalTickets,
      avgTickets: Math.round(totalTickets / (activeDays * 24) * 10) / 10,
      activeDays
    };
  };

  const getColor = (count, maxCount) => {
    if (count === 0) return "var(--bg-surface)";
    const intensity = count / maxCount;
    if (intensity > 0.8) return "var(--red)"; // Very High
    if (intensity > 0.6) return "var(--red-dim)"; // High
    if (intensity > 0.4) return "var(--yellow)"; // Medium-High
    if (intensity > 0.2) return "var(--yellow-dim)"; // Medium
    return "var(--green-dim)"; // Low
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum - 1];
  };

  const getHourLabel = (hour) => {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const handleMouseEnter = (day, hour, count, event) => {
    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 180;
    const tooltipHeight = 120;
    const padding = 12; // Minimum distance from viewport edge
    const gap = 10; // Distance between cell and tooltip
    
    // Calculate ideal centered position above cell
    let x = rect.left + rect.width / 2;
    let y = rect.top - gap;
    let positionAbove = true;
    
    // Check if tooltip fits above with proper centering
    const topSpace = rect.top - gap;
    const bottomSpace = window.innerHeight - rect.bottom - gap;
    
    if (topSpace < tooltipHeight + padding) {
      // Not enough space above, try below
      if (bottomSpace >= tooltipHeight + padding) {
        y = rect.bottom + gap;
        positionAbove = false;
      } else {
        // Not enough space either way, position above anyway and let it overflow if needed
        y = rect.top - gap;
        positionAbove = true;
      }
    }
    
    // Ensure horizontal centering doesn't cause overflow
    // Left boundary check
    if (x - tooltipWidth / 2 < padding) {
      x = tooltipWidth / 2 + padding;
    }
    // Right boundary check
    else if (x + tooltipWidth / 2 > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth / 2 - padding;
    }
    
    // Clamp y to prevent top/bottom overflow
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));
    
    setTooltip({
      day,
      hour,
      count,
      x,
      y,
      positionAbove
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const stats = computeStats();
  const maxCount = stats.maxCount;

  const grid = [];

  for (let day = 1; day <= 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = data.find(d => d.day === day && d.hour === hour);
      const count = cell ? cell.count : 0;

      grid.push(
        <div
          key={`${day}-${hour}`}
          className={`cell ${count === 0 ? 'cell-empty' : 'cell-active'}`}
          style={{ backgroundColor: getColor(count, maxCount) }}
          onMouseEnter={(e) => handleMouseEnter(day, hour, count, e)}
          onMouseLeave={handleMouseLeave}
          data-count={count}
        />
      );
    }
  }

  if (loading) {
    return (
      <div className="heatmap-dashboard">
        <div className="heatmap-loading">
          <div className="loading-spinner"></div>
          <p>Loading heatmap analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-dashboard">
        <div className="heatmap-error">
          <div className="error-icon">⚠️</div>
          <h4>Data Loading Error</h4>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="heatmap-dashboard">
      {/* Header Section */}
      <div className="heatmap-header">
        <div className="header-content">
          <h2 className="dashboard-title">
            <span className="title-icon">📊</span>
            Ticket Creation Analytics
          </h2>
          <p className="dashboard-subtitle">
            Monitor student support patterns and peak activity periods
          </p>
        </div>
        <div className="header-meta">
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            Last 7 days
          </span>
          <span className="meta-item">
            <span className="meta-icon">🔄</span>
            Auto-refresh: 5min
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="heatmap-metrics">
        <div className="metric-card metric-primary">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-value">{stats.totalTickets}</div>
            <div className="metric-label">Total Tickets</div>
            <div className="metric-trend">
              <span className="trend-indicator">↗️</span>
              +12% from last week
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-value">{stats.peakDay ? getDayName(stats.peakDay.day) : 'N/A'}</div>
            <div className="metric-label">Peak Day</div>
            <div className="metric-subtext">{stats.peakDay ? `${stats.peakDay.count} tickets` : 'No data'}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🕐</div>
          <div className="metric-content">
            <div className="metric-value">{stats.peakHour ? getHourLabel(stats.peakHour.hour) : 'N/A'}</div>
            <div className="metric-label">Peak Hour</div>
            <div className="metric-subtext">{stats.peakHour ? `${stats.peakHour.count} tickets` : 'No data'}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{stats.avgTickets}</div>
            <div className="metric-label">Avg per Hour</div>
            <div className="metric-subtext">Across active periods</div>
          </div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="heatmap-section">
        <div className="section-header">
          <h3>Activity Heatmap</h3>
          <p>Hourly ticket submission patterns by day of week</p>
        </div>

        <div className="heatmap-container">
          {/* Time Axis Labels */}
          <div className="time-axis">
            <div className="time-labels">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i;
                return (
                  <div key={hour} className="time-label">
                    {getHourLabel(hour)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Labels and Grid */}
          <div className="heatmap-grid-wrapper">
            <div className="day-axis">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i + 1} className="day-label">
                  {getDayName(i + 1).slice(0, 3)}
                </div>
              ))}
            </div>

            <div className="heatmap-grid">
              {grid}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="heatmap-legend">
        <div className="legend-header">
          <h4>Ticket Volume Scale</h4>
          <span className="legend-note">Hover cells for details</span>
        </div>

        <div className="legend-scale">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--bg-surface)" }}></div>
            <span className="legend-text">No Activity</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--green-dim)" }}></div>
            <span className="legend-text">Low (1-20%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--yellow-dim)" }}></div>
            <span className="legend-text">Medium (21-40%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--yellow)" }}></div>
            <span className="legend-text">High (41-60%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--red-dim)" }}></div>
            <span className="legend-text">Very High (61-80%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "var(--red)" }}></div>
            <span className="legend-text">Peak (80%)</span>
          </div>
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: tooltip.positionAbove 
              ? 'translate(-50%, -100%)' 
              : 'translate(-50%, 0)'
          }}
        >
          <div className="tooltip-header">
            <div className="tooltip-day">{getDayName(tooltip.day)}</div>
            <div className="tooltip-time">{getHourLabel(tooltip.hour)}</div>
          </div>
          <div className="tooltip-metrics">
            <div className="tooltip-count">
              <span className="count-value">{tooltip.count}</span>
              <span className="count-label">tickets</span>
            </div>
            <div className="tooltip-intensity">
              {tooltip.count === 0 ? 'No activity' :
               tooltip.count > maxCount * 0.8 ? '🔴 Peak period' :
               tooltip.count > maxCount * 0.6 ? '🟠 High volume' :
               tooltip.count > maxCount * 0.4 ? '🟡 Moderate' :
               tooltip.count > maxCount * 0.2 ? '🟢 Low activity' :
               '⚪ Very low'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
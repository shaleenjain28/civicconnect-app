import React, { useEffect, useRef, useState } from 'react';
import { Filter, MapPin, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch issues & departments
  useEffect(() => {
    async function load() {
      try {
        const [iss, depts] = await Promise.all([
          dataService.getProblems({ limit: 200 }),
          dataService.getDepartments(),
        ]);
        setIssues(iss);
        setDepartments(depts);
      } catch (err) {
        console.error('Map load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Apply filters
  const filtered = issues.filter(i => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (deptFilter && i.departmentId !== Number(deptFilter)) return false;
    if (critFilter && i.criticality !== critFilter) return false;
    if (!i.latitude || !i.longitude) return false;
    return true;
  });

  // Render map
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([26.9124, 75.7873], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    // Add markers by criticality
    filtered.forEach(p => {
      const color = getCritColor(p.criticality);
      const size = p.criticality === 'critical' ? 32 : p.criticality === 'high' ? 28 : 24;
      const pulse = p.escalated ? 'animation: pulse 2s infinite;' : '';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; border: 3px solid #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #fff; font-weight: 700;
          ${pulse}
        ">${p.escalated ? '!' : ''}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const deptName = p.department?.name || '—';
      const hodName = p.department?.hodName || 'Not assigned';
      const hodPhone = p.department?.hodPhone || '—';
      const statusBg = dataService.getStatusColor(p.status);
      const critBg = getCritColor(p.criticality);

      const marker = L.marker([p.latitude, p.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width:220px;font-family:Inter,sans-serif;">
            <h3 style="font-size:14px;font-weight:700;margin:0 0 6px;">${p.title}</h3>
            <p style="font-size:12px;color:#666;margin:0 0 8px;">📍 ${p.locationText || 'Jaipur'}</p>
            <div style="display:flex;gap:4px;margin:0 0 8px;flex-wrap:wrap;">
              <span style="padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;color:#fff;background:${statusBg}">${dataService.getStatusLabel(p.status)}</span>
              <span style="padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;color:#fff;background:${critBg}">${p.criticality}</span>
              ${p.escalated ? '<span style="padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;color:#fff;background:#EF4444">🚨 Escalated</span>' : ''}
            </div>
            <p style="font-size:11px;color:#888;margin:0 0 2px;">📁 ${deptName}</p>
            <p style="font-size:11px;color:#888;margin:0 0 2px;">👤 HOD: <strong>${hodName}</strong></p>
            <p style="font-size:11px;color:#888;margin:0;">📱 ${hodPhone}</p>
            <p style="font-size:12px;font-weight:600;color:#333;margin:6px 0 0;">👍 ${p.upvoteCount} upvotes</p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(p => [p.latitude, p.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filtered]);

  const clearFilters = () => { setStatusFilter(''); setDeptFilter(''); setCritFilter(''); };

  return (
    <div className="fade-in">
      {/* Filters */}
      <div className="card map-filters-card">
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} style={{ color: 'var(--primary-600)' }} />
            Map Filters
          </h3>
          <p className="card-subtitle">Filter issues on the map</p>
        </div>
        <div className="filters-bar" style={{ paddingTop: 12 }}>
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_verification">Verification</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Criticality</label>
            <select className="filter-select" value={critFilter} onChange={e => setCritFilter(e.target.value)}>
              <option value="">All</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <button className="clear-filters-btn" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--primary-600)' }} />
            Map Legend — Color = Criticality
          </h3>
        </div>
        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot" style={{ background: '#DC2626' }}></span> 🔴 Critical</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#EA580C' }}></span> 🟠 High</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#F59E0B' }}></span> 🟡 Medium</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#10B981' }}></span> 🟢 Low</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }}></span> 🚨 Escalated (pulsing)</div>
        </div>
      </div>

      {/* Map */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {loading ? 'Loading map...' : `Jaipur Issues Map (${filtered.length} shown)`}
          </h3>
          <p className="card-subtitle">Click markers to see issue details + HOD contact</p>
        </div>
        <div className="map-wrapper">
          <div ref={mapRef} className="map-container-full" id="problems-map"></div>
        </div>
      </div>
    </div>
  );
}

function getCritColor(criticality) {
  const map = { critical: '#DC2626', high: '#EA580C', medium: '#F59E0B', low: '#10B981' };
  return map[criticality] || '#9CA3AF';
}

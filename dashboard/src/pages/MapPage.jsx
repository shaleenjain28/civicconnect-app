import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Filter, MapPin } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const problems = useMemo(() => dataService.getProblems(), []);

  const filtered = useMemo(() => {
    let list = [...problems];
    if (statusFilter !== 'All Statuses') list = list.filter(p => p.status === statusFilter);
    if (typeFilter !== 'All Types') list = list.filter(p => p.type === typeFilter);
    return list;
  }, [problems, statusFilter, typeFilter]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([26.855, 75.805], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    // Add new markers
    filtered.forEach((p) => {
      const color = getMarkerColor(p);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([p.lat, p.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="map-popup">
            <h3>${p.title}</h3>
            <p>${p.location}</p>
            <div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap;">
              <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${getStatusColor(p.status)}">${p.status}</span>
              <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;background:#f5f5f5;color:#333">${p.type}</span>
            </div>
            <p style="color:#ff9800;font-weight:600;font-size:12px;">👍 ${p.votes} votes</p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(p => [p.lat, p.lon]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filtered]);

  const clearFilters = () => { setStatusFilter('All Statuses'); setTypeFilter('All Types'); };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header-gradient">
        <h2 className="page-header-title">Interactive Map</h2>
        <p className="page-header-desc">View all reported problems on the map. Click on markers to see details.</p>
      </div>

      {/* Filters */}
      <div className="card map-filters-card">
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={18} style={{ color: 'var(--primary-600)' }} />
            Map Filters
          </h3>
          <p className="card-subtitle">Filter problems shown on the map</p>
        </div>
        <div className="filters-bar" style={{ paddingTop: 12 }}>
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All Types</option>
              <option>Pothole</option>
              <option>Water</option>
              <option>Streetlight</option>
              <option>Garbage</option>
            </select>
          </div>
          <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--primary-600)' }} />
            Map Legend
          </h3>
        </div>
        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot high"></span> High Priority</div>
          <div className="legend-item"><span className="legend-dot medium"></span> Medium Priority</div>
          <div className="legend-item"><span className="legend-dot low"></span> Low Priority</div>
          <div className="legend-item"><span className="legend-dot inprogress"></span> In Progress</div>
          <div className="legend-item"><span className="legend-dot resolved"></span> Resolved</div>
        </div>
      </div>

      {/* Map */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Problems Map ({filtered.length} problems shown)</h3>
          <p className="card-subtitle">Click on any marker to view problem details</p>
        </div>
        <div className="map-wrapper">
          <div ref={mapRef} className="map-container-full" id="problems-map"></div>
        </div>
      </div>
    </div>
  );
}

function getMarkerColor(problem) {
  if (problem.status === 'Resolved') return '#4caf50';
  if (problem.status === 'In Progress') return '#ff9800';
  switch (problem.priority) {
    case 'High': return '#f44336';
    case 'Medium': return '#ff9800';
    default: return '#9e9e9e';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Pending': return '#ff9800';
    case 'In Progress': return '#2196f3';
    case 'Resolved': return '#4caf50';
    default: return '#9e9e9e';
  }
}

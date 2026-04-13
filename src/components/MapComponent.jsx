// ─── Map Component ───
// Interactive Leaflet map with color-coded markers by criticality.

import React, { useEffect, useRef } from 'react';

const CRITICALITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

const STATUS_COLORS = {
  resolved: '#2563EB',
};

const MapComponent = ({ issues = [], userLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    const center = userLocation
      ? [userLocation.lat, userLocation.lon]
      : [26.9124, 75.7873]; // Default: Jaipur

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Clear old markers
    markersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="
          width: 20px; height: 20px; border-radius: 50%;
          background: #3B82F6; border: 3px solid #fff;
          box-shadow: 0 0 0 8px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>📍 Your Location</b>');
    }

    // Add issue markers with criticality colors + size
    issues.forEach((issue) => {
      const lat = issue.latitude || issue.lat;
      const lon = issue.longitude || issue.lon;
      if (!lat || !lon) return;

      const color = issue.status === 'resolved'
        ? STATUS_COLORS.resolved
        : CRITICALITY_COLORS[issue.criticality] || CRITICALITY_COLORS.medium;

      // Bigger markers for higher criticality
      const size = issue.criticality === 'critical' ? 32 : issue.criticality === 'high' ? 28 : 24;
      const pulse = issue.escalated ? 'animation: pulse 2s infinite; box-shadow: 0 0 12px rgba(220,38,38,0.6);' : 'box-shadow: 0 2px 8px rgba(0,0,0,0.3);';

      const icon = L.divIcon({
        className: 'issue-marker',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; border: 3px solid #fff;
          ${pulse}
          display: flex; align-items: center; justify-content: center;
          font-size: ${size > 26 ? 14 : 10}px;
        ">${issue.escalated ? '⚠️' : (issue.department?.icon || issue.department_icon || '')}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const statusLabel = issue.status === 'in_progress' ? 'In Progress' : issue.status === 'pending_verification' ? 'Verify' : (issue.status || 'pending');
      const deptName = issue.department?.name || issue.department_name || 'General';
      const hodName = issue.department?.hodName || '';
      const hodPhone = issue.department?.hodPhone || '';

      const marker = L.marker([lat, lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 200px; font-family: Inter, sans-serif;">
            <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 700;">${issue.title}</h3>
            <p style="margin: 0 0 6px; font-size: 12px; color: #666;">📍 ${issue.locationText || deptName}</p>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom: 6px;">
              <span style="padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; color:#fff; background:${color}">${issue.criticality || 'medium'}</span>
              <span style="padding:2px 8px; border-radius:12px; font-size:10px; font-weight:500; background:#f0f0f0; color:#333">${statusLabel}</span>
              ${issue.escalated ? '<span style="padding:2px 8px; border-radius:12px; font-size:10px; font-weight:600; color:#fff; background:#EF4444">🚨</span>' : ''}
            </div>
            ${hodName ? `<p style="margin:0 0 2px;font-size:11px;color:#333;">👤 <strong>${hodName}</strong></p>` : ''}
            ${hodPhone ? `<p style="margin:0 0 2px;font-size:11px;"><a href="tel:${hodPhone}" style="color:#2563EB;">📱 ${hodPhone}</a></p>` : ''}
            <p style="margin:4px 0 0; font-size:11px; color:#F59E0B; font-weight:600;">👍 ${issue.upvote_count || issue.upvoteCount || 0} votes</p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds
    const allPoints = [];
    if (userLocation) allPoints.push([userLocation.lat, userLocation.lon]);
    issues.forEach((i) => {
      const lat = i.latitude || i.lat;
      const lon = i.longitude || i.lon;
      if (lat && lon) allPoints.push([lat, lon]);
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [issues, userLocation]);

  return <div ref={mapRef} className="map-embed" />;
};

export default MapComponent;

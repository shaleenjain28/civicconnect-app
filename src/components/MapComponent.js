import React, { useEffect, useRef } from 'react';

const MapComponent = ({ issues }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const L = window.L;
    useEffect(() => {
        if (L && mapContainerRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current).setView([26.86, 75.8], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapInstanceRef.current);
        }
        if (mapInstanceRef.current && issues) {
            mapInstanceRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });
            issues.forEach((issue) => {
                L.marker([issue.lat, issue.lon])
                    .addTo(mapInstanceRef.current)
                    .bindPopup(`<b>${issue.title}</b><br>${issue.category}`);
            });
        }
    }, [issues, L]);
    return <div ref={mapContainerRef} className="map-container" />;
};

export default MapComponent;

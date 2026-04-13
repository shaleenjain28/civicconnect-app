// ─── Location Service ───
// Handles GPS location, permissions, and reverse geocoding on the client.

export const locationService = {
  /**
   * Get the user's current GPS position.
   * Returns: { lat, lon, accuracy }
   * Throws if permission denied or unavailable.
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable location access.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location unavailable. Please try again.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out. Please try again.'));
              break;
            default:
              reject(new Error('Could not get your location.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        }
      );
    });
  },

  /**
   * Reverse geocode coordinates to a human-readable address.
   * Uses free Nominatim API (OpenStreetMap).
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
        { headers: { 'User-Agent': 'CivicConnect/1.0' } }
      );

      if (!response.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      const data = await response.json();
      if (data.address) {
        const parts = [
          data.address.road,
          data.address.suburb || data.address.neighbourhood,
          data.address.city || data.address.town || data.address.village,
          data.address.state,
        ].filter(Boolean);
        return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  },

  /**
   * Format distance in meters to a human-readable string.
   */
  formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  },

  /**
   * Save user's last known location for offline use.
   */
  saveLocation(location) {
    localStorage.setItem('cc_location', JSON.stringify(location));
  },

  /**
   * Get saved location (fallback if GPS fails).
   */
  getSavedLocation() {
    try {
      return JSON.parse(localStorage.getItem('cc_location'));
    } catch {
      // Default to Jaipur center
      return { lat: 26.9124, lon: 75.7873 };
    }
  },
};

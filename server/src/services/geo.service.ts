// ─── Geolocation Service ───
// Handles geospatial calculations and reverse geocoding.
// PostGIS queries are done via Prisma raw SQL (Prisma doesn't natively support PostGIS).

/**
 * Calculate distance between two points using the Haversine formula.
 * Returns distance in meters.
 *
 * This is a pure math function — no database needed.
 * Used for client-side distance display.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates a raw SQL WHERE clause for finding issues within a radius.
 * Uses the Haversine formula in SQL since PostGIS might not be available.
 *
 * This is the "application-layer geo" approach — works on any PostgreSQL
 * without extensions. If PostGIS is available, we can swap to ST_DWithin.
 */
export function buildNearbyWhereClause(lat: number, lon: number, radiusMeters: number): string {
  // Haversine formula in SQL
  return `(
    6371000 * acos(
      LEAST(1.0, cos(radians(${lat})) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lon})) +
      sin(radians(${lat})) * sin(radians(latitude)))
    )
  ) <= ${radiusMeters}`;
}

/**
 * Generates an ORDER BY clause to sort by distance (nearest first).
 */
export function buildDistanceOrderClause(lat: number, lon: number): string {
  return `(
    6371000 * acos(
      LEAST(1.0, cos(radians(${lat})) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lon})) +
      sin(radians(${lat})) * sin(radians(latitude)))
    )
  )`;
}

/**
 * Reverse geocode coordinates to a human-readable address.
 * Uses free Nominatim API (OpenStreetMap).
 * Rate limited: max 1 request/second.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CivicConnect/1.0' }, // Required by Nominatim TOS
    });

    if (!response.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    const data = await response.json() as { display_name?: string; address?: Record<string, string> };

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
}

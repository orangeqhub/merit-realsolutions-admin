/** Shared lat/lng validation — no imports to avoid module cycles. */

export function parseStrictCoordinate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLatitude(lat) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng) {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

/**
 * Detect lat/lng pasted into the wrong fields (common for India: ~16°N, ~80°E).
 */
export function resolveLatLngPair(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!isValidLatitude(la) || !isValidLongitude(lo)) {
    return { lat: la, lng: lo, swapped: false };
  }

  // India/APAC: longitude (68–97) entered as latitude, latitude (6–37) as longitude
  if (la >= 68 && la <= 97 && lo >= 6 && lo <= 37) {
    return { lat: lo, lng: la, swapped: true };
  }

  return { lat: la, lng: lo, swapped: false };
}

/** Approximate distance in meters between two WGS84 points. */
export function haversineDistanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;

  return 2 * earthRadiusM * Math.asin(Math.min(1, Math.sqrt(h)));
}

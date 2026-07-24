import { isValidLatitude, isValidLongitude } from './geoValidation.js';

function dmsToDecimal(degrees, minutes, seconds, direction) {
  let value = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;
  if (direction === 'S' || direction === 'W') value *= -1;
  return value;
}

/**
 * Extract coordinates from Google Maps share / place URLs.
 */
export function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== 'string') return null;

  let decoded = url.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = url.trim();
  }

  // Dropped pin (3d/4d) is more precise than the @ map viewport center.
  let match = decoded.match(/3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (match) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidLatitude(lat) && isValidLongitude(lng)) return { lat, lng };
  }

  match = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidLatitude(lat) && isValidLongitude(lng)) return { lat, lng };
  }

  match = decoded.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (match) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidLatitude(lat) && isValidLongitude(lng)) return { lat, lng };
  }

  match = decoded.match(
    /(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)'([\d.]+)"?\s*([NS]).*?(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)'([\d.]+)"?\s*([EW])/i
  );
  if (match) {
    const lat = dmsToDecimal(match[1], match[2], match[3], match[4].toUpperCase());
    const lng = dmsToDecimal(match[5], match[6], match[7], match[8].toUpperCase());
    if (isValidLatitude(lat) && isValidLongitude(lng)) return { lat, lng };
  }

  return null;
}

export function parseGoogleMapsZoom(url, fallback = 18) {
  if (!url || typeof url !== 'string') return fallback;

  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    decoded = url;
  }

  const metersMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)m/i);
  if (metersMatch) {
    const meters = Number(metersMatch[3]);
    if (meters <= 120) return 20;
    if (meters <= 250) return 19;
    if (meters <= 500) return 18;
    if (meters <= 1200) return 17;
    return 16;
  }

  const zoomMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)z/i);
  if (zoomMatch) {
    const zoom = Number(zoomMatch[3]);
    if (Number.isFinite(zoom)) return Math.max(14, Math.min(21, zoom));
  }

  return fallback ?? 18;
}

export function applyMapUrlGeo(record) {
  if (!record?.mapUrl) return record;
  const coords = parseGoogleMapsUrl(record.mapUrl);
  if (!coords) return record;

  return {
    ...record,
    latitude: coords.lat,
    longitude: coords.lng,
    centerLat: coords.lat,
    centerLng: coords.lng,
    mapZoom: parseGoogleMapsZoom(record.mapUrl, record.mapZoom || 18),
  };
}

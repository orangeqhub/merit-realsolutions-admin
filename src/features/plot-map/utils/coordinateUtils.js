import { parseGoogleMapsUrl, parseGoogleMapsZoom } from '../../../shared/utils/mapUrlParser.js';
import {
  isValidLatitude,
  isValidLongitude,
  parseStrictCoordinate,
} from '../../../shared/utils/geoValidation.js';

const FALLBACK_CENTER = { lat: 17.2403, lng: 78.4294 };

export { isValidLatitude, isValidLongitude, parseStrictCoordinate };

export function parseCoordinate(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickCenter(source) {
  if (!source) return null;
  const lat = parseStrictCoordinate(source.lat ?? source.latitude);
  const lng = parseStrictCoordinate(source.lng ?? source.longitude);
  if (lat == null || lng == null) return null;
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  return { lat, lng };
}

/**
 * Resolve map camera for a layout workspace.
 *
 * Geo fallback order (SSOT-safe — uses raw layout + venture, not merged view):
 * 1. Layout-specific (mapUrl / center / lat-lng)
 * 2. Venture geo (mapUrl / lat-lng)
 * 3. Default fallback center
 */
export function resolveMapCenter(venture, layout) {
  const candidates = [
    parseGoogleMapsUrl(layout?.mapUrl),
    pickCenter({ lat: layout?.centerLat, lng: layout?.centerLng }),
    pickCenter(layout),
    parseGoogleMapsUrl(venture?.mapUrl),
    pickCenter({ lat: venture?.centerLat, lng: venture?.centerLng }),
    pickCenter(venture),
  ];

  for (const candidate of candidates) {
    if (candidate) return candidate;
  }

  return { ...FALLBACK_CENTER };
}

export function resolveMapZoom(venture, layout) {
  if (layout?.mapUrl) {
    const zoom = parseGoogleMapsZoom(layout.mapUrl, null);
    if (zoom != null) return zoom;
  }

  if (venture?.mapUrl) {
    const zoom = parseGoogleMapsZoom(venture.mapUrl, null);
    if (zoom != null) return zoom;
  }

  if (layout?.mapZoom) return Number(layout.mapZoom) || 18;
  if (venture?.mapZoom) return Number(venture.mapZoom) || 18;

  return 18;
}

export function resolveMapView(venture, layout) {
  const center = resolveMapCenter(venture, layout);
  const zoom = resolveMapZoom(venture, layout);
  const source = resolveMapCenterSource(venture, layout);

  return { center, zoom, source };
}

export function resolveMapCenterSource(venture, layout) {
  if (parseGoogleMapsUrl(layout?.mapUrl)) return 'layout-map-url';
  if (pickCenter({ lat: layout?.centerLat, lng: layout?.centerLng })) return 'layout-center';
  if (pickCenter(layout)) return 'layout-coordinates';
  if (parseGoogleMapsUrl(venture?.mapUrl)) return 'venture-map-url';
  if (pickCenter({ lat: venture?.centerLat, lng: venture?.centerLng })) return 'venture-center';
  if (pickCenter(venture)) return 'venture-coordinates';
  return 'default-fallback';
}

export function formatCoordinate(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(6);
}

export function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function toLatLng(coords) {
  if (!coords) return null;
  return [parseCoordinate(coords.lat), parseCoordinate(coords.lng)];
}

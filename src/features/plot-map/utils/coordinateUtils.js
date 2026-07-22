export function parseCoordinate(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveMapCenter(venture, layout) {
  const lat = parseCoordinate(
    layout?.centerLat ?? layout?.latitude ?? venture?.latitude,
    17.2403
  );
  const lng = parseCoordinate(
    layout?.centerLng ?? layout?.longitude ?? venture?.longitude,
    78.4294
  );
  return { lat, lng };
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

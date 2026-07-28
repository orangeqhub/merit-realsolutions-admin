import {
  feetToMeters,
  metersToLatitudeDegrees,
  metersToLongitudeDegrees,
} from '../layoutGeneration/geoUtils.js';

const COORD_PAIR = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g;

/** Parse "lng,lat; lng,lat" strings into { lat, lng }[] (Excel convention). */
export function parsePolylineString(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return [];

  const points = [];
  let match;
  COORD_PAIR.lastIndex = 0;
  while ((match = COORD_PAIR.exec(text)) !== null) {
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    points.push({ lat, lng });
  }
  return points;
}

export function pointsToPolylineString(points = []) {
  return points
    .map((point) => `${Number(point.lng).toFixed(6)},${Number(point.lat).toFixed(6)}`)
    .join(';');
}

export function isPolygonClosed(points = [], tolerance = 1e-5) {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return (
    Math.abs(first.lat - last.lat) <= tolerance
    && Math.abs(first.lng - last.lng) <= tolerance
  );
}

export function closePolygon(points = []) {
  if (!points.length) return [];
  if (isPolygonClosed(points)) return [...points];
  return [...points, { ...points[0] }];
}

/** Build a corridor polygon from a centerline polyline and road width in feet. */
export function polylineToCorridorPolygon(points = [], widthFt = 30) {
  if (points.length < 2) return [];

  const halfWidthM = feetToMeters(Number(widthFt) || 30) / 2;
  const left = [];
  const right = [];

  for (let i = 0; i < points.length; i += 1) {
    const curr = points[i];
    const prev = points[i - 1] || points[i];
    const next = points[i + 1] || points[i];

    const dLat = next.lat - prev.lat;
    const dLng = next.lng - prev.lng;
    const len = Math.hypot(dLat, dLng) || 1;
    const nx = -dLng / len;
    const ny = dLat / len;

    const latOffset = metersToLatitudeDegrees(halfWidthM);
    const lngOffset = metersToLongitudeDegrees(halfWidthM, curr.lat);

    left.push({
      lat: curr.lat + ny * latOffset,
      lng: curr.lng + nx * lngOffset,
    });
    right.unshift({
      lat: curr.lat - ny * latOffset,
      lng: curr.lng - nx * lngOffset,
    });
  }

  return [...left, ...right];
}

export function polygonAreaSqFt(points = []) {
  if (points.length < 3) return 0;
  const closed = isPolygonClosed(points) ? points : closePolygon(points);
  let sum = 0;
  for (let i = 0; i < closed.length - 1; i += 1) {
    const p1 = closed[i];
    const p2 = closed[i + 1];
    sum += p1.lng * p2.lat - p2.lng * p1.lat;
  }
  const areaDeg = Math.abs(sum) / 2;
  const midLat = closed.reduce((acc, p) => acc + p.lat, 0) / closed.length;
  const latScale = 111_320;
  const lngScale = 111_320 * Math.cos((midLat * Math.PI) / 180);
  return areaDeg * latScale * lngScale * 10.7639;
}

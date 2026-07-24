import {
  isValidLatitude,
  isValidLongitude,
  parseStrictCoordinate,
} from '../../../shared/utils/geoValidation.js';

export function normalizePolygonPoint(point) {
  if (!point) return null;
  const lat = parseStrictCoordinate(point.lat ?? point.latitude);
  const lng = parseStrictCoordinate(point.lng ?? point.longitude);
  if (lat == null || lng == null) return null;
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  return { lat, lng };
}

export function getPolygonPositions(polygonPoints = []) {
  return polygonPoints
    .map(normalizePolygonPoint)
    .filter(Boolean)
    .map(({ lat, lng }) => [lat, lng]);
}

export function computeCentroid(polygonPoints = []) {
  const points = polygonPoints.map(normalizePolygonPoint).filter(Boolean);
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
}

export function parseAndValidateCorners(form) {
  const corners = form?.corners || [];
  const points = [];
  const errors = [];

  for (let i = 0; i < 4; i += 1) {
    const corner = corners[i] || {};
    const latRaw = String(corner.lat ?? '').trim();
    const lngRaw = String(corner.lng ?? '').trim();
    const label = `Corner ${i + 1}`;

    if (!latRaw || !lngRaw) {
      errors.push(`${label}: enter both latitude and longitude.`);
      continue;
    }

    const lat = parseStrictCoordinate(latRaw);
    const lng = parseStrictCoordinate(lngRaw);

    if (lat == null || lng == null) {
      errors.push(`${label}: use decimal degrees (example: 16.555972, 80.385750).`);
      continue;
    }

    if (!isValidLatitude(lat)) {
      errors.push(`${label}: latitude must be between -90 and 90 (got ${latRaw}).`);
      continue;
    }

    if (!isValidLongitude(lng)) {
      errors.push(`${label}: longitude must be between -180 and 180 (got ${lngRaw}).`);
      continue;
    }

    points.push({ lat, lng });
  }

  if (errors.length) {
    return { valid: false, message: errors[0], points: [], allErrors: errors };
  }

  return { valid: true, points, message: '', allErrors: [] };
}

/** @deprecated use parseAndValidateCorners */
export function parseCornersFromForm(form) {
  return parseAndValidateCorners(form).points;
}

/** @deprecated use parseAndValidateCorners */
export function validatePolygonCorners(corners) {
  if (!Array.isArray(corners) || corners.length < 4) {
    return { valid: false, message: 'All four corner coordinates are required.' };
  }
  return { valid: true };
}

export function hasPlottablePolygon(plot) {
  return getPolygonPositions(plot?.polygonPoints).length >= 3;
}

export function filterPolygonPlots(plots = []) {
  return plots.filter(hasPlottablePolygon);
}

export function buildPreviewPlot(form, id = '__preview__') {
  const { points: polygonPoints } = parseAndValidateCorners(form);
  const centroid = computeCentroid(polygonPoints);
  return {
    id,
    plotNumber: form.plotNumber || 'Preview',
    status: form.status || 'Available',
    polygonPoints,
    latitude: centroid?.lat ?? null,
    longitude: centroid?.lng ?? null,
    shapeType: 'POLYGON',
  };
}

export const EMPTY_CORNERS = [
  { lat: '', lng: '' },
  { lat: '', lng: '' },
  { lat: '', lng: '' },
  { lat: '', lng: '' },
];

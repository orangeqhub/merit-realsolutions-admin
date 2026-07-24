/** Shared geometry helpers for layout health validation. */

export function getBBoxFromPoints(points = []) {
  if (!points.length) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  points.forEach(({ lat, lng }) => {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    minLat = Math.min(minLat, la);
    maxLat = Math.max(maxLat, la);
    minLng = Math.min(minLng, ln);
    maxLng = Math.max(maxLng, ln);
  });

  if (!Number.isFinite(minLat)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

export function getItemPoints(item) {
  return item?.polygonPoints || item?.coordinates || [];
}

export function getItemBBox(item) {
  return getBBoxFromPoints(getItemPoints(item));
}

export function bboxesOverlap(a, b, tolerance = 0) {
  if (!a || !b) return false;
  return !(
    a.maxLat + tolerance < b.minLat
    || a.minLat - tolerance > b.maxLat
    || a.maxLng + tolerance < b.minLng
    || a.minLng - tolerance > b.maxLng
  );
}

export function pointInsideBBox(point, bbox, epsilon = 0.000001) {
  if (!point || !bbox) return false;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return (
    lat >= bbox.minLat - epsilon
    && lat <= bbox.maxLat + epsilon
    && lng >= bbox.minLng - epsilon
    && lng <= bbox.maxLng + epsilon
  );
}

export function allPointsInsideBBox(points, bbox) {
  return points.every((point) => pointInsideBBox(point, bbox));
}

export function isValidPolygon(item) {
  const points = getItemPoints(item);
  return points.length >= 3 && points.every(
    (point) => Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))
  );
}

export function coordKey(point, precision = 6) {
  return `${Number(point.lat).toFixed(precision)},${Number(point.lng).toFixed(precision)}`;
}

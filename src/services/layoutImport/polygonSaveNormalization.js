import { isPolygonClosed } from './polylineUtils.js';

/**
 * Remove a duplicated closing vertex when first and last points match (import save path only).
 * Preserves coordinate values and winding order; does not truncate irregular polygons.
 */
export function openDuplicateClosingPoint(points = []) {
  if (points.length < 2) return points;
  if (!isPolygonClosed(points)) return points;
  return points.slice(0, -1);
}

export function normalizePlotPolygonsForSave(plot = {}) {
  const polygonPoints = Array.isArray(plot.polygonPoints) ? plot.polygonPoints : [];
  const coordinates = Array.isArray(plot.coordinates) ? plot.coordinates : [];

  const openedPolygon = openDuplicateClosingPoint(polygonPoints);
  const openedCoordinates =
    coordinates.length && coordinates !== polygonPoints
      ? openDuplicateClosingPoint(coordinates)
      : openedPolygon;

  const normalized =
    openedPolygon.length !== polygonPoints.length
    || openedCoordinates.length !== coordinates.length;

  return {
    plot: {
      ...plot,
      polygonPoints: openedPolygon,
      coordinates: openedCoordinates.length ? openedCoordinates : openedPolygon,
    },
    normalized,
  };
}

export function normalizePreviewPlotsForSave(plots = []) {
  let normalizedCount = 0;
  const normalizedPlots = plots.map((plot) => {
    const { plot: nextPlot, normalized } = normalizePlotPolygonsForSave(plot);
    if (normalized) normalizedCount += 1;
    return nextPlot;
  });

  return { plots: normalizedPlots, normalizedCount };
}

import { DEFAULT_PLOT_OVERLAY, SHAPE_TYPES } from '../constants/mapStatus';

/** Scale plot overlay size relative to map zoom */
export function getOverlayScale(zoom, base = 18) {
  return Math.max(0.55, Math.min(1.45, (zoom - 12) * 0.12 + 0.85));
}

export function getPlotDimensions(plot, zoom) {
  const scale = getOverlayScale(zoom);
  return {
    width: (plot.mapWidth || DEFAULT_PLOT_OVERLAY.mapWidth) * scale,
    height: (plot.mapHeight || DEFAULT_PLOT_OVERLAY.mapHeight) * scale,
    rotation: plot.rotation || 0,
    scale,
  };
}

export function hasMapPosition(plot) {
  return plot?.latitude != null && plot?.longitude != null;
}

export function isRectanglePlot(plot) {
  return (plot?.shapeType || SHAPE_TYPES.RECTANGLE) === SHAPE_TYPES.RECTANGLE;
}

export function isPolygonPlot(plot) {
  return plot?.shapeType === SHAPE_TYPES.POLYGON && Array.isArray(plot.polygonPoints) && plot.polygonPoints.length >= 3;
}

export function filterPlottablePlots(plots = []) {
  return plots.filter(hasMapPosition);
}

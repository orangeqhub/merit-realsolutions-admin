import { MAP_STATUS_COLORS } from '../constants/mapStatus';

/** Tile providers — OpenStreetMap + free satellite imagery (no API keys) */
export const MAP_TILE_LAYERS = {
  roadmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: 'Standard',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    label: 'Satellite',
  },
};

export const DEFAULT_MAP_ZOOM = 18;
export const MIN_MAP_ZOOM = 14;
export const MAX_MAP_ZOOM = 21;

export function getMapTypeLabel(mapType) {
  return MAP_TILE_LAYERS[mapType]?.label || MAP_TILE_LAYERS.roadmap.label;
}

export function countPlotsByStatus(plots = []) {
  const counts = {};
  Object.keys(MAP_STATUS_COLORS).forEach((status) => {
    counts[status] = 0;
  });
  plots.forEach((plot) => {
    if (counts[plot.status] !== undefined) counts[plot.status] += 1;
  });
  return counts;
}

export { MAP_STATUS_COLORS };

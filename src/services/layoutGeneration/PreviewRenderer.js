/** Map preview helpers — styling and bounds for Leaflet layers. */

import { ROAD_TYPES } from './RoadGenerator.js';
import { RoadGenerationService } from './services/RoadGenerationService.js';

export const ROAD_PREVIEW_STYLES = {
  [ROAD_TYPES.MAIN]: {
    color: '#475569',
    fillColor: '#64748b',
    fillOpacity: 0.85,
    weight: 2,
  },
  [ROAD_TYPES.INTERNAL]: {
    color: '#64748b',
    fillColor: '#94a3b8',
    fillOpacity: 0.72,
    weight: 1.5,
  },
  [ROAD_TYPES.SERVICE]: {
    color: '#78716c',
    fillColor: '#a8a29e',
    fillOpacity: 0.65,
    weight: 1.5,
    dashArray: '4 4',
  },
};

export const ROAD_PREVIEW_STYLE = ROAD_PREVIEW_STYLES[ROAD_TYPES.INTERNAL];

export const PLOT_PREVIEW_STYLE = {
  color: '#38bdf8',
  fillColor: '#0ea5e9',
  fillOpacity: 0.45,
  weight: 2,
  dashArray: '6 6',
};

export const AMENITY_PREVIEW_STYLE = {
  weight: 2,
  fillOpacity: 0.55,
};

export const BLOCK_LABEL_STYLE = {
  className: 'plot-block-label-marker',
};

function flattenCoordinates(items = []) {
  return items.flatMap((item) =>
    (item.polygonPoints || item.coordinates || []).map(({ lat, lng }) => [lat, lng])
  );
}

export function getRoadPreviewStyle(road) {
  return RoadGenerationService.getRoadMapStyle(road) || ROAD_PREVIEW_STYLE;
}

export function collectAllPreviewPositions(
  plots = [],
  roads = [],
  amenities = [],
  blockLabels = []
) {
  const labelPoints = blockLabels
    .filter((label) => label.latitude != null && label.longitude != null)
    .map((label) => [label.latitude, label.longitude]);

  return [
    ...flattenCoordinates(roads),
    ...flattenCoordinates(amenities),
    ...flattenCoordinates(plots),
    ...labelPoints,
  ];
}

export function preparePlotPreviewLayer(plots = []) {
  return plots.map((plot) => ({
    ...plot,
    layerType: 'plot',
    style: PLOT_PREVIEW_STYLE,
  }));
}

export function prepareRoadPreviewLayer(roads = []) {
  return roads.map((road) => ({
    ...road,
    layerType: 'road',
    style: getRoadPreviewStyle(road),
  }));
}

export function prepareAmenityPreviewLayer(amenities = []) {
  return amenities.map((amenity) => ({
    ...amenity,
    layerType: 'amenity',
    style: {
      ...AMENITY_PREVIEW_STYLE,
      color: amenity.style?.borderColor || '#059669',
      fillColor: amenity.style?.fillColor || '#86efac',
    },
  }));
}

/** @deprecated use collectAllPreviewPositions */
export function collectAllPositions(polygons = []) {
  return flattenCoordinates(polygons);
}

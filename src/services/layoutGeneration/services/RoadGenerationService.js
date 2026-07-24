import {
  generateBlockRoads,
  generateMainRoad,
  ROAD_TYPES,
  formatRoadLabel,
  formatRoadName,
} from '../RoadGenerator.js';

export function buildRoadDisplayLabel(roadType, widthFeet) {
  const name = formatRoadName(roadType, widthFeet);
  const width = Math.round(Number(widthFeet) || 0);
  return `${name}\n${width} FT`;
}

export function enrichRoadMetadata(road) {
  const direction = road.direction || road.type || 'horizontal';
  return {
    ...road,
    direction,
    roadName: road.name || formatRoadName(road.roadType, road.widthFeet),
    roadWidth: road.widthFeet,
    displayLabel: road.displayLabel || buildRoadDisplayLabel(road.roadType, road.widthFeet),
    label: road.label || formatRoadLabel(road.roadType, road.widthFeet),
  };
}

export function getRoadMapStyle(road) {
  const widthFeet = Number(road?.widthFeet) || 30;
  const roadType = road?.roadType;

  const base = {
    weight: Math.max(1.5, Math.min(5, widthFeet / 10)),
  };

  if (roadType === ROAD_TYPES.MAIN) {
    return {
      ...base,
      color: '#334155',
      fillColor: '#475569',
      fillOpacity: 0.88,
    };
  }

  if (roadType === ROAD_TYPES.SERVICE) {
    return {
      ...base,
      color: '#57534e',
      fillColor: '#78716c',
      fillOpacity: 0.72,
      dashArray: '5 4',
    };
  }

  return {
    ...base,
    color: '#475569',
    fillColor: '#64748b',
    fillOpacity: 0.78,
  };
}

export const RoadGenerationService = {
  generateBlockRoads,
  generateMainRoad,
  ROAD_TYPES,
  enrichRoadMetadata,
  buildRoadDisplayLabel,
  getRoadMapStyle,
};

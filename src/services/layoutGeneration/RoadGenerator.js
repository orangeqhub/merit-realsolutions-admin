import { rectangleFromFeet } from './geoUtils.js';
import { computeSingleBlockDimensions } from './geoUtils.js';

export const ROAD_TYPES = {
  MAIN: 'main',
  INTERNAL: 'internal',
  SERVICE: 'service',
};

export function formatRoadLabel(roadType, widthFeet) {
  const width = Math.round(Number(widthFeet) || 0);
  if (roadType === ROAD_TYPES.MAIN) return 'MAIN ROAD';
  if (roadType === ROAD_TYPES.SERVICE) return `${width} FT SERVICE ROAD`;
  return `${width} FT ROAD`;
}

export function formatRoadName(roadType, widthFeet) {
  const width = Math.round(Number(widthFeet) || 0);
  if (roadType === ROAD_TYPES.MAIN) return 'Main Road';
  if (roadType === ROAD_TYPES.SERVICE) return 'Service Road';
  return `${width} FT Road`;
}

function buildRoadRecord({
  id,
  roadType,
  widthFeet,
  coordinates,
  orientation,
  blockName = '',
}) {
  const direction = orientation;
  const name = formatRoadName(roadType, widthFeet);
  const width = Math.round(Number(widthFeet) || 0);
  const typeLabel =
    roadType === ROAD_TYPES.MAIN
      ? 'Main Road'
      : roadType === ROAD_TYPES.SERVICE
        ? 'Service Road'
        : 'Internal Road';

  return {
    id,
    name,
    roadName: name,
    roadType,
    type: orientation,
    direction,
    widthFeet,
    roadWidth: widthFeet,
    blockName,
    coordinates,
    polygonPoints: coordinates.map(({ lat, lng }) => ({ lat, lng })),
    label: formatRoadLabel(roadType, widthFeet),
    displayLabel: `${typeLabel}\n${width} FT`,
  };
}

/**
 * Internal + optional service roads within a single block.
 */
export function generateBlockRoads({
  rows,
  columns,
  plotWidthFeet,
  plotHeightFeet,
  internalRoadWidth,
  serviceRoadWidth,
  roadEveryRows,
  roadEveryColumns,
  enableServiceRoads,
  originLat,
  originLng,
  originNorthFeet = 0,
  originEastFeet = 0,
  blockName = '',
  blockWidthFeet,
  blockHeightFeet,
}) {
  const dims = computeSingleBlockDimensions({
    rows,
    columns,
    plotWidthFeet,
    plotHeightFeet,
    internalRoadWidth,
    serviceRoadWidth,
    roadEveryRows,
    roadEveryColumns,
    enableServiceRoads,
  });

  const width = dims.plotWidthFeet;
  const height = dims.plotHeightFeet;
  const internalRoad = dims.internalRoadWidth;
  const serviceRoad = dims.serviceRoadWidth;
  const everyRows = dims.roadEveryRows;
  const everyCols = dims.roadEveryColumns;
  const totalWidth = blockWidthFeet ?? dims.widthFeet;
  const totalHeight = blockHeightFeet ?? dims.heightFeet;

  const roads = [];
  let roadIndex = 0;

  for (let group = 0; group < dims.rowGroups - 1; group += 1) {
    const southNorth =
      originNorthFeet + (group + 1) * everyRows * height + group * internalRoad;
    const coordinates = rectangleFromFeet(
      originLat,
      originLng,
      southNorth,
      originEastFeet,
      totalWidth,
      internalRoad
    );

    roads.push(
      buildRoadRecord({
        id: `road-${blockName}-h-${roadIndex}`,
        roadType: ROAD_TYPES.INTERNAL,
        widthFeet: internalRoad,
        coordinates,
        orientation: 'horizontal',
        blockName,
      })
    );
    roadIndex += 1;
  }

  if (enableServiceRoads) {
    for (let group = 0; group < dims.colGroups - 1; group += 1) {
      const westEast =
        originEastFeet + (group + 1) * everyCols * width + group * serviceRoad;
      const coordinates = rectangleFromFeet(
        originLat,
        originLng,
        originNorthFeet,
        westEast,
        serviceRoad,
        totalHeight
      );

      roads.push(
        buildRoadRecord({
          id: `road-${blockName}-v-${roadIndex}`,
          roadType: ROAD_TYPES.SERVICE,
          widthFeet: serviceRoad,
          coordinates,
          orientation: 'vertical',
          blockName,
        })
      );
      roadIndex += 1;
    }
  }

  return roads;
}

/**
 * Main road band between two blocks.
 */
export function generateMainRoad({
  blockWidthFeet,
  mainRoadWidth,
  originLat,
  originLng,
  northFeet,
  eastFeet = 0,
  corridorId = '0',
}) {
  const coordinates = rectangleFromFeet(
    originLat,
    originLng,
    northFeet,
    eastFeet,
    blockWidthFeet,
    mainRoadWidth
  );

  return buildRoadRecord({
    id: `road-main-${corridorId}`,
    roadType: ROAD_TYPES.MAIN,
    widthFeet: mainRoadWidth,
    coordinates,
    orientation: 'horizontal',
    blockName: 'MAIN',
  });
}

/** @deprecated Sprint 2 single-block helper */
export function generateRoads(params) {
  return generateBlockRoads({
    ...params,
    internalRoadWidth: params.roadWidthFeet ?? params.internalRoadWidth,
    enableServiceRoads: false,
    blockWidthFeet: undefined,
    blockHeightFeet: undefined,
  });
}

export function formatRoadNameLegacy(roadWidthFeet) {
  return formatRoadName(ROAD_TYPES.INTERNAL, roadWidthFeet);
}

import {
  rectangleFromFeet,
  getPlotNorthOffset,
  getPlotEastOffset,
  offsetCoordinate,
} from './geoUtils.js';

function centroidFromCoordinates(coordinates) {
  const count = coordinates.length || 1;
  const sum = coordinates.reduce(
    (acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / count, lng: sum.lng / count };
}

/**
 * Generate plot polygons with automatic internal road-band spacing.
 */
export function generatePlots({
  rows,
  columns,
  plotWidthFeet,
  plotHeightFeet,
  internalRoadWidth,
  serviceRoadWidth = 20,
  roadEveryRows,
  roadEveryColumns,
  enableServiceRoads = false,
  originLat,
  originLng,
  originNorthFeet = 0,
  originEastFeet = 0,
  plotNumbers = [],
  blockName = '',
}) {
  const totalRows = Math.max(1, Math.floor(Number(rows) || 1));
  const totalCols = Math.max(1, Math.floor(Number(columns) || 1));
  const width = Number(plotWidthFeet);
  const height = Number(plotHeightFeet);
  const internalRoad = Number(internalRoadWidth) || 30;
  const serviceRoad = Number(serviceRoadWidth) || 20;
  const everyRows = Math.max(1, Math.floor(Number(roadEveryRows) || 1));
  const everyCols = Math.max(1, Math.floor(Number(roadEveryColumns) || 1));

  const plots = [];
  let index = 0;

  for (let row = 0; row < totalRows; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      const northFeet =
        originNorthFeet + getPlotNorthOffset(row, height, internalRoad, everyRows);
      const eastFeet =
        originEastFeet +
        getPlotEastOffset(
          col,
          width,
          enableServiceRoads ? serviceRoad : 0,
          everyCols
        );
      const coordinates = rectangleFromFeet(
        originLat,
        originLng,
        northFeet,
        eastFeet,
        width,
        height
      );
      const plotNumber = plotNumbers[index] || `P-${index + 1}`;
      const centroid = centroidFromCoordinates(coordinates);

      plots.push({
        id: `generated-${blockName || 'X'}-${plotNumber}`,
        plotNumber,
        blockName,
        coordinates,
        polygonPoints: coordinates.map(({ lat, lng }) => ({ lat, lng })),
        latitude: centroid.lat,
        longitude: centroid.lng,
        row,
        col,
        status: 'Available',
        shapeType: 'POLYGON',
      });
      index += 1;
    }
  }

  return plots;
}

export function buildBlockLabel({
  blockName,
  blockWidthFeet,
  blockHeightFeet,
  originLat,
  originLng,
  originNorthFeet,
  originEastFeet = 0,
}) {
  const centerNorth = originNorthFeet + blockHeightFeet / 2;
  const centerEast = originEastFeet + blockWidthFeet / 2;
  const position = offsetCoordinate(originLat, originLng, centerNorth, centerEast);

  return {
    id: `block-label-${blockName}`,
    blockName,
    label: `Block ${blockName}`,
    latitude: position.lat,
    longitude: position.lng,
  };
}

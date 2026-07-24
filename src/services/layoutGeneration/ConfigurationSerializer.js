import { getEnabledAmenityLabels } from './AmenityGenerator.js';

export function serializeConfiguration(params) {
  return {
    blocks: Math.floor(Number(params.numberOfBlocks) || 1),
    blockPrefix: String(params.blockPrefix || 'A').trim().toUpperCase(),
    rows: Math.floor(Number(params.rows) || 0),
    columns: Math.floor(Number(params.columns) || 0),
    plotWidth: Number(params.plotWidthFeet),
    plotHeight: Number(params.plotHeightFeet),
    startingPlotNumber: Number(params.startingPlotNumber) || 101,
    roadEveryRows: Math.floor(Number(params.roadEveryRows) || 5),
    roadEveryColumns: Math.floor(Number(params.roadEveryColumns) || 8),
    mainRoadWidth: Number(params.mainRoadWidth),
    internalRoadWidth: Number(params.internalRoadWidth),
    serviceRoadWidth: Number(params.serviceRoadWidth),
    enableServiceRoads: Boolean(params.enableServiceRoads),
    blockSpacing: Number(params.blockSpacing),
    amenities: getEnabledAmenityLabels(params.amenities || {}),
    startingLatitude: Number(params.startingLatitude),
    startingLongitude: Number(params.startingLongitude),
  };
}

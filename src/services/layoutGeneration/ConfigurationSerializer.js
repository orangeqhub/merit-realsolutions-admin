import { getEnabledAmenityLabels } from './AmenityGenerator.js';

export function serializeConfiguration(params) {
  return {
    // Premium township generator config
    townshipSize: params.townshipSize || 'medium',
    density: params.density || 'medium',
    roadStyle: params.roadStyle || 'premium',
    amenitiesLevel: params.amenitiesLevel || 'standard',
    commercialPercent: Number(params.commercialPercent) || 8,
    cornerPlotPercent: Number(params.cornerPlotPercent) || 12,
    parkPercent: Number(params.parkPercent) || 10,
    openSpacePercent: Number(params.openSpacePercent) || 15,
    roadWidthPreset: params.roadWidthPreset || 'DTCP',
    randomSeed: params.randomSeed !== '' && params.randomSeed != null ? Number(params.randomSeed) : null,
    boundaryShape: params.boundaryShape || 'auto',
    plotNumbering: params.plotNumbering || 'block-wise',

    // Legacy compat fields
    blocks: Math.floor(Number(params.numberOfBlocks) || 5),
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
    secondaryRoadWidth: Number(params.secondaryRoadWidth) || 24,
    enableServiceRoads: Boolean(params.enableServiceRoads),
    blockSpacing: Number(params.blockSpacing),
    amenities: getEnabledAmenityLabels(params.amenities || {}),
    startingLatitude: Number(params.startingLatitude),
    startingLongitude: Number(params.startingLongitude),
    generator: 'gis-township-engine-v1',
  };
}

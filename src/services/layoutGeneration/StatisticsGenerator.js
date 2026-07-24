import { computeSingleBlockDimensions } from './geoUtils.js';
import { getEnabledAmenityKeys, estimateAmenityHeight, AMENITY_TYPES } from './AmenityGenerator.js';

function parsePositiveInt(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function countBlockInternalRoads(params, blockDims) {
  const horizontalRoads = Math.max(0, blockDims.rowGroups - 1);
  const verticalRoads = blockDims.enableServiceRoads
    ? Math.max(0, blockDims.colGroups - 1)
    : 0;
  return { horizontalRoads, verticalRoads, total: horizontalRoads + verticalRoads };
}

export function countRoads(params) {
  const numberOfBlocks = parsePositiveInt(params.numberOfBlocks, 1);
  const blockDims = computeSingleBlockDimensions(params);
  const perBlock = countBlockInternalRoads(params, blockDims);
  const mainRoads = Math.max(0, numberOfBlocks - 1);

  return {
    internal: perBlock.total * numberOfBlocks,
    main: mainRoads,
    total: perBlock.total * numberOfBlocks + mainRoads,
    horizontalRoads: perBlock.horizontalRoads * numberOfBlocks,
    verticalRoads: perBlock.verticalRoads * numberOfBlocks,
  };
}

export function computeStatistics(params, previewCounts = null) {
  const rows = parsePositiveInt(params.rows, 0);
  const columns = parsePositiveInt(params.columns, 0);
  const numberOfBlocks = parsePositiveInt(params.numberOfBlocks, 1);
  const plotWidthFeet = Number(params.plotWidthFeet);
  const plotHeightFeet = Number(params.plotHeightFeet);

  const plots = rows > 0 && columns > 0 ? rows * columns * numberOfBlocks : 0;
  const plotAreaSqFt =
    Number.isFinite(plotWidthFeet) &&
    Number.isFinite(plotHeightFeet) &&
    plotWidthFeet > 0 &&
    plotHeightFeet > 0
      ? plotWidthFeet * plotHeightFeet
      : 0;

  const plotAreaSqYds = plots > 0 && plotAreaSqFt > 0 ? Math.round((plots * plotAreaSqFt) / 9) : 0;

  const amenityKeys = getEnabledAmenityKeys(params.amenities || {});
  const amenityAreaSqFt = amenityKeys.reduce(
    (sum, key) => sum + (AMENITY_TYPES[key]?.heightFeet || 0) * (computeSingleBlockDimensions(params).widthFeet * (AMENITY_TYPES[key]?.widthRatio || 1)),
    0
  );
  const amenityAreaSqYds = Math.round(amenityAreaSqFt / 9);

  const roadCounts = countRoads(params);

  const previewObjects =
    previewCounts?.previewObjects ??
    plots + roadCounts.total + amenityKeys.length + numberOfBlocks;

  return {
    blocks: numberOfBlocks,
    plots,
    roads: previewCounts?.roads ?? roadCounts.total,
    amenities: amenityKeys.length,
    estimatedArea: plotAreaSqYds + amenityAreaSqYds,
    previewObjects,
    rows,
    columns,
    plotWidthFeet,
    plotHeightFeet,
    internalRoadWidth: Number(params.internalRoadWidth) || 30,
    mainRoadWidth: Number(params.mainRoadWidth) || 40,
    serviceRoadWidth: Number(params.serviceRoadWidth) || 20,
    blockSpacing: Number(params.blockSpacing) || 50,
    roadEveryRows: parsePositiveInt(params.roadEveryRows, 5),
    roadEveryColumns: parsePositiveInt(params.roadEveryColumns, 8),
    horizontalRoads: roadCounts.horizontalRoads,
    verticalRoads: roadCounts.verticalRoads,
    mainRoads: roadCounts.main,
    amenityHeightFeet: estimateAmenityHeight(params.amenities || {}),
  };
}

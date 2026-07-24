import { computeSingleBlockDimensions } from '../geoUtils.js';
import { computeTotalLayoutFootprint } from '../BlockGenerator.js';
import { countRoads } from '../StatisticsGenerator.js';
import { AmenityGenerationService } from './AmenityGenerationService.js';
import { PlotGenerationService } from './PlotGenerationService.js';

function parsePositiveInt(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sqYdsFromSqFt(sqFt) {
  return Math.round((sqFt / 9) * 100) / 100;
}

export function computeDetailedStatistics(params, previewCounts = null) {
  const rows = parsePositiveInt(params.rows, 0);
  const columns = parsePositiveInt(params.columns, 0);
  const numberOfBlocks = parsePositiveInt(params.numberOfBlocks, 1);
  const plotWidthFeet = Number(params.plotWidthFeet);
  const plotHeightFeet = Number(params.plotHeightFeet);
  const blockDims = computeSingleBlockDimensions(params);
  const footprint = computeTotalLayoutFootprint(params);

  const plotCount = rows > 0 && columns > 0 ? rows * columns * numberOfBlocks : 0;
  const plotAreaSqFt =
    Number.isFinite(plotWidthFeet) && Number.isFinite(plotHeightFeet) && plotWidthFeet > 0 && plotHeightFeet > 0
      ? plotWidthFeet * plotHeightFeet
      : 0;

  const saleableAreaSqYds = plotCount > 0 && plotAreaSqFt > 0
    ? sqYdsFromSqFt(plotCount * plotAreaSqFt)
    : 0;

  const roadCounts = countRoads(params);
  const internalRoadWidth = Number(params.internalRoadWidth) || 30;
  const mainRoadWidth = Number(params.mainRoadWidth) || 40;
  const serviceRoadWidth = Number(params.serviceRoadWidth) || 20;
  const blockSpacing = Number(params.blockSpacing) || 0;

  const internalRoadAreaSqFt =
    roadCounts.horizontalRoads * blockDims.widthFeet * internalRoadWidth
    + roadCounts.verticalRoads * blockDims.heightFeet * serviceRoadWidth;
  const mainRoadAreaSqFt = roadCounts.main * blockDims.widthFeet * mainRoadWidth;
  const spacingAreaSqFt = Math.max(0, numberOfBlocks - 1) * blockSpacing * blockDims.widthFeet;
  const roadAreaSqYds = sqYdsFromSqFt(internalRoadAreaSqFt + mainRoadAreaSqFt + spacingAreaSqFt);

  const amenityKeys = AmenityGenerationService.getEnabledAmenityKeys(params.amenities || {});
  const amenityAreaSqFt = amenityKeys.reduce((sum, key) => {
    const def = AmenityGenerationService.AMENITY_TYPES[key];
    return sum + (def?.heightFeet || 0) * (blockDims.widthFeet * (def?.widthRatio || 1));
  }, 0);
  const amenityAreaSqYds = sqYdsFromSqFt(amenityAreaSqFt);

  const totalLayoutAreaSqYds = sqYdsFromSqFt(footprint.totalWidthFeet * footprint.totalHeightFeet);

  const previewObjects =
    previewCounts?.previewObjects
    ?? plotCount + (previewCounts?.roads ?? roadCounts.total) + amenityKeys.length + numberOfBlocks;

  return {
    blocks: numberOfBlocks,
    plots: plotCount,
    roads: previewCounts?.roads ?? roadCounts.total,
    amenities: amenityKeys.length,
    estimatedArea: saleableAreaSqYds + amenityAreaSqYds,
    saleableAreaSqYds,
    roadAreaSqYds,
    amenityAreaSqYds,
    totalLayoutAreaSqYds,
    previewObjects,
    rows,
    columns,
    plotWidthFeet,
    plotHeightFeet,
    footprint,
  };
}

export const LayoutStatisticsService = {
  computeDetailedStatistics,
  estimateStatistics: computeDetailedStatistics,
  sqYardsFromFeet: PlotGenerationService.sqYardsFromFeet,
};

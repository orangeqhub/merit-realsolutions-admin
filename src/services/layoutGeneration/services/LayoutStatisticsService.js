import { computeTotalLayoutFootprint } from '../BlockGenerator.js';
import { estimateTownshipStatistics } from '../township/TownshipGenerator.js';
import { PlotGenerationService } from './PlotGenerationService.js';

function parsePositiveInt(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sqYdsFromSqFt(sqFt) {
  return Math.round((sqFt / 9) * 100) / 100;
}

export function computeDetailedStatistics(params, previewCounts = null) {
  const estimate = estimateTownshipStatistics(params);
  const footprint = computeTotalLayoutFootprint(params);

  const plotCount = previewCounts?.plots ?? estimate.targetPlots;
  const blockCount = previewCounts?.blocks ?? estimate.estimatedBlocks;
  const roadCount = previewCounts?.roads ?? Math.round(blockCount * 4 + 6);
  const amenityCount = previewCounts?.amenities
    ?? (params.amenitiesLevel === 'luxury' ? 10 : params.amenitiesLevel === 'basic' ? 3 : 6);

  const avgPlotAreaSqFt = 30 * 50;
  const saleableAreaSqYds = sqYdsFromSqFt(plotCount * avgPlotAreaSqFt);

  const roadAreaSqFt = footprint.totalWidthFeet * 50 + footprint.totalHeightFeet * 40;
  const roadAreaSqYds = sqYdsFromSqFt(roadAreaSqFt);

  const amenityAreaSqFt = footprint.totalWidthFeet * footprint.totalHeightFeet * 0.12;
  const amenityAreaSqYds = sqYdsFromSqFt(amenityAreaSqFt);

  const totalLayoutAreaSqYds = sqYdsFromSqFt(footprint.totalWidthFeet * footprint.totalHeightFeet);

  const previewObjects =
    previewCounts?.previewObjects
    ?? plotCount + roadCount + amenityCount + blockCount;

  return {
    blocks: blockCount,
    plots: plotCount,
    roads: roadCount,
    amenities: amenityCount,
    estimatedArea: saleableAreaSqYds + amenityAreaSqYds,
    saleableAreaSqYds,
    roadAreaSqYds,
    amenityAreaSqYds,
    totalLayoutAreaSqYds,
    previewObjects,
    rows: Math.ceil(Math.sqrt(plotCount / blockCount)),
    columns: Math.ceil(plotCount / blockCount / Math.ceil(Math.sqrt(plotCount / blockCount))),
    plotWidthFeet: Number(params.plotWidthFeet) || 40,
    plotHeightFeet: Number(params.plotHeightFeet) || 60,
    footprint,
    targetPlots: estimate.targetPlots,
    townshipSize: params.townshipSize || 'medium',
    density: params.density || 'medium',
  };
}

export const LayoutStatisticsService = {
  computeDetailedStatistics,
  estimateStatistics: computeDetailedStatistics,
  sqYardsFromFeet: PlotGenerationService.sqYardsFromFeet,
};

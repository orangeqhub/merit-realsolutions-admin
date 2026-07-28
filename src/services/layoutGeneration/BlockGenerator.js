import { generatePremiumTownshipLayout, estimateTownshipStatistics } from './township/TownshipGenerator.js';
import { TOWNSHIP_SIZES, DENSITY_MULTIPLIERS } from './township/presets.js';

/**
 * Resolve block letter names from a starting prefix: A → A,B,C…
 */
export function generateBlockNames(blockPrefix = 'A', numberOfBlocks = 1) {
  const count = Math.max(1, Math.floor(Number(numberOfBlocks) || 1));
  const prefix = String(blockPrefix || 'A').trim().toUpperCase();
  const startCode = prefix.charCodeAt(0);
  const names = [];

  for (let i = 0; i < count; i += 1) {
    names.push(String.fromCharCode(startCode + i));
  }

  return names;
}

/** @deprecated — kept for statistics compat; dimensions derived from actual generation */
export function computeSingleBlockDimensions(params) {
  const estimate = estimateTownshipStatistics(params);
  const plotCount = estimate.targetPlots;
  const blocks = estimate.estimatedBlocks;
  const rows = Math.max(1, Math.ceil(Math.sqrt(plotCount / blocks)));
  const columns = Math.max(1, Math.ceil(plotCount / blocks / rows));

  return {
    rows,
    columns,
    plotWidthFeet: Number(params.plotWidthFeet) || 40,
    plotHeightFeet: Number(params.plotHeightFeet) || 60,
    internalRoadWidth: Number(params.internalRoadWidth) || 33,
    serviceRoadWidth: Number(params.serviceRoadWidth) || 18,
    roadEveryRows: 5,
    roadEveryColumns: 8,
    enableServiceRoads: true,
    heightFeet: estimate.boundaryHeight * 0.4,
    widthFeet: estimate.boundaryWidth * 0.4,
    rowGroups: Math.ceil(rows / 5),
    colGroups: Math.ceil(columns / 8),
  };
}

/**
 * Compute total layout footprint from township size preset.
 */
export function computeTotalLayoutFootprint(params) {
  const sizeKey = params.townshipSize || 'medium';
  const densityKey = params.density || 'medium';
  const size = TOWNSHIP_SIZES[sizeKey] || TOWNSHIP_SIZES.medium;
  const densityMult = DENSITY_MULTIPLIERS[densityKey] || 1;

  return {
    totalHeightFeet: size.heightFeet,
    totalWidthFeet: size.widthFeet,
    centerOffsetNorthFeet: -size.heightFeet / 2,
    centerOffsetEastFeet: -size.widthFeet / 2,
    targetPlots: Math.round(size.targetPlots * densityMult),
  };
}

/**
 * Generate a full premium township layout (plots, roads, amenities, labels).
 * Replaces legacy grid stacking with DTCP/RERA-style hierarchical generation.
 */
export function generateMultiBlockLayout(params, originLat, originLng) {
  return generatePremiumTownshipLayout(params, originLat, originLng);
}

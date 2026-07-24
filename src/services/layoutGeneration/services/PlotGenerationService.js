import { generatePlots, buildBlockLabel } from '../PlotGenerator.js';

export function sqYardsFromFeet(widthFeet, heightFeet) {
  const w = Number(widthFeet);
  const h = Number(heightFeet);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 0;
  return Math.round(((w * h) / 9) * 100) / 100;
}

export function formatPlotDimensions(widthFeet, heightFeet) {
  return `${Math.round(Number(widthFeet) || 0)} × ${Math.round(Number(heightFeet) || 0)} ft`;
}

export function computePlotFacing(row, col, totalRows, totalCols) {
  const isEast = col === totalCols - 1;
  const isWest = col === 0;
  const isNorth = row === totalRows - 1;
  const isSouth = row === 0;

  if (isEast && !isNorth && !isSouth) return 'East';
  if (isWest && !isNorth && !isSouth) return 'West';
  if (isNorth && !isEast && !isWest) return 'North';
  if (isSouth && !isEast && !isWest) return 'South';
  if (isEast) return 'East';
  if (isWest) return 'West';
  if (isNorth) return 'North';
  return 'South';
}

export function isCornerPlot(row, col, totalRows, totalCols) {
  const onEdgeRow = row === 0 || row === totalRows - 1;
  const onEdgeCol = col === 0 || col === totalCols - 1;
  return onEdgeRow && onEdgeCol;
}

export function enrichPlotMetadata(plot, context = {}) {
  const {
    plotWidthFeet,
    plotHeightFeet,
    internalRoadWidth = 30,
    serviceRoadWidth = 20,
    enableServiceRoads = false,
    ratePerSqYard = 0,
    totalRows = 1,
    totalCols = 1,
  } = context;

  const row = plot.row ?? 0;
  const col = plot.col ?? 0;
  const corner = isCornerPlot(row, col, totalRows, totalCols);
  const areaSqYards = sqYardsFromFeet(plotWidthFeet, plotHeightFeet);
  const rate = Number(ratePerSqYard) || 0;

  return {
    ...plot,
    blockName: plot.blockName || '',
    rowNumber: row + 1,
    columnNumber: col + 1,
    areaSqYards,
    dimensions: formatPlotDimensions(plotWidthFeet, plotHeightFeet),
    mapWidth: Number(plotWidthFeet) || 0,
    mapHeight: Number(plotHeightFeet) || 0,
    facing: computePlotFacing(row, col, totalRows, totalCols),
    roadWidthFeet: enableServiceRoads && col < totalCols - 1 ? serviceRoadWidth : internalRoadWidth,
    plcType: corner ? 'Corner' : 'Open',
    cornerPlot: corner,
    ratePerSqYard: rate,
    totalPrice: rate > 0 ? Math.round(rate * areaSqYards) : 0,
    finalPrice: rate > 0 ? Math.round(rate * areaSqYards) : 0,
    status: plot.status || 'Available',
    shapeType: plot.shapeType || 'POLYGON',
  };
}

export const PlotGenerationService = {
  generatePlots,
  buildBlockLabel,
  enrichPlotMetadata,
  sqYardsFromFeet,
  formatPlotDimensions,
  computePlotFacing,
  isCornerPlot,
};

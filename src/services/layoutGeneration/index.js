export { generateBlockNames, generateMultiBlockLayout, computeSingleBlockDimensions, computeTotalLayoutFootprint } from './BlockGenerator.js';
export { generatePlots, buildBlockLabel } from './PlotGenerator.js';
export {
  generateBlockRoads,
  generateMainRoad,
  generateRoads,
  formatRoadName,
  formatRoadLabel,
  ROAD_TYPES,
} from './RoadGenerator.js';
export { generatePlotNumbers } from './NumberGenerator.js';
export {
  generateAmenityCorridor,
  getEnabledAmenityKeys,
  getEnabledAmenityLabels,
  estimateAmenityHeight,
  AMENITY_TYPES,
} from './AmenityGenerator.js';
export { computeStatistics, countRoads } from './StatisticsGenerator.js';
export { serializeConfiguration } from './ConfigurationSerializer.js';
export {
  collectAllPreviewPositions,
  collectAllPositions,
  preparePlotPreviewLayer,
  prepareRoadPreviewLayer,
  prepareAmenityPreviewLayer,
  getRoadPreviewStyle,
  ROAD_PREVIEW_STYLE,
  ROAD_PREVIEW_STYLES,
  PLOT_PREVIEW_STYLE,
  AMENITY_PREVIEW_STYLE,
} from './PreviewRenderer.js';
export {
  feetToMeters,
  metersToLatitudeDegrees,
  metersToLongitudeDegrees,
  offsetCoordinate,
  rectangleFromFeet,
  getPlotNorthOffset,
  getPlotEastOffset,
  computeLayoutDimensions,
  computeSingleBlockDimensions as computeBlockDimensions,
} from './geoUtils.js';

/** @deprecated use NumberGenerator */
export { generatePlotNumbers as generatePlotNumbersLegacy } from './NumberGenerator.js';

/** @deprecated */
export {
  generateGridCornerOrigins,
  generatePlotCorners,
} from './coordinateGenerator.js';

/** @deprecated */
export {
  buildPlotPolygon,
  buildPlotPolygons,
} from './polygonGenerator.js';

export {
  LayoutGenerationService,
  DEFAULT_GENERATION_PARAMS,
  DEFAULT_AMENITIES,
} from './LayoutGenerationService.js';

export { generateGisTownshipLayout, estimateGisTownshipStatistics } from './gis/GisTownshipEngine.js';

export {
  PlotGenerationService,
  RoadGenerationService,
  AmenityGenerationService,
  LayoutStatisticsService,
  LayoutHealthValidationService,
  ExcelExportService,
} from './services/index.js';

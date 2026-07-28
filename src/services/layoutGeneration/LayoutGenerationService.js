import { resolveLatLngPair } from '../../shared/utils/geoValidation.js';
import { resolveLayoutPricingDefaults } from '../../shared/services/layoutView.js';
import { generateMultiBlockLayout } from './BlockGenerator.js';
import { serializeConfiguration } from './ConfigurationSerializer.js';
import {
  LayoutStatisticsService,
  LayoutHealthValidationService,
  ExcelExportService,
} from './services/index.js';

export const DEFAULT_AMENITIES = {
  park: true,
  clubHouse: true,
  openSpace: true,
  temple: false,
  swimmingPool: false,
};

export const DEFAULT_GENERATION_PARAMS = {
  // Premium township generator (Phase 1)
  townshipSize: 'medium',
  density: 'medium',
  roadStyle: 'premium',
  amenitiesLevel: 'standard',
  commercialPercent: 8,
  cornerPlotPercent: 12,
  parkPercent: 10,
  openSpacePercent: 15,
  roadWidthPreset: 'DTCP',
  randomSeed: '',
  boundaryShape: 'auto',
  plotNumbering: 'block-wise',
  secondaryRoadWidth: 24,

  // Legacy fields — retained for save compat / advanced overrides
  numberOfBlocks: 5,
  blockPrefix: 'A',
  rows: 10,
  columns: 12,
  startingPlotNumber: 101,
  plotWidthFeet: 40,
  plotHeightFeet: 60,
  roadEveryRows: 5,
  roadEveryColumns: 8,
  mainRoadWidth: 50,
  internalRoadWidth: 33,
  serviceRoadWidth: 18,
  enableServiceRoads: true,
  blockSpacing: 50,
  amenities: { ...DEFAULT_AMENITIES },
  startingLatitude: '',
  startingLongitude: '',
  defaultRatePerSqYard: '',
};

const LIMITS = {
  commercialPercent: { min: 0, max: 25 },
  cornerPlotPercent: { min: 0, max: 30 },
  parkPercent: { min: 5, max: 25 },
  openSpacePercent: { min: 5, max: 30 },
};

/** In-memory store — not persisted to database (Sprint 3). */
let lastConfiguration = null;

function validateField(name, params) {
  const startingLatitude = Number(params.startingLatitude);
  const startingLongitude = Number(params.startingLongitude);
  const startingPlotNumber = Number(params.startingPlotNumber);
  const commercialPercent = Number(params.commercialPercent);
  const cornerPlotPercent = Number(params.cornerPlotPercent);
  const parkPercent = Number(params.parkPercent);
  const openSpacePercent = Number(params.openSpacePercent);

  switch (name) {
    case 'blockPrefix':
      if (!String(params.blockPrefix || '').trim()) return 'Block prefix is required.';
      return '';
    case 'startingPlotNumber':
      if (!Number.isFinite(startingPlotNumber) || startingPlotNumber < 0) {
        return 'Starting plot number must be zero or greater.';
      }
      return '';
    case 'townshipSize':
      if (!['small', 'medium', 'large'].includes(params.townshipSize)) {
        return 'Township size must be small, medium, or large.';
      }
      return '';
    case 'density':
      if (!['low', 'medium', 'high'].includes(params.density)) {
        return 'Density must be low, medium, or high.';
      }
      return '';
    case 'roadStyle':
      if (!['grid', 'organic', 'premium'].includes(params.roadStyle)) {
        return 'Road style must be grid, organic, or premium.';
      }
      return '';
    case 'amenitiesLevel':
      if (!['basic', 'standard', 'luxury'].includes(params.amenitiesLevel)) {
        return 'Amenities level must be basic, standard, or luxury.';
      }
      return '';
    case 'roadWidthPreset':
      if (!['DTCP', 'HMDA', 'RERA', 'custom'].includes(params.roadWidthPreset)) {
        return 'Road width preset must be DTCP, HMDA, RERA, or custom.';
      }
      return '';
    case 'commercialPercent':
      if (!Number.isFinite(commercialPercent) || commercialPercent < LIMITS.commercialPercent.min) {
        return 'Commercial percent cannot be negative.';
      }
      if (commercialPercent > LIMITS.commercialPercent.max) {
        return `Commercial percent cannot exceed ${LIMITS.commercialPercent.max}.`;
      }
      return '';
    case 'cornerPlotPercent':
      if (!Number.isFinite(cornerPlotPercent) || cornerPlotPercent < LIMITS.cornerPlotPercent.min) {
        return 'Corner plot percent cannot be negative.';
      }
      if (cornerPlotPercent > LIMITS.cornerPlotPercent.max) {
        return `Corner plot percent cannot exceed ${LIMITS.cornerPlotPercent.max}.`;
      }
      return '';
    case 'parkPercent':
      if (!Number.isFinite(parkPercent) || parkPercent < LIMITS.parkPercent.min) {
        return `Park percent must be at least ${LIMITS.parkPercent.min}.`;
      }
      if (parkPercent > LIMITS.parkPercent.max) {
        return `Park percent cannot exceed ${LIMITS.parkPercent.max}.`;
      }
      return '';
    case 'openSpacePercent':
      if (!Number.isFinite(openSpacePercent) || openSpacePercent < LIMITS.openSpacePercent.min) {
        return `Open space percent must be at least ${LIMITS.openSpacePercent.min}.`;
      }
      if (openSpacePercent > LIMITS.openSpacePercent.max) {
        return `Open space percent cannot exceed ${LIMITS.openSpacePercent.max}.`;
      }
      return '';
    case 'mainRoadWidth':
      if (params.roadWidthPreset === 'custom') {
        const mainRoadWidth = Number(params.mainRoadWidth);
        if (!Number.isFinite(mainRoadWidth) || mainRoadWidth <= 0) {
          return 'Main road width must be greater than zero.';
        }
      }
      return '';
    case 'internalRoadWidth':
      if (params.roadWidthPreset === 'custom') {
        const internalRoadWidth = Number(params.internalRoadWidth);
        if (!Number.isFinite(internalRoadWidth) || internalRoadWidth <= 0) {
          return 'Internal road width must be greater than zero.';
        }
      }
      return '';
    case 'startingLatitude':
      if (!Number.isFinite(startingLatitude) || startingLatitude < -90 || startingLatitude > 90) {
        return 'Starting latitude must be between -90 and 90.';
      }
      return '';
    case 'startingLongitude':
      if (!Number.isFinite(startingLongitude) || startingLongitude < -180 || startingLongitude > 180) {
        return 'Starting longitude must be between -180 and 180.';
      }
      return '';
    default:
      return '';
  }
}

const VALIDATED_FIELDS = [
  'blockPrefix',
  'startingPlotNumber',
  'townshipSize',
  'density',
  'roadStyle',
  'amenitiesLevel',
  'roadWidthPreset',
  'commercialPercent',
  'cornerPlotPercent',
  'parkPercent',
  'openSpacePercent',
  'mainRoadWidth',
  'internalRoadWidth',
  'startingLatitude',
  'startingLongitude',
];

function buildValidationResult(params) {
  const fieldErrors = {};
  const errors = [];

  VALIDATED_FIELDS.forEach((field) => {
    const message = validateField(field, params);
    if (message) {
      fieldErrors[field] = message;
      errors.push(message);
    }
  });

  return { valid: errors.length === 0, errors, fieldErrors };
}

export const LayoutGenerationService = {
  getLastConfiguration() {
    return lastConfiguration;
  },

  clearLastConfiguration() {
    lastConfiguration = null;
  },

  validateParams: buildValidationResult,

  validateField(params, fieldName) {
    return validateField(fieldName, params);
  },

  estimateStatistics(params) {
    const validation = buildValidationResult(params);
    if (!validation.valid) {
      return { valid: false, fieldErrors: validation.fieldErrors, summary: null };
    }
    return {
      valid: true,
      fieldErrors: {},
      summary: LayoutStatisticsService.computeDetailedStatistics(params),
    };
  },

  /**
   * Generate preview layout JSON. Stores configuration in memory only.
   */
  generatePreview(params) {
    const startedAt = performance.now();
    const validation = buildValidationResult(params);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
        fieldErrors: validation.fieldErrors,
        plots: [],
        roads: [],
        amenities: [],
        blockLabels: [],
        boundary: [],
        summary: null,
        configuration: null,
        health: null,
        generationTimeMs: 0,
      };
    }

    const enrichedParams = {
      ...params,
      defaultRatePerSqYard:
        Number(params.defaultRatePerSqYard)
        || Number(params.currentPrice)
        || Number(params.basePrice)
        || 0,
    };

    const { lat: originLat, lng: originLng, swapped } = resolveLatLngPair(
      enrichedParams.startingLatitude,
      enrichedParams.startingLongitude
    );

    const layout = generateMultiBlockLayout(enrichedParams, originLat, originLng);
    const configuration = serializeConfiguration(enrichedParams);
    lastConfiguration = configuration;

    const actualPlotCount = layout.plots.length;
    const summary = LayoutStatisticsService.computeDetailedStatistics(enrichedParams, {
      roads: layout.roads.length,
      plots: actualPlotCount,
      blocks: layout.blockNames?.length ?? 0,
      amenities: layout.amenities.length,
      previewObjects:
        actualPlotCount
        + layout.roads.length
        + layout.amenities.length
        + layout.blockLabels.length,
    });

    const health = LayoutHealthValidationService.validateGeneratedLayout({
      plots: layout.plots,
      roads: layout.roads,
      amenities: layout.amenities,
      boundary: layout.boundary,
    });

    const generationTimeMs = Math.round(performance.now() - startedAt);

    return {
      valid: true,
      errors: [],
      fieldErrors: {},
      plots: layout.plots,
      roads: layout.roads,
      amenities: layout.amenities,
      blockLabels: layout.blockLabels,
      boundary: layout.boundaryPolygon || [],
      footprint: layout.footprint,
      townshipMetadata: layout.townshipMetadata || null,
      swappedCoordinates: swapped,
      resolvedOrigin: { lat: originLat, lng: originLng },
      configuration,
      health,
      generationTimeMs,
      summary: {
        blocks: summary.blocks,
        plots: summary.plots,
        roads: summary.roads,
        amenities: summary.amenities,
        estimatedArea: summary.estimatedArea,
        saleableAreaSqYds: summary.saleableAreaSqYds,
        roadAreaSqYds: summary.roadAreaSqYds,
        amenityAreaSqYds: summary.amenityAreaSqYds,
        totalLayoutAreaSqYds: summary.totalLayoutAreaSqYds,
        previewObjects: summary.previewObjects,
        rows: summary.rows,
        columns: summary.columns,
      },
    };
  },

  exportPreviewToExcel(previewPlots, layout, filename) {
    const safeName = layout?.name?.replace(/\s+/g, '-').toLowerCase() || 'layout';
    return ExcelExportService.exportGeneratedPlots(
      previewPlots,
      filename || `generated-${safeName}-plots.xlsx`
    );
  },

  buildPlotRecordsForSave(previewPlots, params, layout, venture) {
    const width = Number(params.plotWidthFeet);
    const height = Number(params.plotHeightFeet);
    // SSOT: params rate → Venture pricing → legacy layout → 0
    const pricing = resolveLayoutPricingDefaults(layout, venture);
    const ratePerSqYard =
      Number(params.defaultRatePerSqYard)
      || pricing.defaultRatePerSqYard
      || 0;

    return previewPlots.map((plot) => ({
      plotNumber: plot.plotNumber,
      blockName: plot.blockName || '',
      row: plot.row ?? null,
      col: plot.col ?? null,
      rowNumber: plot.rowNumber ?? (plot.row != null ? plot.row + 1 : null),
      columnNumber: plot.columnNumber ?? (plot.col != null ? plot.col + 1 : null),
      polygonPoints: plot.polygonPoints,
      latitude: plot.latitude,
      longitude: plot.longitude,
      shapeType: plot.shapeType || 'POLYGON',
      status: plot.status || 'Available',
      areaSqYards: plot.areaSqYards ?? Math.round(((width * height) / 9) * 100) / 100,
      dimensions: plot.dimensions || `${width} × ${height} ft`,
      mapWidth: plot.mapWidth ?? width,
      mapHeight: plot.mapHeight ?? height,
      facing: plot.facing || 'East',
      roadWidthFeet: plot.roadWidthFeet ?? (Number(params.internalRoadWidth) || 30),
      plcType: plot.plcType || 'Open',
      cornerPlot: Boolean(plot.cornerPlot),
      ratePerSqYard,
      totalPrice: plot.totalPrice ?? Math.round(ratePerSqYard * (plot.areaSqYards || 0)),
      finalPrice: plot.finalPrice ?? Math.round(ratePerSqYard * (plot.areaSqYards || 0)),
    }));
  },
};

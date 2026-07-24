import { resolveLatLngPair } from '../../shared/utils/geoValidation.js';
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
  numberOfBlocks: 2,
  blockPrefix: 'A',
  rows: 10,
  columns: 12,
  startingPlotNumber: 101,
  plotWidthFeet: 40,
  plotHeightFeet: 60,
  roadEveryRows: 5,
  roadEveryColumns: 8,
  mainRoadWidth: 40,
  internalRoadWidth: 30,
  serviceRoadWidth: 20,
  enableServiceRoads: false,
  blockSpacing: 50,
  amenities: { ...DEFAULT_AMENITIES },
  startingLatitude: '',
  startingLongitude: '',
  defaultRatePerSqYard: '',
};

const LIMITS = {
  numberOfBlocks: { min: 1, max: 10 },
  rows: { min: 1, max: 100 },
  columns: { min: 1, max: 100 },
  roadEveryRows: { min: 1, max: 50 },
  roadEveryColumns: { min: 1, max: 50 },
};

/** In-memory store — not persisted to database (Sprint 3). */
let lastConfiguration = null;

function validateField(name, params) {
  const numberOfBlocks = Number(params.numberOfBlocks);
  const rows = Number(params.rows);
  const columns = Number(params.columns);
  const plotWidthFeet = Number(params.plotWidthFeet);
  const plotHeightFeet = Number(params.plotHeightFeet);
  const mainRoadWidth = Number(params.mainRoadWidth);
  const internalRoadWidth = Number(params.internalRoadWidth);
  const serviceRoadWidth = Number(params.serviceRoadWidth);
  const blockSpacing = Number(params.blockSpacing);
  const roadEveryRows = Number(params.roadEveryRows);
  const roadEveryColumns = Number(params.roadEveryColumns);
  const startingLatitude = Number(params.startingLatitude);
  const startingLongitude = Number(params.startingLongitude);
  const startingPlotNumber = Number(params.startingPlotNumber);

  switch (name) {
    case 'numberOfBlocks':
      if (!Number.isFinite(numberOfBlocks) || numberOfBlocks < LIMITS.numberOfBlocks.min) {
        return 'Number of blocks must be at least 1.';
      }
      if (numberOfBlocks > LIMITS.numberOfBlocks.max) {
        return `Number of blocks cannot exceed ${LIMITS.numberOfBlocks.max}.`;
      }
      return '';
    case 'blockPrefix':
      if (!String(params.blockPrefix || '').trim()) return 'Block prefix is required.';
      return '';
    case 'rows':
      if (!Number.isFinite(rows) || rows < LIMITS.rows.min) return 'Rows must be at least 1.';
      if (rows > LIMITS.rows.max) return `Rows cannot exceed ${LIMITS.rows.max}.`;
      return '';
    case 'columns':
      if (!Number.isFinite(columns) || columns < LIMITS.columns.min) return 'Columns must be at least 1.';
      if (columns > LIMITS.columns.max) return `Columns cannot exceed ${LIMITS.columns.max}.`;
      return '';
    case 'startingPlotNumber':
      if (!Number.isFinite(startingPlotNumber) || startingPlotNumber < 0) {
        return 'Starting plot number must be zero or greater.';
      }
      return '';
    case 'plotWidthFeet':
      if (!Number.isFinite(plotWidthFeet) || plotWidthFeet <= 0) return 'Plot width must be greater than zero.';
      return '';
    case 'plotHeightFeet':
      if (!Number.isFinite(plotHeightFeet) || plotHeightFeet <= 0) return 'Plot height must be greater than zero.';
      return '';
    case 'mainRoadWidth':
      if (!Number.isFinite(mainRoadWidth) || mainRoadWidth <= 0) return 'Main road width must be greater than zero.';
      return '';
    case 'internalRoadWidth':
      if (!Number.isFinite(internalRoadWidth) || internalRoadWidth <= 0) {
        return 'Internal road width must be greater than zero.';
      }
      return '';
    case 'serviceRoadWidth':
      if (params.enableServiceRoads && (!Number.isFinite(serviceRoadWidth) || serviceRoadWidth <= 0)) {
        return 'Service road width must be greater than zero.';
      }
      return '';
    case 'blockSpacing':
      if (!Number.isFinite(blockSpacing) || blockSpacing < 0) return 'Block spacing cannot be negative.';
      return '';
    case 'roadEveryRows':
      if (!Number.isFinite(roadEveryRows) || roadEveryRows < LIMITS.roadEveryRows.min) {
        return 'Road after every rows must be at least 1.';
      }
      if (roadEveryRows > LIMITS.roadEveryRows.max) {
        return `Road interval cannot exceed ${LIMITS.roadEveryRows.max} rows.`;
      }
      return '';
    case 'roadEveryColumns':
      if (!Number.isFinite(roadEveryColumns) || roadEveryColumns < LIMITS.roadEveryColumns.min) {
        return 'Road after every columns must be at least 1.';
      }
      if (roadEveryColumns > LIMITS.roadEveryColumns.max) {
        return `Road interval cannot exceed ${LIMITS.roadEveryColumns.max} columns.`;
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
  'numberOfBlocks',
  'blockPrefix',
  'rows',
  'columns',
  'startingPlotNumber',
  'plotWidthFeet',
  'plotHeightFeet',
  'mainRoadWidth',
  'internalRoadWidth',
  'serviceRoadWidth',
  'blockSpacing',
  'roadEveryRows',
  'roadEveryColumns',
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

    const summary = LayoutStatisticsService.computeDetailedStatistics(enrichedParams, {
      roads: layout.roads.length,
      previewObjects:
        layout.plots.length
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

  buildPlotRecordsForSave(previewPlots, params, layout) {
    const width = Number(params.plotWidthFeet);
    const height = Number(params.plotHeightFeet);
    const ratePerSqYard =
      Number(params.defaultRatePerSqYard)
      || Number(layout?.currentPrice)
      || Number(layout?.basePrice)
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

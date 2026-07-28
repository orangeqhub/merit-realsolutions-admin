import { generateBoundary } from '../township/boundaryGenerator.js';
import { generateEntrance } from '../township/entranceGenerator.js';
import { adaptTownshipOutput } from '../township/outputAdapter.js';
import { resolveTownshipConfig } from '../township/presets.js';
import { AmenityGenerationService } from '../services/AmenityGenerationService.js';
import { createTownshipModel } from './model/townshipModel.js';
import { processPremiumRoadNetwork } from './core/premiumRoadPipeline.js';
import { generateGisRoadHierarchy, roadsToLegacyFormat } from './steps/roadHierarchyStep.js';
import { formBlocksFromRoads } from './steps/blockFormationStep.js';
import { reserveLand } from './steps/landReservationStep.js';
import { subdivideBlocksIntoPlots } from './steps/plotSubdivisionStep.js';
import { assignCommercialZone } from './steps/commercialZoneStep.js';
import { applyPlotNumbering } from './steps/plotNumberingStep.js';
import { generateGisLandscape } from './steps/landscapeStep.js';
import { computeGisTownshipStatistics } from './statistics/townshipStatistics.js';

/**
 * GIS-First Township Planning Engine — Phase 1
 *
 * Pipeline:
 *   Boundary → Entrance → Road Hierarchy → Block Formation →
 *   Land Reservation → Plot Subdivision → Landscape → Commercial →
 *   Plot Numbering → lat/lng Export
 *
 * NO rows/columns/grid/northCursor. All geometry from boundary → roads → blocks → plots.
 */
export function generateGisTownshipLayout(params, originLat, originLng) {
  const startedAt = performance.now();
  const config = resolveTownshipConfig(params);
  const model = createTownshipModel();

  // STEP 1 — Layout boundary (legal township polygon)
  model.boundary = generateBoundary(config);

  // STEP 2 — Entrance (gate, security, parking, plaza, boulevard)
  model.entrance = generateEntrance(model.boundary, config);

  // STEP 3 — Road hierarchy defines land parcels
  const roadNetwork = generateGisRoadHierarchy(model.boundary, model.entrance, config);
  model.roads = processPremiumRoadNetwork(roadNetwork.roads, {
    boundary: model.boundary,
    entrance: model.entrance,
    roads: roadNetwork.roads,
  });
  model.roadGraph = roadNetwork.graph;
  roadNetwork.roads = model.roads;

  // STEP 4 — Blocks formed by road intersections
  const blockResult = formBlocksFromRoads(model.boundary, roadNetwork, config);
  model.blocks = blockResult.blocks;

  // STEP 5 — Reserve land (amenities BEFORE plot subdivision)
  const reservationResult = reserveLand(
    model.blocks,
    roadNetwork,
    model.entrance,
    model.boundary,
    config
  );
  model.reservations = reservationResult.reservations;
  model.amenities = reservationResult.amenities;

  // STEP 6 — Subdivide blocks into plots (each block independent)
  const plotResult = subdivideBlocksIntoPlots(
    model.blocks,
    roadNetwork,
    model.reservations,
    config
  );
  model.plots = plotResult.plots;
  model.blockLabels = plotResult.blockLabels;

  // STEP 7 — Landscape layer (green belts, medians, paths)
  const landscape = generateGisLandscape(
    blockResult.parcels,
    roadsToLegacyFormat(model.roads),
    roadNetwork.bbox,
    config
  );
  model.landscape = landscape.landscapeFeatures;
  model.amenities = [...model.amenities, ...landscape.landscapeAmenities];

  // STEP 8 — Commercial zone preference
  assignCommercialZone(model.plots, model.entrance, model.roads, config);

  // STEP 9 — Plot numbering
  applyPlotNumbering(model.plots, config);

  // Normalize plots for output adapter
  model.plots.forEach((p) => {
    p.worldPolygon = p.worldPolygon || p.polygon;
    p.ratePerSqYard = config.ratePerSqYard;
  });

  // STEP 13 — Statistics
  model.statistics = computeGisTownshipStatistics(model, model.boundary);

  model.metadata = {
    generator: 'gis-township-engine-v1',
    phase: 'GIS_PHASE_1',
    boundaryShape: model.boundary.shape,
    boundaryPolygon: model.boundary.points,
    roadStyle: config.roadStyle,
    randomSeed: config.rng.seed,
    plotNumbering: config.plotNumbering,
    statistics: model.statistics,
    blocks: model.blocks.map((b) => ({
      blockName: b.blockName,
      shapeType: b.shapeType,
      rotationDeg: b.rotationDeg,
      blockArea: Math.round(b.blockArea),
      roadExposure: b.roadExposure,
    })),
    blockPlotCounts: model.blockLabels.map((b) => ({
      block: b.blockName,
      plots: b.plotCount,
    })),
    editable: true,
    generationTimeMs: 0,
  };

  // STEP 8 (coords) — Convert feet → lat/lng via existing adapter (schema unchanged)
  const legacyRoads = roadsToLegacyFormat(model.roads);
  const output = adaptTownshipOutput(
    {
      boundary: model.boundary,
      entrance: model.entrance,
      roads: legacyRoads,
      plots: model.plots,
      amenities: model.amenities,
      blockLabels: model.blockLabels,
      metadata: model.metadata,
    },
    originLat,
    originLng
  );

  output.amenities = output.amenities.map(AmenityGenerationService.enrichAmenityMetadata);
  output.metadata.generationTimeMs = Math.round(performance.now() - startedAt);
  output.townshipMetadata = model.metadata;
  output.gisModel = model;

  if (typeof console !== 'undefined' && console.info) {
    console.info('GIS_TOWNSHIP_ENGINE_PHASE1_COMPLETE', {
      plots: output.plots.length,
      blocks: output.blockNames.length,
      roads: output.roads.length,
      amenities: output.amenities.length,
      ms: output.metadata.generationTimeMs,
      roadPercent: model.statistics.roadPercent,
      saleableAreaSqYds: model.statistics.saleableAreaSqYds,
    });
  }

  return {
    ...output,
    blockDimensions: {
      blockCount: model.blocks.length,
      plotCount: model.plots.length,
    },
  };
}

export function estimateGisTownshipStatistics(params) {
  const config = resolveTownshipConfig(params);
  return {
    targetPlots: config.targetPlots,
    estimatedBlocks: config.densityKey === 'high' ? 8 : config.densityKey === 'low' ? 5 : 7,
    boundaryWidth: config.size.widthFeet,
    boundaryHeight: config.size.heightFeet,
  };
}

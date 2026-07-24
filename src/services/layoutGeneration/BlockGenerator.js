import { generatePlotNumbers } from './NumberGenerator.js';
import { generatePlots, buildBlockLabel } from './PlotGenerator.js';
import { generateBlockRoads, generateMainRoad } from './RoadGenerator.js';
import { generateAmenityCorridor, estimateAmenityHeight } from './AmenityGenerator.js';
import { computeSingleBlockDimensions, rectangleFromFeet } from './geoUtils.js';
import { PlotGenerationService } from './services/PlotGenerationService.js';
import { AmenityGenerationService } from './services/AmenityGenerationService.js';

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

export { computeSingleBlockDimensions };

/**
 * Compute total layout footprint in feet (mirrors vertical stacking in generateMultiBlockLayout).
 */
export function computeTotalLayoutFootprint(params) {
  const numberOfBlocks = Math.max(1, Math.floor(Number(params.numberOfBlocks) || 1));
  const blockNames = generateBlockNames(params.blockPrefix, numberOfBlocks);
  const blockDims = computeSingleBlockDimensions(params);
  const blockSpacing = Number(params.blockSpacing) || 0;
  const mainRoadWidth = Number(params.mainRoadWidth) || 40;
  const amenities = params.amenities || {};

  let northCursor = 0;

  blockNames.forEach((_blockName, blockIndex) => {
    if (blockIndex > 0) {
      northCursor += blockSpacing + mainRoadWidth;
      if (blockIndex === 1) {
        northCursor += estimateAmenityHeight(amenities);
      }
    }
    northCursor += blockDims.heightFeet;
  });

  const totalHeightFeet = northCursor;
  const totalWidthFeet = blockDims.widthFeet;

  return {
    totalHeightFeet,
    totalWidthFeet,
    centerOffsetNorthFeet: -totalHeightFeet / 2,
    centerOffsetEastFeet: -totalWidthFeet / 2,
  };
}

/**
 * Generate a full multi-block venture layout (plots, roads, amenities, labels).
 * The venture/layout center coordinate is treated as the geometric center of the layout.
 */
export function generateMultiBlockLayout(params, originLat, originLng) {
  const numberOfBlocks = Math.max(1, Math.floor(Number(params.numberOfBlocks) || 1));
  const blockNames = generateBlockNames(params.blockPrefix, numberOfBlocks);
  const blockDims = computeSingleBlockDimensions(params);
  const footprint = computeTotalLayoutFootprint(params);

  const blockSpacing = Number(params.blockSpacing) || 0;
  const mainRoadWidth = Number(params.mainRoadWidth) || 40;
  const amenities = params.amenities || {};
  const ratePerSqYard = Number(params.defaultRatePerSqYard) || 0;

  const plotContext = {
    plotWidthFeet: blockDims.plotWidthFeet,
    plotHeightFeet: blockDims.plotHeightFeet,
    internalRoadWidth: blockDims.internalRoadWidth,
    serviceRoadWidth: blockDims.serviceRoadWidth,
    enableServiceRoads: blockDims.enableServiceRoads,
    ratePerSqYard,
    totalRows: blockDims.rows,
    totalCols: blockDims.columns,
  };

  const allPlots = [];
  const allRoads = [];
  const allAmenities = [];
  const blockLabels = [];

  let northCursor = footprint.centerOffsetNorthFeet;
  const eastCursor = footprint.centerOffsetEastFeet;

  blockNames.forEach((blockName, blockIndex) => {
    if (blockIndex > 0) {
      northCursor += blockSpacing;

      allRoads.push(
        generateMainRoad({
          blockWidthFeet: blockDims.widthFeet,
          mainRoadWidth,
          originLat,
          originLng,
          northFeet: northCursor,
          eastFeet: eastCursor,
          corridorId: String(blockIndex - 1),
        })
      );
      northCursor += mainRoadWidth;

      if (blockIndex === 1) {
        const corridor = generateAmenityCorridor({
          amenities,
          blockWidthFeet: blockDims.widthFeet,
          originLat,
          originLng,
          northFeet: northCursor,
          eastFeet: eastCursor,
          corridorId: String(blockIndex - 1),
        });
        allAmenities.push(...corridor.amenities.map(AmenityGenerationService.enrichAmenityMetadata));
        northCursor += corridor.totalHeightFeet;
      }
    }

    const plotNumbers = generatePlotNumbers({
      blockName,
      rows: blockDims.rows,
      columns: blockDims.columns,
      startingPlotNumber: Number(params.startingPlotNumber) || 101,
    });

    allPlots.push(
      ...generatePlots({
        rows: blockDims.rows,
        columns: blockDims.columns,
        plotWidthFeet: blockDims.plotWidthFeet,
        plotHeightFeet: blockDims.plotHeightFeet,
        internalRoadWidth: blockDims.internalRoadWidth,
        serviceRoadWidth: blockDims.serviceRoadWidth,
        roadEveryRows: blockDims.roadEveryRows,
        roadEveryColumns: blockDims.roadEveryColumns,
        enableServiceRoads: blockDims.enableServiceRoads,
        originLat,
        originLng,
        originNorthFeet: northCursor,
        originEastFeet: eastCursor,
        plotNumbers,
        blockName,
      }).map((plot) => PlotGenerationService.enrichPlotMetadata(plot, plotContext))
    );

    allRoads.push(
      ...generateBlockRoads({
        rows: blockDims.rows,
        columns: blockDims.columns,
        plotWidthFeet: blockDims.plotWidthFeet,
        plotHeightFeet: blockDims.plotHeightFeet,
        internalRoadWidth: blockDims.internalRoadWidth,
        serviceRoadWidth: blockDims.serviceRoadWidth,
        roadEveryRows: blockDims.roadEveryRows,
        roadEveryColumns: blockDims.roadEveryColumns,
        enableServiceRoads: blockDims.enableServiceRoads,
        originLat,
        originLng,
        originNorthFeet: northCursor,
        originEastFeet: eastCursor,
        blockName,
        blockWidthFeet: blockDims.widthFeet,
        blockHeightFeet: blockDims.heightFeet,
      })
    );

    blockLabels.push(
      buildBlockLabel({
        blockName,
        blockWidthFeet: blockDims.widthFeet,
        blockHeightFeet: blockDims.heightFeet,
        originLat,
        originLng,
        originNorthFeet: northCursor,
        originEastFeet: eastCursor,
      })
    );

    northCursor += blockDims.heightFeet;
  });

  const boundary = rectangleFromFeet(
    originLat,
    originLng,
    footprint.centerOffsetNorthFeet,
    footprint.centerOffsetEastFeet,
    footprint.totalWidthFeet,
    footprint.totalHeightFeet
  );

  return {
    plots: allPlots,
    roads: allRoads,
    amenities: allAmenities,
    blockLabels,
    blockNames,
    blockDimensions: blockDims,
    footprint,
    boundary,
    boundaryPolygon: boundary.map(({ lat, lng }) => ({ lat, lng })),
  };
}

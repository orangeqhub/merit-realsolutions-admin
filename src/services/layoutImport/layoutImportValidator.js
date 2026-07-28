/**
 * GIS Township Workbook V2.1 validator.
 * GIS_WORKBOOK_VALIDATOR_V21_COMPLETE
 * GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE
 * GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE
 */
import { VALIDATION_CHUNK_SIZE } from './constants.js';
import { closedPolygonErrorMessage } from './closedPolygonStandard.js';
import {
  VALID_PLOT_STATUSES_V21,
  WORKBOOK_FORMAT_VERSION,
  SURVEY_REFERENCE_TYPES,
} from './workbookV21Constants.js';
import {
  fieldValue,
  filterPolygonCoordinateRows,
  groupRowsByField,
  normalizeKey,
  rowProjectId,
  sortBySequence,
} from './workbookV21Utils.js';
import { closePolygon, isPolygonClosed } from './polylineUtils.js';

function isValidLat(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isValidLng(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

function pushError(errors, scope, message, extra = {}) {
  errors.push({ scope, message, ...extra });
}

function pushWarning(warnings, scope, message, extra = {}) {
  warnings.push({ scope, message, ...extra });
}

function normalizePlotStatus(value) {
  const key = normalizeKey(value).replace(/\s+/g, '_');
  const map = {
    available: 'Available',
    reserved: 'Reserved',
    booked: 'Booked',
    sold: 'Sold',
    blocked: 'Blocked',
  };
  return map[key] || null;
}

function validateCoordinateVertices(rows, label, { minVertices = 3, requireClosed = true } = {}) {
  const errors = [];
  const sorted = sortBySequence(rows);

  if (sorted.length < minVertices) {
    errors.push(`${label} must contain at least ${minVertices} coordinate rows.`);
    return { valid: false, errors, points: [] };
  }

  const points = [];
  const sequences = [];

  sorted.forEach((row) => {
    const seq = Number(fieldValue(row, 'Sequence'));
    const lat = fieldValue(row, 'Latitude', 'latitude');
    const lng = fieldValue(row, 'Longitude', 'longitude');

    if (!Number.isFinite(seq) || seq < 1) {
      errors.push(`${label} Sequence must be a positive integer (row ${row.__rowNumber}).`);
    } else {
      sequences.push(seq);
    }

    if (!isValidLat(lat)) {
      errors.push(`${label} Latitude is invalid (row ${row.__rowNumber}).`);
    }
    if (!isValidLng(lng)) {
      errors.push(`${label} Longitude is invalid (row ${row.__rowNumber}).`);
    }

    if (isValidLat(lat) && isValidLng(lng)) {
      points.push({ lat: Number(lat), lng: Number(lng) });
    }
  });

  const expected = Array.from({ length: sequences.length }, (_, i) => i + 1);
  const sortedSeq = [...sequences].sort((a, b) => a - b);
  if (sequences.length && sortedSeq.join(',') !== expected.join(',')) {
    errors.push(`${label} Sequence must be contiguous starting at 1.`);
  }

  if (requireClosed && points.length >= 3 && !isPolygonClosed(points)) {
    const lastSeq = sequences.length ? sequences[sequences.length - 1] : 'N';
    errors.push(closedPolygonErrorMessage(label, lastSeq));
  }

  return {
    valid: errors.length === 0,
    errors,
    points: errors.length ? [] : closePolygon(points),
  };
}

function validatePlotMasterRow(row, projectId, geometryPlotIds, blockIds) {
  const errors = [];
  const warnings = [];
  const plotId = String(fieldValue(row, 'PlotID', 'plotId') ?? '').trim();
  const plotNumber = String(fieldValue(row, 'PlotNumber', 'plotNumber') ?? '').trim();
  const rowProject = rowProjectId(row);

  if (!plotId) errors.push('PlotID is required.');
  if (!plotNumber) errors.push('PlotNumber is required.');

  if (projectId && rowProject && rowProject !== projectId) {
    errors.push(`ProjectID "${rowProject}" does not match Project sheet.`);
  }

  const area = Number(fieldValue(row, 'AreaSqYd', 'areaSqYd'));
  if (!Number.isFinite(area) || area <= 0) {
    errors.push('AreaSqYd must be a positive number.');
  }

  const statusRaw = fieldValue(row, 'Status', 'status');
  const status = normalizePlotStatus(statusRaw);
  if (statusRaw && !status) {
    errors.push(`Status must be one of: ${VALID_PLOT_STATUSES_V21.join(', ')}.`);
  }

  const lat = fieldValue(row, 'Latitude', 'latitude');
  const lng = fieldValue(row, 'Longitude', 'longitude');
  if (lat !== '' && lat != null) errors.push('PlotMaster must not contain coordinate columns (Latitude).');
  if (lng !== '' && lng != null) errors.push('PlotMaster must not contain coordinate columns (Longitude).');

  const blockId = String(fieldValue(row, 'BlockID', 'blockId') ?? '').trim();
  if (blockId && blockIds.size > 0 && !blockIds.has(normalizeKey(blockId))) {
    errors.push(`BlockID "${blockId}" was not found in Blocks sheet.`);
  }

  if (plotId && !geometryPlotIds.has(normalizeKey(plotId))) {
    errors.push(`PlotID "${plotId}" has no matching PlotGeometry rows.`);
  }

  return {
    id: plotId || plotNumber,
    plotId,
    plotNumber,
    rowNumber: row.__rowNumber,
    errors,
    warnings,
    normalized: {
      plotNo: plotNumber || plotId,
      status: status || 'Available',
      areaSqYards: area,
      ratePerSqYard: Number(fieldValue(row, 'RatePerSqYd', 'ratePerSqYd')) || 0,
    },
  };
}

function validatePlotGeometryGroup(plotId, rows, projectId) {
  const errors = [];
  rows.forEach((row) => {
    const rowProject = rowProjectId(row);
    if (projectId && rowProject && rowProject !== projectId) {
      errors.push(`PlotGeometry ProjectID "${rowProject}" does not match Project sheet (row ${row.__rowNumber}).`);
    }
  });

  const coord = validateCoordinateVertices(rows, `PlotGeometry "${plotId}"`);
  errors.push(...coord.errors);

  return {
    id: plotId,
    rowNumber: rows[0]?.__rowNumber,
    errors,
    polygonPoints: coord.points,
  };
}

function validateRoadGroup(roadId, rows, projectId) {
  const errors = [];
  rows.forEach((row) => {
    const rowProject = rowProjectId(row);
    if (projectId && rowProject && rowProject !== projectId) {
      errors.push(`Roads ProjectID "${rowProject}" does not match Project sheet (row ${row.__rowNumber}).`);
    }
    const width = Number(fieldValue(row, 'RoadWidth', 'WidthFt', 'widthFt'));
    if (row.__rowNumber === rows[0]?.__rowNumber && (!Number.isFinite(width) || width <= 0)) {
      errors.push(`RoadWidth must be greater than zero for RoadID "${roadId}".`);
    }
  });

  const coord = validateCoordinateVertices(rows, `Road "${roadId}"`, {
    minVertices: 2,
    requireClosed: false,
  });
  errors.push(...coord.errors);

  return {
    id: roadId,
    rowNumber: rows[0]?.__rowNumber,
    errors,
    points: coord.points,
    widthFt: Number(fieldValue(rows[0], 'RoadWidth', 'WidthFt')) || 30,
    roadType: normalizeKey(fieldValue(rows[0], 'RoadType', 'roadType')) || 'internal',
  };
}

function validateBlockGroup(blockId, rows, projectId) {
  const errors = [];
  rows.forEach((row) => {
    const rowProject = rowProjectId(row);
    if (projectId && rowProject && rowProject !== projectId) {
      errors.push(`Blocks ProjectID "${rowProject}" does not match Project sheet (row ${row.__rowNumber}).`);
    }
  });

  const coord = validateCoordinateVertices(rows, `Block "${blockId}"`);
  errors.push(...coord.errors);

  return {
    id: blockId,
    rowNumber: rows[0]?.__rowNumber,
    errors,
    polygonPoints: coord.points,
    blockName: fieldValue(rows[0], 'BlockName', 'blockName'),
    landUse: fieldValue(rows[0], 'LandUse', 'landUse'),
  };
}

function validateAmenityGroup(amenityId, rows, projectId) {
  const errors = [];
  rows.forEach((row) => {
    const rowProject = rowProjectId(row);
    if (projectId && rowProject && rowProject !== projectId) {
      errors.push(`Amenities ProjectID "${rowProject}" does not match Project sheet (row ${row.__rowNumber}).`);
    }
  });

  const coord = validateCoordinateVertices(rows, `Amenity "${amenityId}"`);
  errors.push(...coord.errors);

  return {
    id: amenityId,
    rowNumber: rows[0]?.__rowNumber,
    errors,
    polygonPoints: coord.points,
    type: fieldValue(rows[0], 'Type', 'type'),
    label: fieldValue(rows[0], 'Label', 'label'),
  };
}

function validateSurveyReferenceRow(row, projectId) {
  const errors = [];
  const rowProject = rowProjectId(row);
  const surveyId = String(fieldValue(row, 'SurveyID', 'surveyId') ?? '').trim();
  const refType = String(fieldValue(row, 'ReferenceType', 'referenceType') ?? '').trim();

  if (!surveyId) errors.push('SurveyID is required.');
  if (projectId && rowProject && rowProject !== projectId) {
    errors.push(`SurveyReference ProjectID "${rowProject}" does not match Project sheet.`);
  }
  if (refType && !SURVEY_REFERENCE_TYPES.includes(refType)) {
    errors.push(`ReferenceType "${refType}" is not allowed.`);
  }

  const lat = fieldValue(row, 'Latitude', 'latitude');
  const lng = fieldValue(row, 'Longitude', 'longitude');
  if (lat !== '' && lat != null) errors.push('SurveyReference must not contain coordinates.');
  if (lng !== '' && lng != null) errors.push('SurveyReference must not contain coordinates.');

  return { id: surveyId, rowNumber: row.__rowNumber, errors };
}

async function validateInChunks(items, validateFn, chunkSize = VALIDATION_CHUNK_SIZE) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(validateFn));
    await new Promise((resolve) => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
  return results;
}

function collectProjectIds(parsed) {
  const ids = new Set();
  const addFromRows = (rows = []) => {
    rows.forEach((row) => {
      const id = rowProjectId(row);
      if (id) ids.add(id);
    });
  };

  addFromRows(parsed.project);
  addFromRows(parsed.boundary);
  addFromRows(parsed.plotGeometry);
  addFromRows(parsed.plotMaster);
  addFromRows(parsed.roads);
  addFromRows(parsed.amenities);
  addFromRows(parsed.blocks);
  addFromRows(parsed.statistics);
  addFromRows(parsed.surveyReference);
  addFromRows(parsed.entrances);
  addFromRows(parsed.utilities);
  addFromRows(parsed.landscaping);

  return ids;
}

export const LayoutImportValidator = {
  async validateParsed(parsed, { onProgress } = {}) {
    const errors = [];
    const warnings = [];

    const projectRows = parsed.project || (parsed.projectRow ? [parsed.projectRow] : []);
    if (projectRows.length !== 1) {
      pushError(
        errors,
        'project',
        projectRows.length === 0
          ? 'Project sheet must contain exactly one project row.'
          : `Project sheet must contain exactly one project row (found ${projectRows.length}).`
      );
    }

    const projectRow = projectRows[0] || parsed.projectRow || {};
    const version = String(fieldValue(projectRow, 'WorkbookFormatVersion') ?? '').trim();
    if (version !== WORKBOOK_FORMAT_VERSION) {
      pushError(
        errors,
        'project',
        `WorkbookFormatVersion must be ${WORKBOOK_FORMAT_VERSION}${version ? ` (found "${version}")` : ''}.`
      );
    }

    const projectId = String(fieldValue(projectRow, 'ProjectID', 'projectId') ?? '').trim();
    if (!projectId) {
      pushError(errors, 'project', 'ProjectID is required on the Project sheet.');
    }

    const centerLat = fieldValue(projectRow, 'CenterLatitude', 'centerLatitude');
    const centerLng = fieldValue(projectRow, 'CenterLongitude', 'centerLongitude');
    if (centerLat !== '' && centerLat != null && !isValidLat(centerLat)) {
      pushError(errors, 'project', 'CenterLatitude is invalid (camera anchor only).');
    }
    if (centerLng !== '' && centerLng != null && !isValidLng(centerLng)) {
      pushError(errors, 'project', 'CenterLongitude is invalid (camera anchor only).');
    }

    onProgress?.({ phase: 'boundary', percent: 10 });
    const boundaryRows = parsed.boundary || [];
    if (!boundaryRows.length) {
      pushError(errors, 'boundary', 'Missing required sheet: Boundary');
    } else {
      const boundaryCheck = validateCoordinateVertices(boundaryRows, 'Boundary');
      boundaryCheck.errors.forEach((message) => pushError(errors, 'boundary', message));
      boundaryRows.forEach((row) => {
        const rowProject = rowProjectId(row);
        if (projectId && rowProject && rowProject !== projectId) {
          pushError(errors, 'boundary', `ProjectID "${rowProject}" does not match Project sheet (row ${row.__rowNumber}).`);
        }
      });
    }

    onProgress?.({ phase: 'plotGeometry', percent: 25 });
    const plotGeometryRows = parsed.plotGeometry || [];
    if (!plotGeometryRows.length) {
      pushError(errors, 'plotGeometry', 'Missing required sheet: PlotGeometry');
    }

    const geometryGroups = groupRowsByField(plotGeometryRows, 'PlotID');
    const geometryPlotIds = new Set([...geometryGroups.keys()].map(normalizeKey));

    const plotGeometryResults = [];
    geometryGroups.forEach((rows, plotId) => {
      const result = validatePlotGeometryGroup(plotId, rows, projectId);
      plotGeometryResults.push(result);
      result.errors.forEach((message) =>
        pushError(errors, 'plotGeometry', message, { row: result.rowNumber, id: plotId })
      );
    });

    onProgress?.({ phase: 'plotMaster', percent: 45 });
    const plotMasterRows = parsed.plotMaster || [];
    if (!plotMasterRows.length) {
      pushError(errors, 'plotMaster', 'Missing required sheet: PlotMaster');
    }

    const blockCoordinateRows = filterPolygonCoordinateRows(parsed.blocks || []);
    const blockGroups = groupRowsByField(blockCoordinateRows, 'BlockID');
    const blockIds = new Set([...blockGroups.keys()].map(normalizeKey));
    if (blockCoordinateRows.length > 0) {
      blockGroups.forEach((rows, blockId) => {
        const result = validateBlockGroup(blockId, rows, projectId);
        result.errors.forEach((message) =>
          pushError(errors, 'blocks', message, { row: result.rowNumber, id: blockId })
        );
      });
    }

    const plotMasterResults = await validateInChunks(
      plotMasterRows,
      (row) => validatePlotMasterRow(row, projectId, geometryPlotIds, blockIds)
    );

    const duplicatePlotIds = new Set();
    const duplicatePlotNumbers = new Set();
    const seenPlotIds = new Set();
    const seenPlotNumbers = new Set();

    plotMasterResults.forEach((result) => {
      if (result.plotId) {
        const key = normalizeKey(result.plotId);
        if (seenPlotIds.has(key)) result.errors.push('Duplicate PlotID.');
        seenPlotIds.add(key);
        duplicatePlotIds.add(key);
      }
      if (result.plotNumber) {
        const key = normalizeKey(result.plotNumber);
        if (seenPlotNumbers.has(key)) result.errors.push('Duplicate PlotNumber.');
        seenPlotNumbers.add(key);
        duplicatePlotNumbers.add(key);
      }
      result.errors.forEach((message) =>
        pushError(errors, 'plotMaster', message, { row: result.rowNumber, id: result.id })
      );
      result.warnings.forEach((message) =>
        pushWarning(warnings, 'plotMaster', message, { row: result.rowNumber, id: result.id })
      );
    });

    geometryPlotIds.forEach((plotId) => {
      if (!duplicatePlotIds.has(plotId)) {
        pushWarning(
          warnings,
          'plotGeometry',
          `PlotID "${plotId}" exists in PlotGeometry but has no PlotMaster row.`,
          { id: plotId }
        );
      }
    });

    onProgress?.({ phase: 'projectId', percent: 55 });
    const projectIds = collectProjectIds(parsed);
    if (projectIds.size > 1) {
      pushError(
        errors,
        'workbook',
        `Workbook contains multiple ProjectID values: ${[...projectIds].join(', ')}.`
      );
    } else if (projectId && projectIds.size === 1 && !projectIds.has(projectId)) {
      pushError(errors, 'workbook', 'ProjectID values across sheets do not match the Project sheet.');
    }

    onProgress?.({ phase: 'roads', percent: 65 });
    const roadGroups = groupRowsByField(parsed.roads || [], 'RoadID');
    const roadResults = [];
    roadGroups.forEach((rows, roadId) => {
      const result = validateRoadGroup(roadId, rows, projectId);
      roadResults.push(result);
      result.errors.forEach((message) =>
        pushError(errors, 'road', message, { row: result.rowNumber, id: roadId })
      );
    });
    if (!roadGroups.size) {
      pushWarning(warnings, 'roads', 'No roads detected — optional for minimum import path.');
    }

    onProgress?.({ phase: 'amenities', percent: 75 });
    const amenityCoordinateRows = filterPolygonCoordinateRows(parsed.amenities || []);
    const amenityGroups = groupRowsByField(amenityCoordinateRows, 'AmenityID');
    const amenityResults = [];
    if (amenityCoordinateRows.length > 0) {
      amenityGroups.forEach((rows, amenityId) => {
        const result = validateAmenityGroup(amenityId, rows, projectId);
        amenityResults.push(result);
        result.errors.forEach((message) =>
          pushError(errors, 'amenity', message, { row: result.rowNumber, id: amenityId })
        );
      });
    }

    onProgress?.({ phase: 'optional', percent: 85 });
    (parsed.surveyReference || []).forEach((row) => {
      const result = validateSurveyReferenceRow(row, projectId);
      result.errors.forEach((message) =>
        pushError(errors, 'surveyReference', message, { row: result.rowNumber, id: result.id })
      );
    });

    if (!(parsed.statistics || []).length) {
      pushWarning(warnings, 'statistics', 'Statistics sheet not present — optional.');
    }

    if (blockCoordinateRows.length === 0) {
      pushWarning(warnings, 'blocks', 'Blocks sheet empty or header-only — optional, skipped.');
    }

    if (amenityCoordinateRows.length === 0) {
      pushWarning(warnings, 'amenities', 'Amenities sheet empty or header-only — optional, skipped.');
    }

    (parsed.utilities || []).forEach((row) => {
      const geometryType = String(fieldValue(row, 'GeometryType', 'geometryType') ?? '').trim();
      if (geometryType && geometryType !== 'Point') {
        pushWarning(
          warnings,
          'utilities',
          `Utility "${fieldValue(row, 'UtilityID')}" uses ${geometryType} geometry — only Point import is supported in V2.1.`,
          { row: row.__rowNumber }
        );
      }
    });

    onProgress?.({ phase: 'complete', percent: 100 });

    const plotResults = plotMasterResults.map((master) => {
      const geometry = plotGeometryResults.find(
        (item) => normalizeKey(item.id) === normalizeKey(master.plotId)
      );
      return {
        ...master,
        polygonPoints: geometry?.polygonPoints || [],
      };
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      plotResults,
      roadResults,
      amenityResults,
      plotGeometryResults,
      plotMasterResults,
      stats: {
        plots: plotMasterResults.length,
        plotGeometryGroups: geometryGroups.size,
        roads: roadResults.length,
        amenities: amenityResults.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        workbookFormatVersion: version || parsed.format || WORKBOOK_FORMAT_VERSION,
        projectId,
      },
    };
  },
};

export { validateCoordinateVertices };

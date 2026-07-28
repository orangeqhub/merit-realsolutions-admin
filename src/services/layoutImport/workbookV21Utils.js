import * as XLSX from 'xlsx';
import { pointsToPolylineString } from './polylineUtils.js';
import {
  REQUIRED_SHEETS_V21,
  SHEET_NAMES_V21,
  WORKBOOK_FORMAT_VERSION,
} from './workbookV21Constants.js';

export function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isEmptyRow(row) {
  return Object.values(row).every((value) => String(value ?? '').trim() === '');
}

/** True when row carries polygon vertex coordinates (not header-only / metadata-only). */
export function hasPolygonCoordinateData(row) {
  const seq = fieldValue(row, 'Sequence');
  const lat = fieldValue(row, 'Latitude', 'latitude');
  const lng = fieldValue(row, 'Longitude', 'longitude');
  if (seq === '' || seq == null) return false;
  if (lat === '' || lat == null) return false;
  if (lng === '' || lng == null) return false;
  return true;
}

/** Optional polygon sheets: skip validation when no coordinate data rows exist. */
export function filterPolygonCoordinateRows(rows = []) {
  return (rows || []).filter((row) => !isEmptyRow(row) && hasPolygonCoordinateData(row));
}

export function resolveSheetName(workbook, preferredName) {
  return (
    workbook.SheetNames.find((name) => normalizeHeader(name) === normalizeHeader(preferredName))
    || workbook.SheetNames.find((name) => name.toLowerCase().includes(preferredName.toLowerCase()))
    || null
  );
}

export function sheetToRows(workbook, preferredName) {
  const sheetName = resolveSheetName(workbook, preferredName);
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

export function sheetHasData(workbook, preferredName) {
  return sheetToRows(workbook, preferredName).some((row) => !isEmptyRow(row));
}

export function isLegacyWorkbook(workbook) {
  const hasLegacyLayout = sheetHasData(workbook, 'Layout');
  const hasLegacyPlots = sheetHasData(workbook, 'Plots');
  const hasV21Project = sheetHasData(workbook, SHEET_NAMES_V21.project);
  return (hasLegacyLayout || hasLegacyPlots) && !hasV21Project;
}

export function findMissingRequiredSheets(workbook) {
  const missing = [];
  for (const sheetName of REQUIRED_SHEETS_V21) {
    if (!sheetHasData(workbook, sheetName)) {
      missing.push(sheetName);
    }
  }
  return missing;
}

export function formatMissingSheetError(missing = []) {
  if (!missing.length) return '';
  if (missing.length === 1) {
    return `Missing required sheet: ${missing[0]}`;
  }
  return `Missing required sheets: ${missing.join(', ')}`;
}

export function fieldValue(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
    const match = Object.keys(row).find((k) => normalizeHeader(k) === normalizeHeader(key));
    if (match && String(row[match] ?? '').trim() !== '') return row[match];
  }
  return '';
}

export function rowProjectId(row) {
  return String(fieldValue(row, 'ProjectID', 'projectId') ?? '').trim();
}

export function groupRowsByField(rows, fieldName) {
  const groups = new Map();
  rows.forEach((row, index) => {
    const id = String(fieldValue(row, fieldName) ?? '').trim();
    if (!id) return;
    const enriched = { ...row, __rowNumber: row.__rowNumber ?? index + 2 };
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(enriched);
  });
  return groups;
}

export function sortBySequence(rows) {
  return [...rows].sort(
    (a, b) => Number(fieldValue(a, 'Sequence')) - Number(fieldValue(b, 'Sequence'))
  );
}

export function verticesFromRows(rows) {
  return sortBySequence(rows).map((row) => ({
    lat: Number(fieldValue(row, 'Latitude', 'latitude')),
    lng: Number(fieldValue(row, 'Longitude', 'longitude')),
    rowNumber: row.__rowNumber,
  }));
}

export function polygonStringFromRows(rows) {
  const points = sortBySequence(rows).map((row) => ({
    lat: Number(fieldValue(row, 'Latitude', 'latitude')),
    lng: Number(fieldValue(row, 'Longitude', 'longitude')),
  }));
  return pointsToPolylineString(points);
}

export function synthesizeLayoutRowFromProject(projectRow = {}) {
  return {
    LayoutCode: fieldValue(projectRow, 'ProjectCode', 'LayoutCode', 'layoutCode'),
    LayoutName: fieldValue(projectRow, 'ProjectName', 'LayoutName', 'layoutName'),
    CenterLatitude: fieldValue(projectRow, 'CenterLatitude', 'centerLatitude'),
    CenterLongitude: fieldValue(projectRow, 'CenterLongitude', 'centerLongitude'),
    TotalAreaAcres: fieldValue(projectRow, 'TotalAreaAcres', 'totalAreaAcres'),
    SurveyNumber: fieldValue(projectRow, 'SurveyNumber', 'surveyNumber'),
    ApprovalNo: fieldValue(projectRow, 'ApprovalNumber', 'ApprovalNo', 'approvalNo'),
    ApprovalDate: fieldValue(projectRow, 'ApprovalDate', 'approvalDate'),
    DefaultRate: fieldValue(projectRow, 'DefaultRatePerSqYd', 'DefaultRate', 'defaultRate'),
    RegistrationCharge: fieldValue(projectRow, 'RegistrationCharge', 'registrationCharge'),
    DevelopmentCharge: fieldValue(projectRow, 'DevelopmentCharge', 'developmentCharge'),
    ProjectID: fieldValue(projectRow, 'ProjectID', 'projectId'),
    WorkbookFormatVersion: fieldValue(projectRow, 'WorkbookFormatVersion', 'workbookFormatVersion'),
  };
}

export function synthesizeLegacyPlotsFromV21(plotGeometry = [], plotMaster = []) {
  const geometryGroups = groupRowsByField(plotGeometry, 'PlotID');
  const masterByPlotId = new Map();
  plotMaster.forEach((row) => {
    const plotId = String(fieldValue(row, 'PlotID', 'plotId') ?? '').trim();
    if (plotId) masterByPlotId.set(normalizeKey(plotId), row);
  });

  const plots = [];
  geometryGroups.forEach((vertices, plotId) => {
    const master = masterByPlotId.get(normalizeKey(plotId)) || {};
    plots.push({
      PlotNo: fieldValue(master, 'PlotNumber', 'plotNumber') || plotId,
      PlotID: plotId,
      Block: fieldValue(master, 'BlockID', 'blockId', 'Block', 'block'),
      Facing: fieldValue(master, 'Facing', 'facing'),
      Status: fieldValue(master, 'Status', 'status') || 'Available',
      AreaSqYd: fieldValue(master, 'AreaSqYd', 'areaSqYd'),
      Rate: fieldValue(master, 'RatePerSqYd', 'ratePerSqYd', 'Rate', 'rate'),
      Polygon: polygonStringFromRows(vertices),
      Owner: fieldValue(master, 'Owner', 'owner'),
      CornerPlot: fieldValue(master, 'CornerPlot', 'cornerPlot'),
      RoadWidth: fieldValue(master, 'RoadWidth', 'roadWidth'),
      Remarks: fieldValue(master, 'Remarks', 'remarks'),
      __rowNumber: master.__rowNumber ?? vertices[0]?.__rowNumber,
    });
  });

  return plots;
}

export function extractWorkbookSheetsV21(workbook, fileName = 'import.xlsx') {
  const mapRows = (sheetKey) =>
    sheetToRows(workbook, SHEET_NAMES_V21[sheetKey])
      .filter((row) => !isEmptyRow(row))
      .map((row, index) => ({ ...row, __rowNumber: index + 2 }));

  const projectRows = mapRows('project');
  const boundaryRows = mapRows('boundary');
  const plotGeometryRows = mapRows('plotGeometry');
  const plotMasterRows = mapRows('plotMaster');
  const roadRows = mapRows('roads');
  const amenityRows = mapRows('amenities');
  const blockRows = mapRows('blocks');

  const projectRow = projectRows[0] || {};
  const layoutRow = synthesizeLayoutRowFromProject(projectRow);
  const plots = synthesizeLegacyPlotsFromV21(plotGeometryRows, plotMasterRows);
  const plotGeometryGroups = groupRowsByField(plotGeometryRows, 'PlotID').size;

  return {
    fileName,
    format: WORKBOOK_FORMAT_VERSION,
    workbookFormatVersion: fieldValue(projectRow, 'WorkbookFormatVersion') || '',
    projectRow,
    layoutRow,
    project: projectRows,
    statistics: mapRows('statistics'),
    surveyReference: mapRows('surveyReference'),
    boundary: boundaryRows,
    entrances: mapRows('entrances'),
    roads: roadRows,
    blocks: blockRows,
    plotGeometry: plotGeometryRows,
    plotMaster: plotMasterRows,
    amenities: amenityRows,
    utilities: mapRows('utilities'),
    landscaping: mapRows('landscaping'),
    plots,
    sheetPresence: {
      project: projectRows.length > 0,
      boundary: boundaryRows.length > 0,
      plotGeometry: plotGeometryRows.length > 0,
      plotMaster: plotMasterRows.length > 0,
      statistics: mapRows('statistics').length > 0,
      surveyReference: mapRows('surveyReference').length > 0,
      entrances: mapRows('entrances').length > 0,
      roads: mapRows('roads').length > 0,
      blocks: blockRows.length > 0,
      amenities: amenityRows.length > 0,
      utilities: mapRows('utilities').length > 0,
      landscaping: mapRows('landscaping').length > 0,
    },
    counts: {
      plots: plotMasterRows.length || plotGeometryGroups,
      plotGeometryGroups,
      plotGeometryVertices: plotGeometryRows.length,
      plotMaster: plotMasterRows.length,
      roads: groupRowsByField(roadRows, 'RoadID').size,
      amenities: groupRowsByField(amenityRows, 'AmenityID').size,
      boundaryVertices: boundaryRows.length,
      blocks: groupRowsByField(blockRows, 'BlockID').size,
    },
  };
}

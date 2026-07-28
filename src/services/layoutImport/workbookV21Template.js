/**
 * Build GIS Township Workbook V2.1 template workbook object.
 * GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE
 */
import * as XLSX from 'xlsx';
import {
  V21_SHEET_TAB_ORDER,
  PROJECT_HEADERS,
  STATISTICS_HEADERS,
  SURVEY_REFERENCE_HEADERS,
  BOUNDARY_HEADERS,
  ENTRANCE_HEADERS,
  ROAD_HEADERS_V21,
  BLOCK_HEADERS,
  PLOT_GEOMETRY_HEADERS,
  AMENITY_HEADERS_V21,
  UTILITY_HEADERS,
  LANDSCAPING_HEADERS,
  PLOT_MASTER_HEADERS,
  SAMPLE_PROJECT_ROW,
  SAMPLE_BOUNDARY_ROWS,
  SAMPLE_BLOCK_ROWS,
  SAMPLE_PLOT_GEOMETRY_ROWS,
  SAMPLE_AMENITY_ROWS,
  SAMPLE_PLOT_MASTER_ROW,
} from './workbookV21Constants.js';

export const TEMPLATE_V21_MARKER = 'GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE';

/**
 * @param {object} options
 * @param {boolean} [options.includeBlockSample=true] - Include closed BLK-A polygon sample
 * @param {boolean} [options.includeAmenitySample=true] - Include closed AMN-1 polygon sample
 */
export function buildV21TemplateWorkbook({
  includeBlockSample = true,
  includeAmenitySample = true,
} = {}) {
  const wb = XLSX.utils.book_new();

  const sheets = {
    Project: XLSX.utils.json_to_sheet([SAMPLE_PROJECT_ROW], { header: PROJECT_HEADERS }),
    Statistics: XLSX.utils.json_to_sheet([], { header: STATISTICS_HEADERS }),
    SurveyReference: XLSX.utils.json_to_sheet([], { header: SURVEY_REFERENCE_HEADERS }),
    Boundary: XLSX.utils.json_to_sheet(SAMPLE_BOUNDARY_ROWS, { header: BOUNDARY_HEADERS }),
    Entrances: XLSX.utils.json_to_sheet([], { header: ENTRANCE_HEADERS }),
    Roads: XLSX.utils.json_to_sheet([], { header: ROAD_HEADERS_V21 }),
    Blocks: XLSX.utils.json_to_sheet(
      includeBlockSample ? SAMPLE_BLOCK_ROWS : [],
      { header: BLOCK_HEADERS }
    ),
    PlotGeometry: XLSX.utils.json_to_sheet(SAMPLE_PLOT_GEOMETRY_ROWS, { header: PLOT_GEOMETRY_HEADERS }),
    Amenities: XLSX.utils.json_to_sheet(
      includeAmenitySample ? SAMPLE_AMENITY_ROWS : [],
      { header: AMENITY_HEADERS_V21 }
    ),
    Utilities: XLSX.utils.json_to_sheet([], { header: UTILITY_HEADERS }),
    Landscaping: XLSX.utils.json_to_sheet([], { header: LANDSCAPING_HEADERS }),
    PlotMaster: XLSX.utils.json_to_sheet([SAMPLE_PLOT_MASTER_ROW], { header: PLOT_MASTER_HEADERS }),
  };

  V21_SHEET_TAB_ORDER.forEach((tabName) => {
    XLSX.utils.book_append_sheet(wb, sheets[tabName], tabName);
  });

  return wb;
}

export function workbookToArrayBuffer(workbook) {
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

/** Read first-row headers from a sheet (for verification). */
export function readSheetHeaders(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet?.['!ref']) return [];
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const headers = [];
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
    headers.push(cell ? String(cell.v).trim() : '');
  }
  return headers.filter(Boolean);
}

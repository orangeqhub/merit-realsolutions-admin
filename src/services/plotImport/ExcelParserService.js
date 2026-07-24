import * as XLSX from 'xlsx';
import {
  SAMPLE_TEMPLATE_ROW,
  TEMPLATE_HEADERS,
  TEMPLATE_SHEET_NAME,
} from './importConstants.js';

const HEADER_ALIASES = {
  plotNumber: ['plot number', 'plot no', 'plot_no', 'plotno'],
  areaSqYards: ['area (sq.yd)', 'area', 'area sq yd', 'area_sq_yards'],
  ratePerSqYard: ['rate per sq.yd', 'rate', 'price', 'rate per sq yd', 'rate_per_sq_yard'],
  status: ['status'],
  facing: ['facing'],
  corner1Lat: ['corner 1 lat', 'corner1 lat', 'corner_1_lat'],
  corner1Lng: ['corner 1 lng', 'corner1 lng', 'corner_1_lng'],
  corner2Lat: ['corner 2 lat', 'corner2 lat', 'corner_2_lat'],
  corner2Lng: ['corner 2 lng', 'corner2 lng', 'corner_2_lng'],
  corner3Lat: ['corner 3 lat', 'corner3 lat', 'corner_3_lat'],
  corner3Lng: ['corner 3 lng', 'corner3 lng', 'corner_3_lng'],
  corner4Lat: ['corner 4 lat', 'corner4 lat', 'corner_4_lat'],
  corner4Lng: ['corner 4 lng', 'corner4 lng', 'corner_4_lng'],
};

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function resolveField(header) {
  const key = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key)) return field;
  }
  return null;
}

function mapRow(rawRow, rowNumber) {
  const mapped = { __rowNumber: rowNumber, __raw: { ...rawRow } };
  Object.entries(rawRow).forEach(([header, value]) => {
    const field = resolveField(header);
    if (field) mapped[field] = value;
  });
  return mapped;
}

function isEmptyRow(row) {
  const values = Object.entries(row).filter(([key]) => !key.startsWith('__'));
  return values.every(([, value]) => String(value ?? '').trim() === '');
}

export const ExcelParserService = {
  /** Build and trigger download of the Excel import template. */
  downloadTemplate(filename = 'plot-import-template.xlsx') {
    const ws = XLSX.utils.json_to_sheet([SAMPLE_TEMPLATE_ROW], { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, TEMPLATE_SHEET_NAME);
    XLSX.writeFile(wb, filename);
  },

  /** Parse .xlsx / .xls file into normalized row objects. */
  async parseFile(file) {
    if (!file) throw new Error('No file selected.');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      throw new Error('Only .xlsx and .xls files are supported.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('The workbook has no sheets.');

    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    if (!jsonRows.length) throw new Error('The file contains no data rows.');

    const rows = jsonRows
      .map((raw, index) => mapRow(raw, index + 2))
      .filter((row) => !isEmptyRow(row));

    if (!rows.length) throw new Error('No plot rows found after the header row.');

    return {
      fileName: file.name,
      sheetName,
      rows,
      totalRows: rows.length,
    };
  },

  /** Export validation errors as an Excel report. */
  downloadErrorReport(rows, filename = 'plot-import-errors.xlsx') {
    const exportRows = rows.map((row) => ({
      'Row #': row.rowNumber,
      'Plot Number': row.plotNumber ?? '',
      'Area (sq.yd)': row.areaSqYards ?? '',
      'Rate per sq.yd': row.ratePerSqYard ?? '',
      Status: row.status ?? '',
      Errors: (row.errors || []).join('; '),
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, filename);
  },
};

import * as XLSX from 'xlsx';
import {
  ALLOWED_EXTENSIONS,
  MAX_IMPORT_FILE_BYTES,
} from './constants.js';
import {
  extractWorkbookSheetsV21,
  findMissingRequiredSheets,
  formatMissingSheetError,
  isLegacyWorkbook,
} from './workbookV21Utils.js';

export {
  normalizeHeader,
  isEmptyRow,
  sheetToRows,
  resolveSheetName,
  findMissingRequiredSheets,
  formatMissingSheetError,
} from './workbookV21Utils.js';

/**
 * Read a File into a fresh ArrayBuffer. Never reuse or store buffers in React state.
 */
export async function readFileArrayBuffer(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('Invalid workbook file.');
  }
  return file.arrayBuffer();
}

/**
 * Parse raw bytes into an XLSX workbook object. Caller must pass a fresh ArrayBuffer.
 */
export function readXlsxWorkbook(buffer) {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Workbook file is empty.');
  }
  return XLSX.read(buffer, { type: 'array', cellDates: false });
}

/**
 * Transform an XLSX workbook into parsed V2.1 sheet rows.
 * GIS_WORKBOOK_VALIDATOR_V21_COMPLETE
 */
export function extractParsedSheets(workbook, fileName = 'import.xlsx') {
  if (isLegacyWorkbook(workbook)) {
    throw new Error(
      'This workbook uses the legacy Layout/Plots format. Download the GIS Township Workbook V2.1 template.'
    );
  }

  const missing = findMissingRequiredSheets(workbook);
  if (missing.length) {
    throw new Error(formatMissingSheetError(missing));
  }

  return extractWorkbookSheetsV21(workbook, fileName);
}

/**
 * Single entry: File → fresh ArrayBuffer → XLSX → parsed rows.
 * GIS_WORKBOOK_IMPORT_RUNTIME_FIX_COMPLETE
 */
export async function parseWorkbookFromFile(file, fileName) {
  const buffer = await readFileArrayBuffer(file);
  const workbook = readXlsxWorkbook(buffer);
  return extractParsedSheets(workbook, fileName || file.name || 'import.xlsx');
}

export function validateWorkbookFile(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('File exceeds the 50 MB import limit.');
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Only .xlsx and .xls files are supported.');
  }
}

export function friendlyWorkbookReadError(error) {
  const message = String(error?.message || error || '').toLowerCase();

  if (
    message.includes('detached arraybuffer')
    || message.includes('cannot perform construct')
    || message.includes('arraybuffer')
  ) {
    return 'Unable to read the workbook. Please select the workbook again.';
  }

  if (message.includes('empty') || message.includes('no file')) {
    return 'No workbook selected. Please choose an .xlsx file.';
  }

  if (message.includes('50 mb') || message.includes('import limit')) {
    return 'Workbook exceeds the 50 MB import limit.';
  }

  if (message.includes('.xlsx') || message.includes('supported')) {
    return 'Only .xlsx and .xls workbooks are supported.';
  }

  if (message.includes('missing required sheet')) {
    return error?.message || 'Missing required workbook sheet.';
  }

  if (message.includes('legacy layout/plots')) {
    return error?.message
      || 'This workbook uses the legacy Layout/Plots format. Download the GIS Township Workbook V2.1 template.';
  }

  return error?.message || 'Unable to read the workbook. Please select the workbook again.';
}

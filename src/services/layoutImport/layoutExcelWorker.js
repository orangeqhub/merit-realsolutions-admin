/** Web Worker — parses large layout workbooks off the main thread */
import { readXlsxWorkbook, extractParsedSheets } from './workbookParseUtils.js';

self.onmessage = (event) => {
  const { buffer, fileName } = event.data || {};
  try {
    if (!buffer || !buffer.byteLength) {
      throw new Error('Workbook buffer is empty.');
    }
    const workbook = readXlsxWorkbook(buffer);
    const parsed = extractParsedSheets(workbook, fileName || 'import.xlsx');
    self.postMessage({ ok: true, parsed });
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message || 'Workbook parse failed.' });
  }
};

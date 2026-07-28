import {
  parseWorkbookFromFile,
  validateWorkbookFile,
  friendlyWorkbookReadError,
  readXlsxWorkbook,
  extractParsedSheets,
} from './workbookParseUtils.js';
import { MAX_IMPORT_FILE_BYTES } from './constants.js';

export { parseWorkbookFromFile, validateWorkbookFile, friendlyWorkbookReadError };

export const LayoutExcelParser = {
  MAX_BYTES: MAX_IMPORT_FILE_BYTES,

  validateFile: validateWorkbookFile,

  parseInWorker(buffer, fileName, onProgress) {
    return new Promise((resolve, reject) => {
      onProgress?.({ phase: 'parsing', percent: 45 });

      const worker = new Worker(new URL('./layoutExcelWorker.js', import.meta.url), {
        type: 'module',
      });

      let settled = false;

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        worker.terminate();
        fn(value);
      };

      worker.onmessage = (event) => {
        const payload = event.data || {};
        if (!payload.ok) {
          finish(reject, new Error(payload.error || 'Workbook parse failed.'));
          return;
        }
        onProgress?.({ phase: 'complete', percent: 100 });
        finish(resolve, payload.parsed);
      };

      worker.onerror = (error) => {
        finish(reject, error);
      };

      // Never transfer the buffer — structured clone only (prevents detached ArrayBuffer).
      worker.postMessage({ buffer, fileName });
    });
  },

  async parseFile(file, { onProgress, useWorker = true } = {}) {
    validateWorkbookFile(file);
    onProgress?.({ phase: 'reading', percent: 10 });

    if (useWorker && typeof Worker !== 'undefined') {
      try {
        const buffer = await file.arrayBuffer();
        const workerBuffer = buffer.slice(0);
        return await this.parseInWorker(workerBuffer, file.name, onProgress);
      } catch {
        // Worker failed — parse on main thread with a brand-new buffer.
      }
    }

    onProgress?.({ phase: 'parsing', percent: 55 });
    try {
      const parsed = await parseWorkbookFromFile(file, file.name);
      onProgress?.({ phase: 'complete', percent: 100 });
      return parsed;
    } catch (error) {
      throw new Error(friendlyWorkbookReadError(error));
    }
  },

  parseBuffer(buffer, fileName) {
    const fresh = buffer.slice(0);
    const workbook = readXlsxWorkbook(fresh);
    return extractParsedSheets(workbook, fileName);
  },
};

import { LayoutImportService } from '../../services/layoutImport/layoutImportService.js';
import { LayoutImportValidator } from '../../services/layoutImport/layoutImportValidator.js';
import { friendlyWorkbookReadError } from '../../services/layoutImport/workbookParseUtils.js';

/** Wizard state machine — prevents skipping required steps */
export const WIZARD_STATE = {
  IDLE: 'idle',
  FILE_SELECTED: 'file_selected',
  WORKBOOK_PARSED: 'workbook_parsed',
  VALIDATED: 'validated',
  PREVIEW: 'preview',
  READY_TO_IMPORT: 'ready_to_import',
  IMPORTING: 'importing',
  COMPLETED: 'completed',
};

export function createInitialWizardData() {
  return {
    wizardState: WIZARD_STATE.IDLE,
    uploadedFile: null,
    uploadedFileName: '',
    uploadedFileSize: 0,
    workbookMetadata: null,
    parsed: null,
    validation: null,
    preview: null,
    importResult: null,
    error: null,
    progress: 0,
    progressLabel: '',
    showMapPreview: false,
  };
}

export function extractWorkbookMetadata(parsed, file) {
  if (!parsed && !file) return null;
  return {
    fileName: parsed?.fileName || file?.name || '',
    layoutName:
      parsed?.projectRow?.ProjectName
      || parsed?.layoutRow?.LayoutName
      || parsed?.layoutRow?.ProjectName
      || '',
    projectId: parsed?.projectRow?.ProjectID || parsed?.stats?.projectId || '',
    workbookFormatVersion: parsed?.workbookFormatVersion || parsed?.format || '',
    counts: parsed?.counts || { plots: 0, roads: 0, amenities: 0 },
  };
}

/** File → parsed rows (fresh ArrayBuffer each call — never store buffers) */
export async function parseWorkbook(file, options = {}) {
  return LayoutImportService.parseUpload(file, options);
}

/** Parsed rows → validation result */
export async function validateWorkbook(parsed, options = {}) {
  return LayoutImportValidator.validateParsed(parsed, options);
}

/** Parsed + validation → map preview DTO */
export function buildPreview(parsed, validation, layout) {
  return LayoutImportService.buildPreview(parsed, validation, layout);
}

/** Full pipeline: parse → validate → preview. File object only — no buffers in state. */
export async function runWorkbookPipeline(file, layout, { onProgress } = {}) {
  return LayoutImportService.runPipeline(file, layout, { onProgress });
}

export async function commitWorkbookImport({ layout, venture, preview }) {
  return LayoutImportService.commitImport({ layout, venture, preview });
}

export function friendlyImportError(error) {
  return friendlyWorkbookReadError(error);
}

export function friendlyPreviewError() {
  return 'Workbook preview could not be generated. Retry upload.';
}

/** Revoke tracked blob URLs on wizard close/unmount */
export function cleanupWorkbookResources({ blobUrls = [] } = {}) {
  blobUrls.forEach((url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
}

export function wizardStateToStepIndex(state) {
  switch (state) {
    case WIZARD_STATE.IDLE:
    case WIZARD_STATE.FILE_SELECTED:
      return 0;
    case WIZARD_STATE.WORKBOOK_PARSED:
    case WIZARD_STATE.VALIDATED:
      return 1;
    case WIZARD_STATE.PREVIEW:
      return 2;
    case WIZARD_STATE.READY_TO_IMPORT:
    case WIZARD_STATE.IMPORTING:
      return 3;
    case WIZARD_STATE.COMPLETED:
      return 4;
    default:
      return 0;
  }
}

export function canAdvanceToStep(targetStep, { wizardState, validation, preview }) {
  if (targetStep <= 0) return true;
  if (targetStep === 1) {
    return Boolean(validation)
      || wizardState === WIZARD_STATE.VALIDATED
      || wizardState === WIZARD_STATE.PREVIEW
      || wizardState === WIZARD_STATE.READY_TO_IMPORT;
  }
  if (targetStep === 2) {
    return validation?.valid && Boolean(preview);
  }
  if (targetStep === 3) {
    return validation?.valid && Boolean(preview?.plots?.length);
  }
  if (targetStep === 4) {
    return wizardState === WIZARD_STATE.COMPLETED;
  }
  return false;
}

import { PLOT_SOURCES, PLOT_MODES } from '../../shared/services/plotCreation/index.js';
import { pickLayoutOwnedFields } from '../../shared/services/layoutView.js';
import { LayoutExcelParser } from './layoutExcelParser.js';
import { LayoutImportValidator } from './layoutImportValidator.js';
import { mapValidationToPreview } from './layoutImportMapper.js';
import { LayoutImportSaveService } from './layoutImportSaveService.js';

export const LayoutImportService = {
  async parseUpload(file, options) {
    return LayoutExcelParser.parseFile(file, options);
  },

  async validate(parsed, options) {
    return LayoutImportValidator.validateParsed(parsed, options);
  },

  buildPreview(parsed, validation, layout) {
    return mapValidationToPreview(parsed, validation, layout);
  },

  async runPipeline(file, layout, { onProgress } = {}) {
    onProgress?.({ step: 'upload', percent: 5 });
    const parsed = await this.parseUpload(file, {
      onProgress: (event) => onProgress?.({ step: 'parse', ...event }),
    });

    onProgress?.({ step: 'validate', percent: 15 });
    const validation = await this.validate(parsed, {
      onProgress: (event) => onProgress?.({ step: 'validate', ...event }),
    });

    onProgress?.({ step: 'preview', percent: 85 });
    const preview = validation.valid
      ? this.buildPreview(parsed, validation, layout)
      : null;

    onProgress?.({ step: 'complete', percent: 100 });

    return { parsed, validation, preview };
  },

  async commitImport({ layout, venture, preview }) {
    if (!preview?.plots?.length) {
      throw new Error('No valid plots to import.');
    }
    return LayoutImportSaveService.saveImportedLayout({ layout, venture, preview });
  },

  getLayoutOwnedPatch(layoutMeta = {}) {
    return pickLayoutOwnedFields({
      code: layoutMeta.code,
      name: layoutMeta.name,
      surveyNumber: layoutMeta.surveyNumber,
      hasGeneratedLayout: true,
      plotCount: layoutMeta.plotCount,
      totalArea: layoutMeta.totalAreaAcres,
    });
  },
};

export { LayoutExcelParser, LayoutImportValidator, PLOT_SOURCES, PLOT_MODES };

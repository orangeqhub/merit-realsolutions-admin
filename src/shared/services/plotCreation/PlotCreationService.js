import { plotService } from '../plotService.js';
import { getPlotInventoryStatistics } from '../statisticsService.js';
import { omitPlotParentFields } from '../plotView.js';
import {
  PLOT_MODES,
  PLOT_SOURCES,
  mapApiPlotToDto,
  normalizePlotBatch,
  normalizePlotInput,
} from './plotDto.js';

export const PlotCreationService = {
  SOURCES: PLOT_SOURCES,
  MODES: PLOT_MODES,

  normalizePlotInput,
  normalizePlotBatch,
  mapApiPlotToDto,

  computeStatistics(plots = []) {
    return getPlotInventoryStatistics(plots);
  },

  /**
   * Persist plots locally through a single inventory path.
   * Parent fields (ventureName, city, amenities, …) are stripped in plotService.
   */
  createPlotsLocally({ layoutId, plots = [], source = PLOT_SOURCES.EXCEL, mode = PLOT_MODES.APPEND }) {
    if (!layoutId) throw new Error('Layout is required');
    if (!plots.length) throw new Error('No plots to create');

    const normalized = normalizePlotBatch(plots, source).map((plot) => omitPlotParentFields(plot));
    const result = plotService.persistPlots({
      layoutId,
      plots: normalized,
      mode,
      source,
    });

    return {
      ...result,
      statistics: this.computeStatistics(result.plots),
    };
  },

  /**
   * Build API payload rows for bulk import (excel source).
   */
  toImportPayloadRows(plots = [], source = PLOT_SOURCES.EXCEL) {
    return normalizePlotBatch(plots, source).map((plot) => ({
      plotNumber: plot.plotNumber,
      areaSqYards: plot.areaSqYards,
      ratePerSqYard: plot.ratePerSqYard,
      status: plot.status,
      facing: plot.facing,
      polygonPoints: plot.polygonPoints,
      latitude: plot.latitude,
      longitude: plot.longitude,
      shapeType: plot.shapeType,
      metadata: plot.metadata,
    }));
  },

  /**
   * Build API payload rows for generated layout save.
   */
  toGeneratorPayloadRows(plots = []) {
    return normalizePlotBatch(plots, PLOT_SOURCES.GENERATOR).map((plot) =>
      omitPlotParentFields(plot)
    );
  },

  /**
   * Sync API plot records into local inventory.
   * Strips parent denormalized fields before persistence (SSOT).
   */
  syncApiPlots(records = []) {
    if (!records.length) return [];
    const normalized = records.map((record) =>
      omitPlotParentFields(mapApiPlotToDto(record))
    );
    plotService.syncImportedPlots(normalized);
    return normalized;
  },
};

export { PLOT_MODES, PLOT_SOURCES, mapApiPlotToDto, normalizePlotBatch, normalizePlotInput } from './plotDto.js';

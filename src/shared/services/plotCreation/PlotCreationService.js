import { plotService } from '../plotService.js';
import { getPlotInventoryStatistics } from '../statisticsService.js';
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
   */
  createPlotsLocally({ layoutId, plots = [], source = PLOT_SOURCES.EXCEL, mode = PLOT_MODES.APPEND }) {
    if (!layoutId) throw new Error('Layout is required');
    if (!plots.length) throw new Error('No plots to create');

    const normalized = normalizePlotBatch(plots, source);
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
    return normalizePlotBatch(plots, PLOT_SOURCES.GENERATOR);
  },

  syncApiPlots(records = []) {
    if (!records.length) return [];
    const normalized = records.map((record) => mapApiPlotToDto(record));
    plotService.syncImportedPlots(normalized);
    return normalized;
  },
};

export { PLOT_MODES, PLOT_SOURCES, mapApiPlotToDto, normalizePlotBatch, normalizePlotInput } from './plotDto.js';

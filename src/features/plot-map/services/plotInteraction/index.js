import { PlotSearchService } from './PlotSearchService';
import { PlotFilterService } from './PlotFilterService';
import { PlotStatusService } from './PlotStatusService';
import { PlotDrawerService } from './PlotDrawerService';

export const PlotInteractionService = {
  search: PlotSearchService,
  filter: PlotFilterService,
  status: PlotStatusService,
  drawer: PlotDrawerService,

  applyPlotFilters(plots, { searchQuery = '', activeStatuses = [] } = {}) {
    const searched = PlotSearchService.filterPlots(plots, searchQuery);
    return PlotFilterService.filterByStatus(searched, activeStatuses);
  },

  createUndoSnapshot(plot) {
    return plot ? { ...plot } : null;
  },
};

export { PlotSearchService, PlotFilterService, PlotStatusService, PlotDrawerService };

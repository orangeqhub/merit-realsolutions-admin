import { dataStore } from '../../../shared/repositories/dataStore.js';
import { plotService } from '../../../shared/services/plotService.js';

/**
 * Local plot persistence for the map workspace.
 * Wraps existing dataStore / plotService — no backend.
 */
export const plotStorage = {
  getLayoutPlots(layoutId) {
    return plotService.getByLayout(layoutId);
  },

  createPlot(data) {
    return plotService.createPlot(data);
  },

  updatePlot(id, data) {
    return plotService.updatePlot(id, data);
  },

  deletePlot(id) {
    return plotService.deletePlot(id);
  },

  persistLayoutSnapshot(layoutId, plots) {
    const ids = new Set(plots.map((p) => p.id));
    dataStore.updateList('plots', (list) =>
      list.map((plot) => {
        if (plot.layoutId !== layoutId || !ids.has(plot.id)) return plot;
        const fresh = plots.find((p) => p.id === plot.id);
        return fresh ? { ...plot, ...fresh } : plot;
      })
    );
  },
};

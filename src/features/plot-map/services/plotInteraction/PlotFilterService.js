import { MAP_STATUS_COLORS } from '../../constants/mapStatus';

export const ALL_STATUS_FILTERS = Object.keys(MAP_STATUS_COLORS);

export const PlotFilterService = {
  /** When activeStatuses is empty, all plots are shown. */
  filterByStatus(plots = [], activeStatuses = []) {
    if (!activeStatuses.length) return plots;
    const allowed = new Set(activeStatuses);
    return plots.filter((plot) => allowed.has(plot.status));
  },

  toggleStatus(activeStatuses = [], status) {
    const set = new Set(activeStatuses);
    if (set.has(status)) {
      set.delete(status);
    } else {
      set.add(status);
    }
    return [...set];
  },

  isStatusActive(activeStatuses = [], status) {
    return activeStatuses.includes(status);
  },
};

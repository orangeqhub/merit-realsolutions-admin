export const PLOT_IMPORT_COMPLETE_EVENT = 'plot-import:complete';

export const MapRefreshService = {
  /** Notify dashboards and map workspaces to refresh plot data. */
  refreshAfterImport(detail = {}) {
    window.dispatchEvent(
      new CustomEvent(PLOT_IMPORT_COMPLETE_EVENT, { detail })
    );
  },

  subscribe(handler) {
    const listener = (event) => handler(event.detail || {});
    window.addEventListener(PLOT_IMPORT_COMPLETE_EVENT, listener);
    return () => window.removeEventListener(PLOT_IMPORT_COMPLETE_EVENT, listener);
  },
};

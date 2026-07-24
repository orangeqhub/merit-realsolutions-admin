export const LAYOUT_SAVE_COMPLETE_EVENT = 'layout-save:complete';

export const RefreshService = {
  refreshAfterSave(detail = {}) {
    window.dispatchEvent(
      new CustomEvent(LAYOUT_SAVE_COMPLETE_EVENT, { detail })
    );
    window.dispatchEvent(
      new CustomEvent('plot-import:complete', {
        detail: {
          layoutId: detail.layoutId,
          imported: detail.summary?.plots ?? detail.plots?.length ?? 0,
          source: detail.source || 'layout-save',
        },
      })
    );
  },

  subscribe(handler) {
    const listener = (event) => handler(event.detail || {});
    window.addEventListener(LAYOUT_SAVE_COMPLETE_EVENT, listener);
    return () => window.removeEventListener(LAYOUT_SAVE_COMPLETE_EVENT, listener);
  },
};

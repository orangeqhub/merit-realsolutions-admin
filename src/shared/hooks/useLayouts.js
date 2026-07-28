import { useMemo, useEffect } from "react";
import { useCollection } from "./useDataStore.js";
import { layoutService } from "../services/layoutService.js";
import { getLayoutStatistics, getLayoutsAggregateStatistics } from "../services/statisticsService.js";
import { resolveLayoutView, resolveLayoutViews } from "../services/layoutView.js";

export function useLayouts() {
  const layouts = useCollection("layouts");
  const ventures = useCollection("ventures");

  useEffect(() => {
    layoutService.repairStoredMediaUrls();
  }, []);

  const layoutViews = useMemo(
    () => resolveLayoutViews(layouts, ventures),
    [layouts, ventures]
  );

  return useMemo(
    () => ({
      /** Raw persisted layouts (no Venture merge). Prefer for writers / map engines. */
      layoutRecords: layouts,
      /** Read models with Venture fields inherited at read time. */
      layouts: layoutViews,
      loading: false,
      error: null,
      getLayout: (id) => layoutViews.find((l) => l.id === id),
      getLayoutRecord: (id) => layouts.find((l) => l.id === id),
      getByVenture: (ventureId) => layoutViews.filter((l) => l.ventureId === ventureId),
      resolveView: (layout) => resolveLayoutView(layout, ventures),
      getStatistics: (id) => getLayoutStatistics(id),
      aggregateStatistics: getLayoutsAggregateStatistics(layouts),
      addLayout: (data) => layoutService.createLayout(data),
      updateLayout: (id, data) => layoutService.updateLayout(id, data),
      removeLayout: (id) => layoutService.deleteLayout(id),
    }),
    [layouts, layoutViews, ventures]
  );
}

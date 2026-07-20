import { useMemo } from "react";
import { useCollection } from "./useDataStore.js";
import { layoutService } from "../services/layoutService.js";
import { getLayoutStatistics, getLayoutsAggregateStatistics } from "../services/statisticsService.js";

export function useLayouts() {
  const layouts = useCollection("layouts");

  return useMemo(
    () => ({
      layouts,
      loading: false,
      error: null,
      getLayout: (id) => layouts.find((l) => l.id === id),
      getByVenture: (ventureId) => layouts.filter((l) => l.ventureId === ventureId),
      getStatistics: (id) => getLayoutStatistics(id),
      aggregateStatistics: getLayoutsAggregateStatistics(layouts),
      addLayout: (data) => layoutService.createLayout(data),
      updateLayout: (id, data) => layoutService.updateLayout(id, data),
      removeLayout: (id) => layoutService.deleteLayout(id),
    }),
    [layouts]
  );
}

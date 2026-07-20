import { useMemo } from "react";
import { useCollection } from "./useDataStore.js";
import { ventureService } from "../services/ventureService.js";
import { getVentureStatistics, getVenturesAggregateStatistics } from "../services/statisticsService.js";

export function useVentures() {
  const ventures = useCollection("ventures");

  return useMemo(
    () => ({
      ventures,
      loading: false,
      error: null,
      getVenture: (id) => ventures.find((v) => v.id === id),
      getStatistics: (id) => getVentureStatistics(id),
      aggregateStatistics: getVenturesAggregateStatistics(ventures),
      addVenture: (data) => ventureService.createVenture(data),
      updateVenture: (id, data) => ventureService.updateVenture(id, data),
      removeVenture: (id) => ventureService.deleteVenture(id),
    }),
    [ventures]
  );
}

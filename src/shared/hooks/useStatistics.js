import { useMemo } from "react";
import { useStoreVersion } from "./useDataStore.js";
import { getDashboardMetrics } from "../services/statisticsService.js";

export function useStatistics() {
  const version = useStoreVersion();

  return useMemo(
    () => ({
      dashboard: getDashboardMetrics(),
      loading: false,
      error: null,
    }),
    [version]
  );
}

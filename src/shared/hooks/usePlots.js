import { useMemo } from "react";
import { useCollection } from "./useDataStore.js";
import { plotService } from "../services/plotService.js";
import { getPlotInventoryStatistics } from "../services/statisticsService.js";

export function usePlots() {
  const plots = useCollection("plots");

  return useMemo(
    () => ({
      plots,
      loading: false,
      error: null,
      getPlot: (id) => plots.find((p) => p.id === id),
      getByLayout: (layoutId) => plots.filter((p) => p.layoutId === layoutId),
      getByVenture: (ventureId) => plots.filter((p) => p.ventureId === ventureId),
      statistics: getPlotInventoryStatistics(plots),
      addPlot: (data) => plotService.createPlot(data),
      updatePlot: (id, data) => plotService.updatePlot(id, data),
      removePlot: (id) => plotService.deletePlot(id),
      setStatus: (id, status, extra) => plotService.setStatus(id, status, extra),
      reservePlot: (id, extra) => plotService.reservePlot(id, extra),
      bookPlot: (id, extra) => plotService.bookPlot(id, extra),
      sellPlot: (id, extra) => plotService.sellPlot(id, extra),
      blockPlot: (id) => plotService.blockPlot(id),
      releasePlot: (id) => plotService.releasePlot(id),
      cancelPlot: (id) => plotService.cancelPlot(id),
      assignPlot: (id, assignment) => plotService.assignPlot(id, assignment),
    }),
    [plots]
  );
}

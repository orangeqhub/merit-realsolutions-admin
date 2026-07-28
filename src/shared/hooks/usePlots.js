import { useMemo } from "react";
import { useCollection } from "./useDataStore.js";
import { plotService } from "../services/plotService.js";
import { getPlotInventoryStatistics } from "../services/statisticsService.js";
import { resolvePlotView, resolvePlotViews } from "../services/plotView.js";

export function usePlots() {
  const plots = useCollection("plots");
  const layouts = useCollection("layouts");
  const ventures = useCollection("ventures");

  const plotViews = useMemo(
    () => resolvePlotViews(plots, layouts, ventures),
    [plots, layouts, ventures]
  );

  return useMemo(
    () => ({
      /** Raw persisted plots (no parent merge). Prefer for map engines / writers. */
      plotRecords: plots,
      /** Read models with Layout + Venture fields inherited at read time. */
      plots: plotViews,
      loading: false,
      error: null,
      getPlot: (id) => plotViews.find((p) => p.id === id),
      getPlotRecord: (id) => plots.find((p) => p.id === id),
      getByLayout: (layoutId) => plotViews.filter((p) => p.layoutId === layoutId),
      getByVenture: (ventureId) => plotViews.filter((p) => p.ventureId === ventureId),
      resolveView: (plot) => resolvePlotView(plot, layouts, ventures),
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
      bulkImportPlots: (rows, layoutId) => plotService.bulkCreatePlots(rows, layoutId),
    }),
    [plots, plotViews, layouts, ventures]
  );
}

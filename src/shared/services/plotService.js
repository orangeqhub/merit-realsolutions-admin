import { dataStore } from "../repositories/dataStore.js";
import { getPlotInventoryStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { getLayoutOrThrow } from "./relationshipService.js";
import { derivePricing } from "../../pages/plotInventory/constants.js";
import { PLOT_MODES, PLOT_SOURCES } from "./plotCreation/plotDto.js";

const today = () => new Date().toISOString().split("T")[0];

const STATUS_EVENT = {
  Reserved: { type: "reserved", title: "Plot reserved", tone: "violet" },
  Booked: { type: "booked", title: "Plot booked", tone: "warning" },
  Sold: { type: "sold", title: "Plot sold & registered", tone: "success" },
  Blocked: { type: "blocked", title: "Plot blocked", tone: "danger" },
  Cancelled: { type: "cancelled", title: "Booking cancelled", tone: "danger" },
  Available: { type: "released", title: "Plot released", tone: "accent" },
};

function withHistory(plot, event) {
  return {
    ...plot,
    lastUpdated: today(),
    history: [{ ...event, date: today() }, ...(plot.history || [])],
  };
}

function buildPlotRecordFromDto(normalized, ctx, plots, { source, historyTitle, historyDescription }) {
  const id = normalized.id || nextId("PLT", plots, 100001);
  const pricing = derivePricing({ ...normalized, ...ctx });

  return withHistory(
    {
      ...normalized,
      ...ctx,
      id,
      ...pricing,
      areaSqYards: normalized.areaSqYards ?? pricing.area,
      ratePerSqYard: normalized.ratePerSqYard ?? pricing.rate,
      totalPrice: normalized.totalPrice ?? pricing.totalPrice,
      finalPrice: normalized.finalPrice ?? normalized.totalPrice ?? pricing.totalPrice,
      status: normalized.status || "Available",
      latitude: normalized.latitude ?? null,
      longitude: normalized.longitude ?? null,
      mapWidth: normalized.mapWidth ?? 72,
      mapHeight: normalized.mapHeight ?? 48,
      rotation: normalized.rotation ?? 0,
      shapeType: normalized.shapeType || "POLYGON",
      polygonPoints: normalized.polygonPoints || [],
      facing: normalized.facing || "East",
      blockName: normalized.metadata?.blockName || normalized.blockName || "",
      row: normalized.metadata?.row ?? normalized.row ?? null,
      col: normalized.metadata?.col ?? normalized.col ?? null,
      rowNumber: normalized.metadata?.rowNumber ?? normalized.rowNumber ?? null,
      columnNumber: normalized.metadata?.columnNumber ?? normalized.columnNumber ?? null,
      dimensions: normalized.metadata?.dimensions ?? normalized.dimensions ?? null,
      roadWidthFeet: normalized.metadata?.roadWidthFeet ?? normalized.roadWidthFeet ?? null,
      plcType: normalized.metadata?.plcType ?? normalized.plcType ?? "Open",
      cornerPlot: Boolean(normalized.metadata?.cornerPlot ?? normalized.cornerPlot),
      metadata: normalized.metadata || { source },
      source: normalized.metadata?.source || source,
      documents: normalized.documents || [],
      createdDate: normalized.createdDate || today(),
    },
    {
      type: "created",
      title: historyTitle,
      description: historyDescription,
      tone: "accent",
    }
  );
}

function resolveLayoutContext(data) {
  if (!data.layoutId) throw new Error("Layout is required");
  const layout = getLayoutOrThrow(data.layoutId);
  const venture = dataStore.getList("ventures").find((v) => v.id === layout.ventureId);
  return {
    layoutId: layout.id,
    layoutName: layout.name,
    ventureId: layout.ventureId,
    ventureName: venture?.name || layout.ventureName || data.ventureName,
    state: data.state || layout.state || venture?.state,
    district: data.district || layout.district || venture?.district,
    city: data.city || layout.city || venture?.city,
  };
}

export const plotService = {
  getAll() {
    return dataStore.getList("plots");
  },

  getById(id) {
    return dataStore.getList("plots").find((p) => p.id === id) || null;
  },

  getByLayout(layoutId) {
    return dataStore.getList("plots").filter((p) => p.layoutId === layoutId);
  },

  getByVenture(ventureId) {
    return dataStore.getList("plots").filter((p) => p.ventureId === ventureId);
  },

  getStatistics(plots) {
    const list = plots || dataStore.getList("plots");
    return getPlotInventoryStatistics(list);
  },

  createPlot(data) {
    const ctx = resolveLayoutContext(data);
    const plots = dataStore.getList("plots");
    const id = nextId("PLT", plots, 100001);
    const pricing = derivePricing({ ...data, ...ctx });

    const record = withHistory(
      {
        ...data,
        ...ctx,
        id,
        ...pricing,
        areaSqYards: pricing.area,
        ratePerSqYard: pricing.rate,
        status: data.status || "Available",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        mapWidth: data.mapWidth ?? 72,
        mapHeight: data.mapHeight ?? 48,
        rotation: data.rotation ?? 0,
        shapeType: data.shapeType || 'RECTANGLE',
        polygonPoints: data.polygonPoints || [],
        documents: [],
        createdDate: today(),
      },
      {
        type: "created",
        title: "Plot created",
        description: `Plot ${data.plotNumber} added to ${ctx.layoutName}`,
        tone: "accent",
      }
    );

    dataStore.updateList("plots", (list) => [record, ...list]);
    return record;
  },

  persistPlots({ layoutId, plots = [], mode = PLOT_MODES.APPEND, source = PLOT_SOURCES.EXCEL }) {
    if (!layoutId) throw new Error("Layout is required");
    if (!Array.isArray(plots) || !plots.length) {
      throw new Error("No plots to persist");
    }

    const ctx = resolveLayoutContext({ layoutId });
    let plotsList =
      mode === PLOT_MODES.REPLACE
        ? dataStore.getList("plots").filter((plot) => plot.layoutId !== layoutId)
        : [...dataStore.getList("plots")];

    const isGenerator = source === PLOT_SOURCES.GENERATOR;
    const historyTitle = isGenerator ? "Plot saved from layout generator" : "Plot imported";
    const created = [];

    for (const normalized of plots) {
      const record = buildPlotRecordFromDto(normalized, ctx, plotsList, {
        source,
        historyTitle,
        historyDescription: `Plot ${normalized.plotNumber} ${isGenerator ? "saved to" : "imported into"} ${ctx.layoutName}`,
      });
      plotsList.unshift(record);
      created.push(record);
    }

    dataStore.setList("plots", plotsList);

    return {
      plots: created,
      summary: {
        imported: created.length,
        failed: 0,
        duplicates: 0,
        total: plots.length,
        mode,
        source,
      },
    };
  },

  bulkCreatePlots(rows, layoutId, source = PLOT_SOURCES.EXCEL) {
    return plotService.persistPlots({
      layoutId,
      plots: rows,
      mode: PLOT_MODES.APPEND,
      source,
    });
  },

  replaceLayoutPlots(layoutId, rows, source = PLOT_SOURCES.GENERATOR) {
    if (!Array.isArray(rows)) throw new Error("Rows must be an array");

    if (!rows.length) {
      const remaining = dataStore.getList("plots").filter((plot) => plot.layoutId !== layoutId);
      dataStore.setList("plots", remaining);
      return { plots: [], summary: { imported: 0, total: 0, mode: PLOT_MODES.REPLACE, source } };
    }

    return plotService.persistPlots({
      layoutId,
      plots: rows,
      mode: PLOT_MODES.REPLACE,
      source,
    });
  },

  syncImportedPlots(records = []) {
    if (!records.length) return;
    const enriched = records.map((record) => {
      const pricing = derivePricing(record);
      return withHistory(
        {
          ...record,
          ...pricing,
          areaSqYards: record.areaSqYards ?? pricing.area,
          ratePerSqYard: record.ratePerSqYard ?? pricing.rate,
          totalPrice: record.totalPrice ?? pricing.totalPrice,
          finalPrice: record.finalPrice ?? record.totalPrice ?? pricing.totalPrice,
          polygonPoints: record.polygonPoints || [],
          shapeType: record.shapeType || "POLYGON",
          metadata: record.metadata || { source: record.source || PLOT_SOURCES.EXCEL },
          source: record.metadata?.source || record.source || PLOT_SOURCES.EXCEL,
          documents: record.documents || [],
          createdDate: record.createdDate || today(),
        },
        {
          type: "created",
          title: "Plot imported",
          description: `Plot ${record.plotNumber} imported`,
          tone: "accent",
        }
      );
    });

    dataStore.updateList("plots", (list) => {
      const ids = new Set(enriched.map((r) => r.id));
      const filtered = list.filter((p) => !ids.has(p.id));
      return [...enriched, ...filtered];
    });
  },

  updatePlot(id, data) {
    const existing = dataStore.getList("plots").find((p) => p.id === id);
    if (!existing) return null;

    const ctx = data.layoutId ? resolveLayoutContext({ ...existing, ...data }) : {};
    const record = withHistory(
      { ...existing, ...data, ...ctx, ...derivePricing({ ...existing, ...data, ...ctx }) },
      { type: "update", title: "Plot updated", description: "Plot information edited", tone: "info" }
    );

    dataStore.updateList("plots", (list) =>
      list.map((p) => (p.id === id ? record : p))
    );
    return record;
  },

  deletePlot(id) {
    dataStore.updateList("plots", (list) => list.filter((p) => p.id !== id));
    return { id };
  },

  setStatus(id, status, extra = {}) {
    const existing = dataStore.getList("plots").find((p) => p.id === id);
    if (!existing) return null;
    const event = STATUS_EVENT[status] || { type: "update", title: `Status: ${status}`, tone: "info" };
    const next = { ...existing, status, ...extra };
    if (status === "Available") {
      next.customer = null;
      next.customerId = null;
      next.reservationExpiry = null;
    }
    const record = withHistory(next, {
      ...event,
      description: extra.customer ? `${event.title} for ${extra.customer}` : event.title,
    });
    dataStore.updateList("plots", (list) =>
      list.map((p) => (p.id === id ? record : p))
    );
    return record;
  },

  reservePlot(id, extra) {
    return plotService.setStatus(id, "Reserved", extra);
  },

  bookPlot(id, extra) {
    return plotService.setStatus(id, "Booked", extra);
  },

  sellPlot(id, extra) {
    return plotService.setStatus(id, "Sold", extra);
  },

  blockPlot(id) {
    return plotService.setStatus(id, "Blocked");
  },

  releasePlot(id) {
    return plotService.setStatus(id, "Available");
  },

  cancelPlot(id) {
    return plotService.setStatus(id, "Cancelled");
  },

  assignPlot(id, assignment) {
    const existing = dataStore.getList("plots").find((p) => p.id === id);
    if (!existing) return null;
    const record = withHistory(
      { ...existing, ...assignment },
      {
        type: "assigned",
        title: "Plot assigned",
        description: assignment.customer ? `Assigned to ${assignment.customer}` : "Assignment updated",
        tone: "violet",
      }
    );
    dataStore.updateList("plots", (list) =>
      list.map((p) => (p.id === id ? record : p))
    );
    return record;
  },
};

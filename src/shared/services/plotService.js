import { dataStore } from "../repositories/dataStore.js";
import { getPlotInventoryStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { getLayoutOrThrow } from "./relationshipService.js";
import { derivePricing } from "../../pages/plotInventory/constants.js";
import { PLOT_MODES, PLOT_SOURCES } from "./plotCreation/plotDto.js";
import { omitPlotParentFields, pickPlotOwnedFields } from "./plotView.js";

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

/** Parent refs only — never denormalize Layout/Venture display fields onto Plot. */
function resolveParentRefs(data) {
  if (!data.layoutId) throw new Error("Layout is required");
  const layout = getLayoutOrThrow(data.layoutId);
  return {
    layoutId: layout.id,
    ventureId: layout.ventureId,
    layoutNameForHistory: layout.name || layout.id,
  };
}

function buildOwnedPlotRecord(data, { existing = null, id, source, historyEvent }) {
  const refs = resolveParentRefs({ layoutId: data.layoutId || existing?.layoutId });
  const owned = pickPlotOwnedFields(data);
  const pricingSource = { ...existing, ...owned };
  const pricing = derivePricing(pricingSource);

  const base = {
    ...(existing || {}),
    ...owned,
    id: id || existing?.id,
    layoutId: refs.layoutId,
    ventureId: refs.ventureId,
    plotNumber: String(owned.plotNumber ?? existing?.plotNumber ?? "").trim(),
    areaSqYards: owned.areaSqYards ?? pricing.area,
    ratePerSqYard: owned.ratePerSqYard ?? owned.priceOverride ?? pricing.rate,
    totalPrice: owned.totalPrice ?? pricing.totalPrice,
    finalPrice: owned.finalPrice ?? owned.totalPrice ?? pricing.finalPrice ?? pricing.totalPrice,
    offerPrice: owned.offerPrice ?? pricing.offerPrice,
    discount: owned.discount ?? pricing.discount,
    discountPct: owned.discountPct ?? pricing.discountPct,
    developmentCharges: owned.developmentCharges ?? pricing.developmentCharges,
    registrationCharges: owned.registrationCharges ?? pricing.registrationCharges,
    status: owned.status || existing?.status || "Available",
    facing: owned.facing || existing?.facing || "East",
    latitude: owned.latitude ?? existing?.latitude ?? null,
    longitude: owned.longitude ?? existing?.longitude ?? null,
    mapWidth: owned.mapWidth ?? existing?.mapWidth ?? 72,
    mapHeight: owned.mapHeight ?? existing?.mapHeight ?? 48,
    rotation: owned.rotation ?? existing?.rotation ?? 0,
    shapeType: owned.shapeType || existing?.shapeType || "RECTANGLE",
    polygonPoints: owned.polygonPoints || owned.coordinates || existing?.polygonPoints || [],
    blockName: owned.blockName || owned.block || existing?.blockName || existing?.block || "",
    block: owned.block ?? existing?.block ?? "",
    cornerPlot: Boolean(owned.cornerPlot ?? owned.corner ?? existing?.cornerPlot ?? existing?.corner),
    documents: owned.documents ?? existing?.documents ?? [],
    metadata: owned.metadata || existing?.metadata || (source ? { source } : {}),
    source: owned.source || existing?.source || source || undefined,
    createdDate: existing?.createdDate || owned.createdDate || today(),
  };

  // Ensure parent display fields are not introduced on create.
  const cleaned = existing ? base : omitPlotParentFields(base);

  return withHistory(cleaned, historyEvent);
}

function buildPlotRecordFromDto(normalized, refs, plots, { source, historyTitle, historyDescription }) {
  const id = normalized.id || nextId("PLT", plots, 100001);
  return buildOwnedPlotRecord(
    {
      ...normalized,
      layoutId: refs.layoutId,
      ventureId: refs.ventureId,
    },
    {
      id,
      source,
      historyEvent: {
        type: "created",
        title: historyTitle,
        description: historyDescription,
        tone: "accent",
      },
    }
  );
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
    const plots = dataStore.getList("plots");
    const id = nextId("PLT", plots, 100001);
    const refs = resolveParentRefs(data);

    const record = buildOwnedPlotRecord(data, {
      id,
      historyEvent: {
        type: "created",
        title: "Plot created",
        description: `Plot ${data.plotNumber} added to ${refs.layoutNameForHistory}`,
        tone: "accent",
      },
    });

    dataStore.updateList("plots", (list) => [record, ...list]);
    return record;
  },

  persistPlots({ layoutId, plots = [], mode = PLOT_MODES.APPEND, source = PLOT_SOURCES.EXCEL }) {
    if (!layoutId) throw new Error("Layout is required");
    if (!Array.isArray(plots) || !plots.length) {
      throw new Error("No plots to persist");
    }

    const refs = resolveParentRefs({ layoutId });
    let plotsList =
      mode === PLOT_MODES.REPLACE
        ? dataStore.getList("plots").filter((plot) => plot.layoutId !== layoutId)
        : [...dataStore.getList("plots")];

    const isGenerator = source === PLOT_SOURCES.GENERATOR;
    const historyTitle = isGenerator ? "Plot saved from layout generator" : "Plot imported";
    const created = [];

    for (const normalized of plots) {
      const record = buildPlotRecordFromDto(normalized, refs, plotsList, {
        source,
        historyTitle,
        historyDescription: `Plot ${normalized.plotNumber} ${isGenerator ? "saved to" : "imported into"} ${refs.layoutNameForHistory}`,
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
      const owned = pickPlotOwnedFields(record);
      const pricing = derivePricing({ ...record, ...owned });
      const base = omitPlotParentFields({
        ...owned,
        id: record.id,
        layoutId: record.layoutId,
        ventureId: record.ventureId,
        ...pricing,
        areaSqYards: owned.areaSqYards ?? pricing.area,
        ratePerSqYard: owned.ratePerSqYard ?? pricing.rate,
        totalPrice: owned.totalPrice ?? pricing.totalPrice,
        finalPrice: owned.finalPrice ?? owned.totalPrice ?? pricing.totalPrice,
        polygonPoints: owned.polygonPoints || record.polygonPoints || [],
        shapeType: owned.shapeType || record.shapeType || "POLYGON",
        metadata: owned.metadata || record.metadata || { source: record.source || PLOT_SOURCES.EXCEL },
        source: owned.source || record.metadata?.source || record.source || PLOT_SOURCES.EXCEL,
        documents: owned.documents || record.documents || [],
        createdDate: owned.createdDate || record.createdDate || today(),
        status: owned.status || record.status || "Available",
      });
      return withHistory(base, {
        type: "created",
        title: "Plot imported",
        description: `Plot ${record.plotNumber} imported`,
        tone: "accent",
      });
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

    const layoutId = data.layoutId || existing.layoutId;
    const record = buildOwnedPlotRecord(
      { ...data, layoutId },
      {
        existing,
        id,
        historyEvent: {
          type: "update",
          title: "Plot updated",
          description: "Plot information edited",
          tone: "info",
        },
      }
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
    const ownedExtra = pickPlotOwnedFields(extra);
    const next = { ...existing, status, ...ownedExtra };
    if (status === "Available") {
      next.customer = null;
      next.customerId = null;
      next.reservationExpiry = null;
    }
    const record = withHistory(next, {
      ...event,
      description: ownedExtra.customer || extra.customer
        ? `${event.title} for ${ownedExtra.customer || extra.customer}`
        : event.title,
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
    const ownedAssignment = pickPlotOwnedFields(assignment);
    const record = withHistory(
      { ...existing, ...ownedAssignment },
      {
        type: "assigned",
        title: "Plot assigned",
        description: ownedAssignment.customer
          ? `Assigned to ${ownedAssignment.customer}`
          : "Assignment updated",
        tone: "violet",
      }
    );
    dataStore.updateList("plots", (list) =>
      list.map((p) => (p.id === id ? record : p))
    );
    return record;
  },
};

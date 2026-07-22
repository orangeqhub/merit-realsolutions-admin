import { dataStore } from "../repositories/dataStore.js";
import { getPlotInventoryStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { getLayoutOrThrow } from "./relationshipService.js";
import { derivePricing } from "../../pages/plotInventory/constants.js";

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

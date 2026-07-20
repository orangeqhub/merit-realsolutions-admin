import { dataStore } from "../repositories/dataStore.js";
import { getLayoutStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { getVentureOrThrow, cascadeDeleteLayout } from "./relationshipService.js";

const today = () => new Date().toISOString().split("T")[0];
const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80";

function normalizeMedia(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof File) return URL.createObjectURL(value);
  return fallback;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  return gallery.map((item) => (typeof item === "string" ? item : URL.createObjectURL(item)));
}

export const layoutService = {
  getAll() {
    return dataStore.getList("layouts");
  },

  getById(id) {
    return dataStore.getList("layouts").find((l) => l.id === id) || null;
  },

  getByVenture(ventureId) {
    return dataStore.getList("layouts").filter((l) => l.ventureId === ventureId);
  },

  getPlots(layoutId) {
    return dataStore.getList("plots").filter((p) => p.layoutId === layoutId);
  },

  getStatistics(layoutId) {
    return getLayoutStatistics(layoutId);
  },

  createLayout(data) {
    if (!data.ventureId) throw new Error("Venture is required");
    const venture = getVentureOrThrow(data.ventureId);
    const layouts = dataStore.getList("layouts");
    const id = nextId("LYT", layouts, 3001);

    const record = {
      ...data,
      id,
      ventureId: venture.id,
      ventureName: venture.name,
      state: data.state || venture.state,
      district: data.district || venture.district,
      city: data.city || venture.city,
      totalArea: Number(data.totalArea) || 0,
      plotCount: Number(data.plotCount) || 0,
      thumbnail: normalizeMedia(data.thumbnail, data.banner ? normalizeMedia(data.banner) : FALLBACK_BANNER),
      banner: normalizeMedia(data.banner, FALLBACK_BANNER),
      layoutPlan: normalizeMedia(data.layoutPlan, ""),
      masterPlan: normalizeMedia(data.masterPlan, ""),
      gallery: normalizeGallery(data.gallery),
      progress: data.status === "Draft" ? 5 : 10,
      createdDate: today(),
      lastUpdated: today(),
      documents: [],
      activities: [
        {
          type: "created",
          title: data.status === "Draft" ? "Draft created" : "Layout created",
          description: `${data.name} added to ${venture.name}`,
          date: today(),
          tone: "accent",
        },
      ],
    };

    dataStore.updateList("layouts", (list) => [record, ...list]);
    return record;
  },

  updateLayout(id, data) {
    const existing = dataStore.getList("layouts").find((l) => l.id === id);
    if (!existing) return null;

    let ventureId = existing.ventureId;
    let ventureName = existing.ventureName;
    if (data.ventureId) {
      const venture = getVentureOrThrow(data.ventureId);
      ventureId = venture.id;
      ventureName = venture.name;
    } else if (existing.ventureId) {
      const venture = getVentureOrThrow(existing.ventureId);
      ventureName = venture.name;
    }

    const record = {
      ...existing,
      ...data,
      ventureId,
      ventureName,
      lastUpdated: today(),
      thumbnail: data.thumbnail ? normalizeMedia(data.thumbnail, existing.thumbnail) : existing.thumbnail,
      banner: data.banner ? normalizeMedia(data.banner, existing.banner) : existing.banner,
      gallery: data.gallery ? normalizeGallery(data.gallery) : existing.gallery,
      activities: [
        {
          type: "update",
          title: "Layout updated",
          description: "Layout information edited",
          date: today(),
          tone: "info",
        },
        ...(existing.activities || []),
      ],
    };

    dataStore.updateList("layouts", (list) =>
      list.map((l) => (l.id === id ? record : l))
    );

    if (record.name !== existing.name) {
      dataStore.updateList("plots", (plots) =>
        plots.map((p) =>
          p.layoutId === id ? { ...p, layoutName: record.name } : p
        )
      );
    }

    return record;
  },

  deleteLayout(id) {
    cascadeDeleteLayout(id);
    return { id };
  },
};

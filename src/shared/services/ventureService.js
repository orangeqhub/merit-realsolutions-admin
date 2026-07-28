import { dataStore } from "../repositories/dataStore.js";
import { ventureRepository } from "../repositories/index.js";
import { getVentureStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { cascadeDeleteVenture } from "./relationshipService.js";
import {
  deactivateVentureOnBackend,
  syncVentureToBackend,
} from "./ventureCatalogSync.js";

const today = () => new Date().toISOString().split("T")[0];

function fallbackLogo(name) {
  const label = encodeURIComponent(name || "Venture");
  return `https://ui-avatars.com/api/?name=${label}&background=2563eb&color=ffffff&size=128&bold=true`;
}

function normalizeMedia(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) return fallback;
    return value;
  }
  if (value instanceof File) return URL.createObjectURL(value);
  return fallback;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((item) => {
      if (typeof item === 'string') {
        return item.startsWith('blob:') ? null : item;
      }
      if (item instanceof File) return URL.createObjectURL(item);
      return null;
    })
    .filter(Boolean);
}

export const ventureService = {
  getAll() {
    return dataStore.getList("ventures");
  },

  getById(id) {
    return dataStore.getList("ventures").find((v) => v.id === id) || null;
  },

  getLayouts(ventureId) {
    return dataStore.getList("layouts").filter((l) => l.ventureId === ventureId);
  },

  getStatistics(ventureId) {
    return getVentureStatistics(ventureId);
  },

  createVenture(data) {
    const ventures = dataStore.getList("ventures");
    const id = nextId("VNT", ventures, 2001);
    const company = data.developerId
      ? dataStore.getList("companies").find((c) => c.id === data.developerId)
      : null;

    const record = {
      ...data,
      id,
      developerId: data.developerId || company?.id || data.developerId || null,
      developer: data.developer || company?.name || "",
      logo: normalizeMedia(data.logo, fallbackLogo(data.name)),
      banner: normalizeMedia(
        data.banner,
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80"
      ),
      thumbnail: normalizeMedia(data.thumbnail, data.banner),
      gallery: normalizeGallery(data.gallery),
      landmarks: data.landmarks
        ? Array.isArray(data.landmarks)
          ? data.landmarks
          : String(data.landmarks).split("\n").filter(Boolean)
        : [],
      createdDate: today(),
      documents: [],
      nearbyPlaces: { hospitals: [], schools: [], airport: "", highway: "" },
      activities: [
        {
          type: "created",
          title: "Venture created",
          description: `${data.name} onboarded to ERP`,
          date: today(),
          tone: "accent",
        },
      ],
    };

    dataStore.updateList("ventures", (list) => [record, ...list]);
    void syncVentureToBackend(record).then((result) => {
      if (!result?.ok || !result.media) return;
      dataStore.updateList("ventures", (list) =>
        list.map((v) => (v.id === record.id ? { ...v, ...result.media } : v))
      );
    });
    return record;
  },

  updateVenture(id, data) {
    const ventures = dataStore.getList("ventures");
    const existing = ventures.find((v) => v.id === id);
    if (!existing) return null;

    const record = {
      ...existing,
      ...data,
      logo: normalizeMedia(data.logo, existing.logo),
      banner: normalizeMedia(data.banner, existing.banner),
      thumbnail: normalizeMedia(data.thumbnail, existing.thumbnail),
      gallery: data.gallery ? normalizeGallery(data.gallery) : existing.gallery,
      landmarks: data.landmarks
        ? Array.isArray(data.landmarks)
          ? data.landmarks
          : String(data.landmarks).split("\n").filter(Boolean)
        : existing.landmarks,
      activities: [
        {
          type: "update",
          title: "Venture updated",
          description: "Profile information edited",
          date: today(),
          tone: "info",
        },
        ...(existing.activities || []),
      ],
    };

    dataStore.updateList("ventures", (list) =>
      list.map((v) => (v.id === id ? record : v))
    );

    // Layout/Plot names are no longer denormalized — readers use resolveLayoutView / resolvePlotView.

    void syncVentureToBackend(record).then((result) => {
      if (!result?.ok || !result.media) return;
      dataStore.updateList("ventures", (list) =>
        list.map((v) => (v.id === id ? { ...v, ...result.media } : v))
      );
    });
    return record;
  },

  deleteVenture(id) {
    cascadeDeleteVenture(id);
    void deactivateVentureOnBackend(id);
    return { id };
  },
};

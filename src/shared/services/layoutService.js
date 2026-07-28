import { dataStore } from "../repositories/dataStore.js";
import { getLayoutStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";
import { getVentureOrThrow, cascadeDeleteLayout } from "./relationshipService.js";
import { pickLayoutOwnedFields } from "./layoutView.js";
import { sanitizeStoredMediaUrl } from "../../utils/media.js";
import {
  canPersistLayoutToBackend,
  prepareLayoutMediaForBackend,
  saveLayoutProfileToBackend,
  slimLayoutForLocalCache,
} from "./layoutBackendPersistence.js";

const today = () => new Date().toISOString().split("T")[0];

function repairLayoutMedia(record) {
  if (!record) return record;
  const layoutPlan = sanitizeStoredMediaUrl(record.layoutPlan);
  const masterPlan = sanitizeStoredMediaUrl(record.masterPlan);
  if (layoutPlan === (record.layoutPlan || "") && masterPlan === (record.masterPlan || "")) {
    return record;
  }
  return { ...record, layoutPlan, masterPlan };
}

function normalizeMedia(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'string') {
    return sanitizeStoredMediaUrl(value) || fallback;
  }
  if (typeof File !== 'undefined' && value instanceof File) {
    return fallback;
  }
  return fallback;
}

function buildOwnedLayoutPayload(data, { venture, existing = null, id }) {
  const owned = pickLayoutOwnedFields(data);

  const record = {
    ...(existing || {}),
    ...owned,
    id: id || existing?.id,
    ventureId: venture.id,
    name: (owned.name ?? existing?.name ?? "").trim(),
    code: owned.code ?? existing?.code ?? "",
    layoutType: owned.layoutType ?? existing?.layoutType ?? "",
    status: owned.status || existing?.status || "Draft",
    surveyNumber: owned.surveyNumber ?? existing?.surveyNumber ?? "",
    totalArea: Number(owned.totalArea ?? existing?.totalArea) || 0,
    plotCount: Number(owned.plotCount ?? existing?.plotCount) || 0,
    layoutPlan: owned.layoutPlan
      ? normalizeMedia(owned.layoutPlan, existing?.layoutPlan || "")
      : existing?.layoutPlan || "",
    masterPlan: owned.masterPlan
      ? normalizeMedia(owned.masterPlan, existing?.masterPlan || "")
      : existing?.masterPlan || "",
    generationSnapshot: owned.generationSnapshot ?? existing?.generationSnapshot,
    geometry: owned.geometry ?? existing?.geometry,
    roadNetwork: owned.roadNetwork ?? existing?.roadNetwork,
    layoutNotes: owned.layoutNotes ?? owned.notes ?? existing?.layoutNotes ?? existing?.notes ?? "",
    documents: owned.documents ?? existing?.documents ?? [],
    progress:
      owned.progress ??
      existing?.progress ??
      (owned.status === "Draft" || (!owned.status && existing?.status === "Draft") ? 5 : 10),
    hasGeneratedLayout: owned.hasGeneratedLayout ?? existing?.hasGeneratedLayout ?? false,
    lastUpdated: today(),
  };

  if (!existing) {
    record.createdDate = today();
    record.activities = [
      {
        type: "created",
        title: record.status === "Draft" ? "Draft created" : "Layout created",
        description: `${record.name} added to ${venture.name}`,
        date: today(),
        tone: "accent",
      },
    ];
  } else {
    record.createdDate = existing.createdDate || today();
    record.activities = [
      {
        type: "update",
        title: "Layout updated",
        description: "Layout information edited",
        date: today(),
        tone: "info",
      },
      ...(existing.activities || []),
    ];
  }

  return record;
}

async function persistLayoutRecord(record, venture) {
  let persistedToBackend = false;

  if (await canPersistLayoutToBackend()) {
    try {
      const media = await prepareLayoutMediaForBackend(record);
      const withMedia = {
        ...record,
        layoutPlan: media.layoutPlan || record.layoutPlan,
        masterPlan: media.masterPlan || record.masterPlan,
        banner: media.banner || record.banner || media.layoutPlan || record.layoutPlan,
      };
      await saveLayoutProfileToBackend(withMedia, venture);
      persistedToBackend = true;
      Object.assign(record, withMedia, { persistedToBackend: true });
    } catch (error) {
      console.warn('[layoutService] backend save failed, using local cache:', error.message);
    }
  }

  const localRecord = slimLayoutForLocalCache({
    ...record,
    persistedToBackend,
  });

  return { record, localRecord, persistedToBackend };
}

function writeLayoutList(updater) {
  try {
    return dataStore.updateList("layouts", updater);
  } catch (error) {
    if (error?.name === 'QuotaExceededError' || String(error?.message || '').includes('quota')) {
      throw new Error('Browser storage is full. Start the backend server and save again to persist layouts in the database.');
    }
    throw error;
  }
}

export const layoutService = {
  getAll() {
    return dataStore.getList("layouts").map(repairLayoutMedia);
  },

  repairStoredMediaUrls() {
    const list = dataStore.getList("layouts");
    let changed = false;
    const next = list.map((layout) => {
      const repaired = repairLayoutMedia(layout);
      if (repaired !== layout) changed = true;
      return repaired;
    });
    if (!changed) return false;
    dataStore.updateList("layouts", () => next);
    return true;
  },

  getById(id) {
    const layout = dataStore.getList("layouts").find((l) => l.id === id) || null;
    return repairLayoutMedia(layout);
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

  async createLayout(data) {
    if (!data.ventureId) throw new Error("Venture is required");
    const venture = getVentureOrThrow(data.ventureId);
    const layouts = dataStore.getList("layouts");
    const id = nextId("LYT", layouts, 3001);

    const record = buildOwnedLayoutPayload(data, { venture, id });
    const { localRecord, persistedToBackend } = await persistLayoutRecord(record, venture);

    writeLayoutList((list) => [localRecord, ...list]);

    if (typeof console !== 'undefined' && console.info) {
      console.info('LAYOUT_PERSISTENCE_COMPLETE', {
        layoutId: record.id,
        source: persistedToBackend ? 'database' : 'local',
      });
    }

    return { ...record, persistedToBackend };
  },

  async updateLayout(id, data) {
    const existing = dataStore.getList("layouts").find((l) => l.id === id);
    if (!existing) return null;

    const ventureId = data.ventureId || existing.ventureId;
    const venture = getVentureOrThrow(ventureId);

    const record = buildOwnedLayoutPayload(data, { venture, existing, id });
    const { localRecord, persistedToBackend } = await persistLayoutRecord(record, venture);

    writeLayoutList((list) =>
      list.map((l) => (l.id === id ? localRecord : l))
    );

    if (typeof console !== 'undefined' && console.info) {
      console.info('LAYOUT_PERSISTENCE_COMPLETE', {
        layoutId: id,
        source: persistedToBackend ? 'database' : 'local',
      });
    }

    return { ...record, persistedToBackend };
  },

  saveGenerationSnapshot(id, snapshot, { source = 'local' } = {}) {
    const existing = dataStore.getList("layouts").find((l) => l.id === id);
    if (!existing) return null;

    const slimSnapshot = source === 'api' || existing.persistedToBackend
      ? {
          source: source === 'api' ? 'api' : (snapshot.source || 'api'),
          savedAt: snapshot.savedAt || new Date().toISOString(),
          summary: snapshot.summary || null,
        }
      : snapshot;

    const record = {
      ...existing,
      hasGeneratedLayout: true,
      generationSnapshot: slimSnapshot,
      plotCount: snapshot?.summary?.plots ?? existing.plotCount,
      lastUpdated: today(),
      activities: [
        {
          type: "update",
          title: "Generated layout saved",
          description: `${snapshot?.summary?.plots ?? 0} plots persisted from layout generator`,
          date: today(),
          tone: "success",
        },
        ...(existing.activities || []),
      ],
    };

    const localRecord = slimLayoutForLocalCache(record);

    writeLayoutList((list) =>
      list.map((l) => (l.id === id ? localRecord : l))
    );

    return record;
  },

  deleteLayout(id) {
    cascadeDeleteLayout(id);
    return { id };
  },
};

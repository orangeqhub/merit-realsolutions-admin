/**
 * LocalStorage persistence provider.
 * Components must never import this — only dataStore/repositories use it.
 *
 * Loads any known schema version, runs migrations, then persists at DATA_SCHEMA_VERSION.
 */

import {
  DATA_SCHEMA_VERSION,
  STORAGE_KEY,
  VERSION_KEY,
} from "./schemaVersion.js";
import { runStorageMigrations } from "./migrations/index.js";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStoredVersion() {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  const raw = window.localStorage.getItem(VERSION_KEY);
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export const localStorageProvider = {
  /** Current schema version written by this build. */
  get schemaVersion() {
    return DATA_SCHEMA_VERSION;
  },

  /**
   * Load ERP data. Automatically upgrades older schemas (e.g. v1 → v2 SSOT strip).
   * Returns null only when no usable payload exists.
   */
  load() {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const fromVersion = readStoredVersion() || 1;
    const { data, version, migrated } = runStorageMigrations(parsed, fromVersion);

    // Persist upgraded snapshot when migration ran or version marker was missing/outdated.
    if (migrated || fromVersion !== version) {
      this.save(data, version);
    }

    return data;
  },

  save(data, version = DATA_SCHEMA_VERSION) {
    if (typeof window === "undefined" || !window.localStorage) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.localStorage.setItem(VERSION_KEY, String(version));
      return true;
    } catch (error) {
      if (error?.name === 'QuotaExceededError') {
        const quotaError = new Error(
          'Browser storage quota exceeded. Ensure the backend is running and save again to persist in the database.'
        );
        quotaError.name = 'QuotaExceededError';
        quotaError.cause = error;
        throw quotaError;
      }
      throw error;
    }
  },

  update(partial) {
    const current = this.load() || {};
    return this.save({ ...current, ...partial });
  },

  remove() {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(VERSION_KEY);
  },

  clear() {
    this.remove();
  },
};

export { DATA_SCHEMA_VERSION, STORAGE_KEY, VERSION_KEY };

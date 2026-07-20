/**
 * LocalStorage persistence provider.
 * Components must never import this — only dataStore/repositories use it.
 */

const STORAGE_KEY = "mrs_erp_data";
const VERSION_KEY = "mrs_erp_data_version";
const CURRENT_VERSION = 1;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const localStorageProvider = {
  load() {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const version = window.localStorage.getItem(VERSION_KEY);
    if (Number(version) !== CURRENT_VERSION) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParse(raw);
  },

  save(data) {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    return true;
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

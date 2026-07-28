/**
 * Central data store with LocalStorage persistence.
 * All repositories read/write here; UI subscribes for cross-module sync.
 */

import { localStorageProvider } from "../storage/localStorageProvider.js";

let snapshotVersion = 0;

const LIST_KEYS = [
  "ventures",
  "layouts",
  "plots",
  "properties",
  "customers",
  "channelPartners",
  "bookings",
  "payments",
  "companies",
  "leads",
  "followups",
  "agreements",
  "registrations",
  "receipts",
];

const OBJECT_KEYS = [
  "reservations",
  "partnerAssignments",
  "engagement",
  "reservationSettings",
  "reservationRules",
];

class DataStore {
  constructor() {
    this._lists = {};
    this._objects = {};
    this._listeners = new Set();
    this._initialized = false;
    this._persistEnabled = true;
  }

  init(seed = {}) {
    LIST_KEYS.forEach((key) => {
      this._lists[key] = Array.isArray(seed[key]) ? [...seed[key]] : [];
    });
    OBJECT_KEYS.forEach((key) => {
      this._objects[key] = seed[key] != null ? structuredClone(seed[key]) : null;
    });
    this._initialized = true;
    this._persist();
    this._bump();
  }

  loadFromStorage() {
    const stored = localStorageProvider.load();
    if (!stored) return false;
    this._persistEnabled = false;
    this.init(stored);
    this._persistEnabled = true;
    return true;
  }

  exportState() {
    const state = {};
    LIST_KEYS.forEach((key) => {
      state[key] = this.getList(key);
    });
    OBJECT_KEYS.forEach((key) => {
      state[key] = this.getObject(key);
    });
    return state;
  }

  clearInventory() {
    this.setList("ventures", []);
    this.setList("layouts", []);
    this.setList("plots", []);
    this.setList("bookings", []);
    const reservations = this.getObject("reservations");
    if (reservations && typeof reservations === "object") {
      this.setObject("reservations", {
        ...reservations,
        reservations: [],
      });
    }
  }

  get initialized() {
    return this._initialized;
  }

  getList(key) {
    return this._lists[key] || [];
  }

  setList(key, items) {
    this._lists[key] = items;
    this._persist();
    this._bump();
  }

  updateList(key, updater) {
    const next = updater([...this.getList(key)]);
    this.setList(key, next);
    return next;
  }

  getObject(key) {
    return this._objects[key];
  }

  setObject(key, value) {
    this._objects[key] = value;
    this._persist();
    this._bump();
  }

  updateObject(key, updater) {
    const current = this.getObject(key);
    const next = updater(structuredClone(current));
    this.setObject(key, next);
    return next;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  getSnapshot() {
    return snapshotVersion;
  }

  _persist() {
    if (!this._persistEnabled || !this._initialized) return;
    localStorageProvider.save(this.exportState());
  }

  _bump() {
    snapshotVersion += 1;
    this._listeners.forEach((l) => l());
  }
}

export const dataStore = new DataStore();
export { LIST_KEYS, OBJECT_KEYS };

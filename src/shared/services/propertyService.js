import { dataStore } from "../repositories/dataStore.js";
import { getPropertyDashboardStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";

const today = () => new Date().toISOString().split("T")[0];

export const propertyService = {
  getAll() {
    return dataStore.getList("properties");
  },

  getById(id) {
    return dataStore.getList("properties").find((p) => p.id === id) || null;
  },

  getStatistics() {
    return getPropertyDashboardStatistics();
  },

  createProperty(data) {
    const properties = dataStore.getList("properties");
    const id = nextId("PRP", properties, 5001);
    const record = {
      ...data,
      id,
      createdDate: data.createdDate || today(),
      status: data.status || "Available",
    };
    dataStore.updateList("properties", (list) => [record, ...list]);
    return record;
  },

  updateProperty(id, data) {
    const existing = dataStore.getList("properties").find((p) => p.id === id);
    if (!existing) return null;
    const record = { ...existing, ...data };
    dataStore.updateList("properties", (list) =>
      list.map((p) => (p.id === id ? record : p))
    );
    return record;
  },

  deleteProperty(id) {
    dataStore.updateList("properties", (list) => list.filter((p) => p.id !== id));
    return { id };
  },
};

import { dataStore } from "../repositories/dataStore.js";
import { getCustomerDashboardStatistics } from "./statisticsService.js";
import { nextId } from "../utils/idGenerator.js";

const today = () => new Date().toISOString().split("T")[0];

export const customerService = {
  getAll() {
    return dataStore.getList("customers");
  },

  getById(id) {
    return dataStore.getList("customers").find((c) => c.id === id) || null;
  },

  getStatistics(customerId) {
    return getCustomerDashboardStatistics(customerId);
  },

  createCustomer(data) {
    const customers = dataStore.getList("customers");
    const id = nextId("CUST", customers, 6001);
    const record = {
      ...data,
      id,
      createdDate: data.createdDate || today(),
      status: data.status || "Active",
    };
    dataStore.updateList("customers", (list) => [record, ...list]);
    return record;
  },

  updateCustomer(id, data) {
    const existing = dataStore.getList("customers").find((c) => c.id === id);
    if (!existing) return null;
    const record = { ...existing, ...data };
    dataStore.updateList("customers", (list) =>
      list.map((c) => (c.id === id ? record : c))
    );
    return record;
  },

  deleteCustomer(id) {
    dataStore.updateList("customers", (list) => list.filter((c) => c.id !== id));
    return { id };
  },
};

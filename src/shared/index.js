/**
 * Shared enterprise frontend architecture layer.
 *
 * UI → hooks → services → repositories → mockApi → dataStore
 *
 * Replace mockApi/repository implementations with REST calls when Node.js backend is ready.
 */
export * from "./api/mockApi.js";
export * from "./repositories/dataStore.js";
export * from "./repositories/index.js";
export * from "./services/index.js";
export * from "./hooks/index.js";
export { localStorageProvider } from "./storage/localStorageProvider.js";
export { getSeedData } from "./storage/seedData.js";
export { DataProvider } from "./context/DataProvider.jsx";

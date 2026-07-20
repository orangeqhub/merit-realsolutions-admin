import { useSyncExternalStore } from "react";
import { dataStore } from "../repositories/dataStore.js";

export function useStoreVersion() {
  return useSyncExternalStore(
    (cb) => dataStore.subscribe(cb),
    () => dataStore.getSnapshot(),
    () => dataStore.getSnapshot()
  );
}

export function useCollection(key) {
  useStoreVersion();
  return dataStore.getList(key);
}

export function useStoreObject(key) {
  useStoreVersion();
  return dataStore.getObject(key);
}

export function useDataReady() {
  useStoreVersion();
  return dataStore.initialized;
}

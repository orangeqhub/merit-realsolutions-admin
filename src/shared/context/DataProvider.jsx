/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { dataStore } from "../repositories/dataStore.js";
import { localStorageProvider } from "../storage/localStorageProvider.js";
import { getSeedData } from "../storage/seedData.js";
import Loader from "../../components/feedback/Loader.jsx";
import EmptyState from "../../components/layout/EmptyState.jsx";

const MOCK_DATA_CLEARED_KEY = "mrs_erp_mock_companies_properties_cleared";
const INVENTORY_CLEARED_KEY = "mrs_erp_inventory_cleared_v1";

function clearSeededCompaniesAndProperties() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (window.localStorage.getItem(MOCK_DATA_CLEARED_KEY)) return;
  dataStore.setList("companies", []);
  dataStore.setList("properties", []);
  window.localStorage.setItem(MOCK_DATA_CLEARED_KEY, "1");
}

function clearInventoryData() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (window.localStorage.getItem(INVENTORY_CLEARED_KEY)) return;
  dataStore.setList("ventures", []);
  dataStore.setList("layouts", []);
  dataStore.setList("plots", []);
  window.localStorage.setItem(INVENTORY_CLEARED_KEY, "1");
}

function bootstrapDataStore() {
  if (dataStore.initialized) return;
  const loaded = dataStore.loadFromStorage();
  if (!loaded) {
    dataStore.init(getSeedData());
  } else {
    clearSeededCompaniesAndProperties();
    clearInventoryData();
  }
}

export function DataProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      bootstrapDataStore();
      return { ready: true, error: null };
    } catch (error) {
      return { ready: false, error: error?.message || "Failed to initialize data" };
    }
  });

  useEffect(() => {
    // Recover from Strict Mode / HMR races where the store is ready but React state is not.
    if (state.ready) return;
    try {
      bootstrapDataStore();
      setState({ ready: true, error: null });
    } catch (error) {
      setState({ ready: false, error: error?.message || "Failed to initialize data" });
    }
  }, [state.ready]);

  if (state.error) {
    return (
      <EmptyState
        title="Unable to load application data"
        description={state.error}
        action={
          <button
            type="button"
            className="erp-btn erp-btn--accent"
            onClick={() => {
              localStorageProvider.clear();
              window.location.reload();
            }}
          >
            Reset data &amp; reload
          </button>
        }
      />
    );
  }

  if (!state.ready) {
    return <Loader label="Loading ERP data…" />;
  }

  return children;
}

export { dataStore, bootstrapDataStore };

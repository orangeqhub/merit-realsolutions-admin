/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { dataStore } from "../repositories/dataStore.js";
import { localStorageProvider } from "../storage/localStorageProvider.js";
import { getSeedData } from "../storage/seedData.js";
import Loader from "../../components/feedback/Loader.jsx";
import EmptyState from "../../components/layout/EmptyState.jsx";

const MOCK_DATA_CLEARED_KEY = "mrs_erp_mock_companies_properties_cleared";
/** Bump version to force another one-time wipe (fresh venture/layout/plot testing). */
const INVENTORY_CLEARED_KEY = "mrs_erp_inventory_cleared_v2";
/** Keep only the user's latest venture; wipe remaining seed/demo site data. */
const KEEP_LATEST_VENTURE_KEY = "mrs_erp_keep_latest_venture_v1";

function clearSeededCompaniesAndProperties() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (window.localStorage.getItem(MOCK_DATA_CLEARED_KEY)) return;
  dataStore.setList("companies", []);
  dataStore.setList("properties", []);
  window.localStorage.setItem(MOCK_DATA_CLEARED_KEY, "1");
}

/**
 * Wipe venture / layout / plot inventory (+ linked bookings & reservations)
 * so modules can be tested from an empty create-flow.
 * Runs once per INVENTORY_CLEARED_KEY version.
 */
function clearInventoryData() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (window.localStorage.getItem(INVENTORY_CLEARED_KEY)) return;

  dataStore.setList("ventures", []);
  dataStore.setList("layouts", []);
  dataStore.setList("plots", []);
  dataStore.setList("bookings", []);

  const reservations = dataStore.getObject("reservations");
  if (reservations && typeof reservations === "object") {
    dataStore.setObject("reservations", {
      ...reservations,
      reservations: [],
    });
  }

  window.localStorage.setItem(INVENTORY_CLEARED_KEY, "1");
}

function ventureTimestamp(venture) {
  const raw =
    venture?.updatedAt ||
    venture?.createdAt ||
    venture?.createdDate ||
    venture?.updatedDate ||
    "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Keep only the most recently created venture (+ its layouts/plots).
 * Clear all other ERP lists / demo CRM data for a clean site.
 */
function keepLatestVentureOnly() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (window.localStorage.getItem(KEEP_LATEST_VENTURE_KEY)) return;

  const ventures = dataStore.getList("ventures");
  if (!ventures.length) {
    window.localStorage.setItem(KEEP_LATEST_VENTURE_KEY, "1");
    return;
  }

  const keptVenture = [...ventures].sort((a, b) => ventureTimestamp(b) - ventureTimestamp(a))[0];
  const keptLayouts = dataStore
    .getList("layouts")
    .filter((layout) => layout.ventureId === keptVenture.id);
  const keptLayoutIds = new Set(keptLayouts.map((layout) => layout.id));
  const keptPlots = dataStore
    .getList("plots")
    .filter((plot) => keptLayoutIds.has(plot.layoutId) || plot.ventureId === keptVenture.id);

  dataStore.setList("ventures", [keptVenture]);
  dataStore.setList("layouts", keptLayouts);
  dataStore.setList("plots", keptPlots);

  // Wipe remaining site/demo modules
  dataStore.setList("properties", []);
  dataStore.setList("customers", []);
  dataStore.setList("channelPartners", []);
  dataStore.setList("bookings", []);
  dataStore.setList("payments", []);
  dataStore.setList("companies", []);
  dataStore.setList("leads", []);
  dataStore.setList("followups", []);
  dataStore.setList("agreements", []);
  dataStore.setList("registrations", []);
  dataStore.setList("receipts", []);

  const reservations = dataStore.getObject("reservations");
  if (reservations && typeof reservations === "object") {
    dataStore.setObject("reservations", {
      ...reservations,
      reservations: [],
    });
  }

  const partnerAssignments = dataStore.getObject("partnerAssignments");
  if (partnerAssignments && typeof partnerAssignments === "object") {
    dataStore.setObject("partnerAssignments", {
      ...partnerAssignments,
      assignments: [],
      propertyAssignments: [],
      ventureAssignments: [],
      customerAssignments: [],
      areaAssignments: [],
    });
  }

  window.localStorage.setItem(KEEP_LATEST_VENTURE_KEY, "1");
}

function bootstrapDataStore() {
  if (dataStore.initialized) return;
  const loaded = dataStore.loadFromStorage();
  if (!loaded) {
    dataStore.init(getSeedData());
  } else {
    clearSeededCompaniesAndProperties();
  }
  // Always attempt (flag-gated) so both seed and stored paths start clean for inventory.
  clearInventoryData();
  keepLatestVentureOnly();
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
              window.localStorage.removeItem(MOCK_DATA_CLEARED_KEY);
              window.localStorage.removeItem(INVENTORY_CLEARED_KEY);
              window.localStorage.removeItem(KEEP_LATEST_VENTURE_KEY);
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

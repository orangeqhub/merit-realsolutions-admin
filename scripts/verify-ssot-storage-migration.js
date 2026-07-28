/**
 * SSOT Phase 3B — Storage migration verification.
 * Run: node scripts/verify-ssot-storage-migration.js
 */

import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import assert from "assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");

const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
};
globalThis.localStorage = globalThis.window.localStorage;

function ok(msg) {
  console.log("OK:", msg);
}

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

async function main() {
  const schemaUrl = pathToFileURL(path.join(src, "shared/storage/schemaVersion.js")).href;
  const providerUrl = pathToFileURL(path.join(src, "shared/storage/localStorageProvider.js")).href;
  const migrateUrl = pathToFileURL(
    path.join(src, "shared/storage/migrations/migrateToSchemaV2.js")
  ).href;
  const migrationsUrl = pathToFileURL(path.join(src, "shared/storage/migrations/index.js")).href;
  const layoutViewUrl = pathToFileURL(path.join(src, "shared/services/layoutView.js")).href;
  const plotViewUrl = pathToFileURL(path.join(src, "shared/services/plotView.js")).href;
  const dataStoreUrl = pathToFileURL(path.join(src, "shared/repositories/dataStore.js")).href;

  const { DATA_SCHEMA_VERSION, STORAGE_KEY, VERSION_KEY } = await import(schemaUrl);
  const { localStorageProvider } = await import(providerUrl);
  const { migrateToSchemaV2 } = await import(migrateUrl);
  const { runStorageMigrations } = await import(migrationsUrl);
  const { resolveLayoutView, LAYOUT_VENTURE_INHERITED_FIELDS } = await import(layoutViewUrl);
  const { resolvePlotView, PLOT_PARENT_INHERITED_FIELDS } = await import(plotViewUrl);
  const { dataStore } = await import(dataStoreUrl);

  assert.strictEqual(DATA_SCHEMA_VERSION, 2, "schema version must be 2");
  ok(`Schema version is ${DATA_SCHEMA_VERSION}`);

  const venture = {
    id: "VNT-MIG",
    name: "Migration Venture",
    city: "Hyderabad",
    state: "Telangana",
    district: "RR",
    currentPrice: 7000,
    basePrice: 6500,
    amenities: { roads: true },
    description: "Parent venture",
    developer: "Merit",
  };

  const legacyLayout = {
    id: "LYT-MIG",
    ventureId: "VNT-MIG",
    name: "Migration Layout",
    code: "ML-1",
    status: "Active",
    surveyNumber: "99",
    totalArea: 12,
    plotCount: 40,
    layoutNotes: "keep me",
    masterPlan: "plan.pdf",
    layoutPlan: "layout.pdf",
    generationSnapshot: { summary: { plots: 40 } },
    documents: [{ id: "d1", name: "Doc" }],
    activities: [{ type: "created" }],
    createdDate: "2024-01-01",
    lastUpdated: "2024-06-01",
    // duplicates to strip
    ventureName: "OLD NAME",
    city: "OLD CITY",
    state: "OLD STATE",
    district: "OLD DIST",
    village: "OLD VILLAGE",
    mapUrl: "https://legacy.example/map",
    approval: "Pending",
    approvalNumber: "X",
    approvalDate: "2020-01-01",
    basePrice: 1,
    currentPrice: 2,
    registrationCharges: 3,
    developmentCharges: 4,
    amenities: { clubHouse: true },
    banner: "b",
    thumbnail: "t",
    brochure: "br",
    gallery: ["g"],
    description: "layout copy",
    developer: "old dev",
    developerId: "old",
    pricePerSqYard: 9,
  };

  const legacyPlot = {
    id: "PLT-MIG",
    layoutId: "LYT-MIG",
    ventureId: "VNT-MIG",
    plotNumber: "A-1",
    areaSqYards: 200,
    ratePerSqYard: 5000,
    facing: "East",
    status: "Reserved",
    customer: "Alice",
    reservationExpiry: "2026-08-01",
    notes: "keep plot notes",
    documents: [{ id: "pd1" }],
    history: [{ type: "created" }],
    metadata: { source: "excel" },
    latitude: 17.1,
    longitude: 78.2,
    polygonPoints: [
      { lat: 17.1, lng: 78.2 },
      { lat: 17.11, lng: 78.2 },
      { lat: 17.11, lng: 78.21 },
      { lat: 17.1, lng: 78.21 },
    ],
    // duplicates to strip
    ventureName: "OLD V",
    layoutName: "OLD L",
    city: "OLD CITY",
    state: "OLD STATE",
    district: "OLD D",
    developer: "OLD DEV",
    description: "plot copy",
    amenities: { park: true },
    basePrice: 1,
    currentPrice: 2,
  };

  const reservations = {
    byId: {
      RSV_1: {
        id: "RSV_1",
        plotId: "PLT-MIG",
        ventureId: "VNT-MIG",
        layoutId: "LYT-MIG",
        ventureName: "KEEP ON RESERVATION",
        layoutName: "KEEP ON RESERVATION",
        status: "Reserved",
      },
    },
  };

  const v1Payload = {
    ventures: [venture],
    layouts: [legacyLayout],
    plots: [legacyPlot],
    properties: [],
    customers: [],
    channelPartners: [],
    bookings: [],
    payments: [],
    companies: [],
    leads: [],
    followups: [],
    agreements: [],
    registrations: [],
    receipts: [],
    reservations,
    partnerAssignments: null,
    engagement: null,
    reservationSettings: null,
    reservationRules: null,
  };

  // Seed as schema v1
  mem.clear();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Payload));
  window.localStorage.setItem(VERSION_KEY, "1");

  // --- Auto upgrade on load ---
  const loaded = localStorageProvider.load();
  assert.ok(loaded, "load must return migrated data");
  assert.strictEqual(window.localStorage.getItem(VERSION_KEY), "2", "version must be 2");
  ok("Old storage automatically upgrades; new version saved");

  const migratedLayout = loaded.layouts.find((l) => l.id === "LYT-MIG");
  const migratedPlot = loaded.plots.find((p) => p.id === "PLT-MIG");

  for (const field of LAYOUT_VENTURE_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(migratedLayout, field)) {
      fail(`Layout still has inherited field: ${field}`);
    }
  }
  ok("Layout duplicate fields removed");

  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(migratedPlot, field)) {
      fail(`Plot still has parent field: ${field}`);
    }
  }
  ok("Plot duplicate fields removed");

  // Preserved fields
  assert.strictEqual(migratedLayout.id, "LYT-MIG");
  assert.strictEqual(migratedLayout.ventureId, "VNT-MIG");
  assert.strictEqual(migratedLayout.name, "Migration Layout");
  assert.strictEqual(migratedLayout.surveyNumber, "99");
  assert.strictEqual(migratedLayout.layoutNotes, "keep me");
  assert.ok(migratedLayout.generationSnapshot);
  assert.ok(Array.isArray(migratedLayout.documents));
  assert.strictEqual(migratedPlot.id, "PLT-MIG");
  assert.strictEqual(migratedPlot.layoutId, "LYT-MIG");
  assert.strictEqual(migratedPlot.ventureId, "VNT-MIG");
  assert.strictEqual(migratedPlot.ratePerSqYard, 5000);
  assert.strictEqual(migratedPlot.status, "Reserved");
  assert.strictEqual(migratedPlot.customer, "Alice");
  assert.strictEqual(migratedPlot.notes, "keep plot notes");
  assert.strictEqual(migratedPlot.latitude, 17.1);
  assert.ok(migratedPlot.polygonPoints?.length === 4);
  ok("Layout/Plot owned fields and IDs preserved");

  // Reservations untouched
  assert.strictEqual(loaded.reservations.byId.RSV_1.ventureName, "KEEP ON RESERVATION");
  assert.strictEqual(loaded.reservations.byId.RSV_1.layoutName, "KEEP ON RESERVATION");
  ok("Reservation unchanged");

  // Resolve still works (Venture rename path)
  const layoutView = resolveLayoutView(migratedLayout, venture);
  assert.strictEqual(layoutView.ventureName, "Migration Venture");
  assert.strictEqual(layoutView.city, "Hyderabad");
  assert.strictEqual(layoutView.currentPrice, 7000);

  const renamedVenture = { ...venture, name: "Renamed After Migration" };
  assert.strictEqual(
    resolveLayoutView(migratedLayout, renamedVenture).ventureName,
    "Renamed After Migration"
  );

  const plotView = resolvePlotView(migratedPlot, migratedLayout, renamedVenture);
  assert.strictEqual(plotView.ventureName, "Renamed After Migration");
  assert.strictEqual(plotView.layoutName, "Migration Layout");
  assert.strictEqual(plotView.city, "Hyderabad");

  const renamedLayout = { ...migratedLayout, name: "Layout Renamed" };
  assert.strictEqual(
    resolvePlotView(migratedPlot, renamedLayout, renamedVenture).layoutName,
    "Layout Renamed"
  );
  ok("Venture/Layout rename still reflects via resolve helpers");

  // Idempotency — migrate twice
  const once = migrateToSchemaV2(loaded);
  const twice = migrateToSchemaV2(once.data);
  assert.deepStrictEqual(twice.data.layouts, once.data.layouts);
  assert.deepStrictEqual(twice.data.plots, once.data.plots);
  assert.strictEqual(twice.layoutsMigrated, 0);
  assert.strictEqual(twice.plotsMigrated, 0);

  const again = runStorageMigrations(loaded, 2);
  assert.strictEqual(again.migrated, false);
  assert.strictEqual(again.version, 2);
  ok("Migration is idempotent");

  // dataStore load path
  dataStore._initialized = false;
  dataStore._lists = {};
  dataStore._objects = {};
  const okLoad = dataStore.loadFromStorage();
  assert.strictEqual(okLoad, true);
  const storeLayout = dataStore.getList("layouts").find((l) => l.id === "LYT-MIG");
  const storePlot = dataStore.getList("plots").find((p) => p.id === "PLT-MIG");
  assert.ok(storeLayout && !storeLayout.ventureName && !storeLayout.city);
  assert.ok(storePlot && !storePlot.ventureName && !storePlot.layoutName);
  assert.strictEqual(storePlot.status, "Reserved");
  ok("dataStore loads migrated storage; Layout/Plot open with owned fields");

  // Fresh save writes v2
  assert.strictEqual(localStorageProvider.schemaVersion, 2);
  ok("Provider schemaVersion is 2");

  console.log("");
  console.log("SSOT_STORAGE_MIGRATION_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

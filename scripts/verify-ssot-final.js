/**
 * SSOT Phase 4 — Final architecture verification.
 * Run: node scripts/verify-ssot-final.js
 */

import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import assert from "assert";
import fs from "fs";

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
  const layoutViewUrl = pathToFileURL(path.join(src, "shared/services/layoutView.js")).href;
  const plotViewUrl = pathToFileURL(path.join(src, "shared/services/plotView.js")).href;
  const layoutServiceUrl = pathToFileURL(path.join(src, "shared/services/layoutService.js")).href;
  const plotServiceUrl = pathToFileURL(path.join(src, "shared/services/plotService.js")).href;
  const dataStoreUrl = pathToFileURL(path.join(src, "shared/repositories/dataStore.js")).href;
  const genUrl = pathToFileURL(
    path.join(src, "services/layoutGeneration/LayoutGenerationService.js")
  ).href;
  const saveUrl = pathToFileURL(path.join(src, "services/layoutSave/PlotSaveService.js")).href;
  const creationUrl = pathToFileURL(
    path.join(src, "shared/services/plotCreation/PlotCreationService.js")
  ).href;
  const providerUrl = pathToFileURL(path.join(src, "shared/storage/localStorageProvider.js")).href;

  const {
    resolveLayoutView,
    resolveLayoutPricingDefaults,
    LAYOUT_VENTURE_INHERITED_FIELDS,
    pickLayoutOwnedFields,
  } = await import(layoutViewUrl);
  const {
    resolvePlotView,
    PLOT_PARENT_INHERITED_FIELDS,
    omitPlotParentFields,
  } = await import(plotViewUrl);
  const { layoutService } = await import(layoutServiceUrl);
  const { plotService } = await import(plotServiceUrl);
  const { dataStore } = await import(dataStoreUrl);
  const { LayoutGenerationService } = await import(genUrl);
  const { buildLayoutSavePayload } = await import(saveUrl);
  const { PlotCreationService } = await import(creationUrl);
  const { localStorageProvider } = await import(providerUrl);

  dataStore.init({
    ventures: [],
    layouts: [],
    plots: [],
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
    reservations: {
      byId: {
        RSV_KEEP: { id: "RSV_KEEP", ventureName: "SNAPSHOT", status: "Reserved" },
      },
    },
  });

  dataStore.setList("ventures", [
    {
      id: "VNT-F",
      name: "Final Venture",
      city: "Hyderabad",
      state: "Telangana",
      district: "Medchal",
      currentPrice: 8000,
      basePrice: 7500,
      amenities: { roads: true, park: true },
      description: "SSOT parent",
      developer: "Merit",
      approval: "DTCP Approved",
    },
  ]);

  const layout = layoutService.createLayout({
    ventureId: "VNT-F",
    name: "Final Layout",
    code: "FL-1",
    status: "Active",
    surveyNumber: "10",
    totalArea: 8,
    plotCount: 0,
    // smuggle — must not persist
    ventureName: "NO",
    city: "NO",
    currentPrice: 1,
    amenities: { clubHouse: true },
  });

  for (const field of LAYOUT_VENTURE_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(layout, field)) {
      fail(`Layout persisted Venture field: ${field}`);
    }
  }
  ok("Layout works — create persists only Layout-owned fields");

  const layoutView = resolveLayoutView(layout, dataStore.getList("ventures")[0]);
  assert.strictEqual(layoutView.ventureName, "Final Venture");
  assert.strictEqual(layoutView.city, "Hyderabad");
  assert.strictEqual(layoutView.currentPrice, 8000);
  assert.ok(layoutView.amenities?.park);
  ok("Layout resolve reads Venture parent only");

  // Dirty layout record must not leak stored duplicates into the view
  const dirtyLayout = {
    ...layout,
    ventureName: "STALE",
    city: "STALE",
    currentPrice: 99,
  };
  const cleanView = resolveLayoutView(dirtyLayout, dataStore.getList("ventures")[0]);
  assert.strictEqual(cleanView.ventureName, "Final Venture");
  assert.strictEqual(cleanView.city, "Hyderabad");
  assert.strictEqual(cleanView.currentPrice, 8000);
  ok("No legacy Layout fallback — stale copies ignored");

  const plot = plotService.createPlot({
    layoutId: layout.id,
    plotNumber: "Z-1",
    areaSqYards: 150,
    ratePerSqYard: 8000,
    facing: "East",
    status: "Available",
    ventureName: "NO",
    layoutName: "NO",
    city: "NO",
  });
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(plot, field)) {
      fail(`Plot persisted parent field: ${field}`);
    }
  }
  ok("Plot works — create persists only Plot-owned fields");

  const plotView = resolvePlotView(plot, layout, dataStore.getList("ventures")[0]);
  assert.strictEqual(plotView.layoutName, "Final Layout");
  assert.strictEqual(plotView.ventureName, "Final Venture");
  assert.strictEqual(plotView.city, "Hyderabad");
  assert.strictEqual(plotView.ratePerSqYard, 8000);
  ok("Plot resolve reads Layout/Venture parents only");

  // Venture rename
  dataStore.updateList("ventures", (list) =>
    list.map((v) => (v.id === "VNT-F" ? { ...v, name: "Renamed Venture" } : v))
  );
  const ventureRenamed = dataStore.getList("ventures")[0];
  assert.strictEqual(resolveLayoutView(layout, ventureRenamed).ventureName, "Renamed Venture");
  assert.strictEqual(
    resolvePlotView(plot, layout, ventureRenamed).ventureName,
    "Renamed Venture"
  );
  ok("Venture rename updates Layout and Plot views");

  // Layout rename
  layoutService.updateLayout(layout.id, { name: "Renamed Layout" });
  const layoutRenamed = layoutService.getById(layout.id);
  assert.strictEqual(layoutRenamed.name, "Renamed Layout");
  assert.strictEqual(
    resolvePlotView(plot, layoutRenamed, ventureRenamed).layoutName,
    "Renamed Layout"
  );
  ok("Layout rename updates Plot view");

  // Generation pricing from Venture
  const pricing = resolveLayoutPricingDefaults(layoutRenamed, ventureRenamed);
  assert.strictEqual(pricing.defaultRatePerSqYard, 8000);
  const genRows = LayoutGenerationService.buildPlotRecordsForSave(
    [
      {
        plotNumber: "G-1",
        areaSqYards: 100,
        latitude: 17.4,
        longitude: 78.5,
        polygonPoints: [
          { lat: 17.4, lng: 78.5 },
          { lat: 17.41, lng: 78.5 },
          { lat: 17.41, lng: 78.51 },
          { lat: 17.4, lng: 78.51 },
        ],
      },
    ],
    { plotWidthFeet: 40, plotHeightFeet: 60, defaultRatePerSqYard: "" },
    layoutRenamed,
    ventureRenamed
  );
  assert.strictEqual(genRows[0].ratePerSqYard, 8000);
  ok("Generation works with Venture pricing");

  // Save payload
  const payload = buildLayoutSavePayload({
    layout: layoutRenamed,
    venture: ventureRenamed,
    preview: { plots: genRows, roads: [], amenities: [], blockLabels: [] },
    generationForm: { plotWidthFeet: 40, plotHeightFeet: 60, defaultRatePerSqYard: "8000" },
  });
  assert.strictEqual(payload.ventureName, "Renamed Venture");
  assert.strictEqual(payload.layoutName, "Renamed Layout");
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload.plots[0], field)) {
      fail(`Save plot row has parent field ${field}`);
    }
  }
  ok("Save works — transport metadata only; plot rows clean");

  // Import local
  const imported = PlotCreationService.createPlotsLocally({
    layoutId: layout.id,
    plots: [
      {
        plotNumber: "IMP-1",
        areaSqYards: 90,
        ratePerSqYard: 7000,
        facing: "West",
        status: "Available",
        city: "NO",
        ventureName: "NO",
      },
    ],
  });
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(imported.plots[0], field)) {
      fail(`Import persisted ${field}`);
    }
  }
  ok("Import works — no duplicated parent fields");

  // Reservation untouched
  assert.strictEqual(dataStore.getObject("reservations").byId.RSV_KEEP.ventureName, "SNAPSHOT");
  ok("Reservation unchanged");

  // Static: no @deprecated in resolve modules
  const layoutViewSrc = fs.readFileSync(path.join(src, "shared/services/layoutView.js"), "utf8");
  const plotViewSrc = fs.readFileSync(path.join(src, "shared/services/plotView.js"), "utf8");
  assert.ok(!layoutViewSrc.includes("@deprecated"));
  assert.ok(!plotViewSrc.includes("@deprecated"));
  assert.ok(!layoutViewSrc.includes("prefer(venture"));
  assert.ok(!plotViewSrc.includes("plot.ventureName"));
  assert.ok(!plotViewSrc.includes("plot.layoutName"));
  ok("No deprecated / legacy fallback code in resolve helpers");

  // Ban lists retained for write path
  assert.ok(LAYOUT_VENTURE_INHERITED_FIELDS.includes("ventureName"));
  assert.ok(PLOT_PARENT_INHERITED_FIELDS.includes("layoutName"));
  assert.ok(pickLayoutOwnedFields({ name: "x", city: "y" }).city === undefined);
  assert.ok(!Object.prototype.hasOwnProperty.call(omitPlotParentFields({ city: "y", plotNumber: "1" }), "city"));
  ok("Write-path SSOT ban lists retained");

  // Schema provider still at v2
  assert.strictEqual(localStorageProvider.schemaVersion, 2);
  ok("Schema history retained (v2)");

  console.log("");
  console.log("SSOT_FINAL_COMPLETE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

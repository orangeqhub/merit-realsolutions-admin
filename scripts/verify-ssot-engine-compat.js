/**
 * SSOT Phase 3A — Engine Compatibility verification.
 * Run: node scripts/verify-ssot-engine-compat.js
 */

import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import assert from "assert";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
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
  const genUrl = pathToFileURL(path.join(src, "services/layoutGeneration/LayoutGenerationService.js")).href;
  const saveUrl = pathToFileURL(path.join(src, "services/layoutSave/PlotSaveService.js")).href;
  const coordUrl = pathToFileURL(path.join(src, "features/plot-map/utils/coordinateUtils.js")).href;
  const dataStoreUrl = pathToFileURL(path.join(src, "shared/repositories/dataStore.js")).href;
  const plotServiceUrl = pathToFileURL(path.join(src, "shared/services/plotService.js")).href;
  const creationUrl = pathToFileURL(
    path.join(src, "shared/services/plotCreation/PlotCreationService.js")
  ).href;

  const { resolveLayoutPricingDefaults, resolveLayoutView } = await import(layoutViewUrl);
  const { PLOT_PARENT_INHERITED_FIELDS } = await import(plotViewUrl);
  const { LayoutGenerationService } = await import(genUrl);
  const { buildLayoutSavePayload, buildPlotSaveRows } = await import(saveUrl);
  const { resolveMapCenter, resolveMapCenterSource } = await import(coordUrl);
  const { dataStore } = await import(dataStoreUrl);
  const { plotService } = await import(plotServiceUrl);
  const { PlotCreationService } = await import(creationUrl);

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
  });

  const venture = {
    id: "VNT-ENG",
    name: "Engine Venture",
    city: "Hyderabad",
    state: "Telangana",
    currentPrice: 6200,
    basePrice: 5800,
    pricePerSqYard: 6200,
    mapUrl: "https://www.google.com/maps/@17.385044,78.486671,17z",
    latitude: 17.385044,
    longitude: 78.486671,
  };

  // Slim SSOT layout — no pricing / geo duplicates
  const layout = {
    id: "LYT-ENG",
    ventureId: "VNT-ENG",
    name: "Engine Layout",
    code: "EL-1",
    status: "Active",
    totalArea: 10,
    plotCount: 0,
  };

  dataStore.setList("ventures", [venture]);
  dataStore.setList("layouts", [layout]);

  // --- 1. Venture pricing in generation defaults ---
  const pricing = resolveLayoutPricingDefaults(layout, venture);
  assert.strictEqual(pricing.defaultRatePerSqYard, 6200);
  assert.strictEqual(pricing.currentPrice, 6200);
  assert.ok(pricing.basePrice === 5800);
  ok("Venture pricing appears in resolveLayoutPricingDefaults");

  const legacyPricing = resolveLayoutPricingDefaults(
    { ...layout, currentPrice: 1000, basePrice: 900 },
    null
  );
  assert.strictEqual(legacyPricing.defaultRatePerSqYard, 0);
  ok("Layout-stored pricing is ignored without Venture (SSOT final)");

  const emptyPricing = resolveLayoutPricingDefaults({ id: "x" }, null);
  assert.strictEqual(emptyPricing.defaultRatePerSqYard, 0);
  ok("Default pricing is 0 when neither Venture nor Layout has rates");

  // --- 2. Generated plot records inherit Venture pricing ---
  const previewPlots = [
    {
      plotNumber: "A-1",
      areaSqYards: 200,
      latitude: 17.38,
      longitude: 78.48,
      polygonPoints: [
        { lat: 17.38, lng: 78.48 },
        { lat: 17.381, lng: 78.48 },
        { lat: 17.381, lng: 78.481 },
        { lat: 17.38, lng: 78.481 },
      ],
      facing: "East",
    },
  ];
  const rows = LayoutGenerationService.buildPlotRecordsForSave(
    previewPlots,
    { plotWidthFeet: 40, plotHeightFeet: 60, internalRoadWidth: 30, defaultRatePerSqYard: "" },
    layout,
    venture
  );
  assert.strictEqual(rows[0].ratePerSqYard, 6200);
  assert.strictEqual(rows[0].totalPrice, 6200 * 200);
  assert.ok(!Object.prototype.hasOwnProperty.call(rows[0], "ventureName"));
  assert.ok(!Object.prototype.hasOwnProperty.call(rows[0], "layoutName"));
  assert.ok(!Object.prototype.hasOwnProperty.call(rows[0], "city"));
  ok("Generated plots receive Venture pricing without parent name fields");

  // --- 3. Save payload: transport metadata + clean plot rows ---
  const payload = buildLayoutSavePayload({
    layout,
    venture,
    preview: { plots: previewPlots, roads: [], amenities: [], blockLabels: [] },
    generationForm: { plotWidthFeet: 40, plotHeightFeet: 60, defaultRatePerSqYard: "6200" },
  });
  assert.strictEqual(payload.layoutName, "Engine Layout");
  assert.strictEqual(payload.ventureName, "Engine Venture");
  assert.strictEqual(payload.layoutId, "LYT-ENG");
  assert.strictEqual(payload.ventureId, "VNT-ENG");
  const saveRows = payload.plots;
  assert.ok(Array.isArray(saveRows) && saveRows.length === 1);
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(saveRows[0], field)) {
      fail(`Save plot row must not include parent field: ${field}`);
    }
  }
  assert.strictEqual(saveRows[0].ratePerSqYard, 6200);
  ok("Save payload keeps transport metadata; plot rows are Plot-owned only");

  // --- 4. Local import / create strips parent duplicates ---
  const created = PlotCreationService.createPlotsLocally({
    layoutId: "LYT-ENG",
    source: PlotCreationService.SOURCES.EXCEL,
    plots: [
      {
        plotNumber: "IMP-9",
        areaSqYards: 120,
        ratePerSqYard: 5000,
        facing: "North",
        status: "Available",
        ventureName: "NOPE",
        layoutName: "NOPE",
        city: "NOPE",
        state: "NOPE",
        amenities: { roads: true },
      },
    ],
  });
  const imported = created.plots[0];
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(imported, field)) {
      fail(`Imported local plot must not persist: ${field}`);
    }
  }
  assert.strictEqual(imported.layoutId, "LYT-ENG");
  assert.strictEqual(imported.ventureId, "VNT-ENG");
  assert.strictEqual(imported.ratePerSqYard, 5000);
  ok("Imported/local plots have no duplicated parent fields");

  // --- 5. Geo fallback: layout missing → venture ---
  const center = resolveMapCenter(venture, layout);
  assert.ok(center.lat && center.lng);
  const source = resolveMapCenterSource(venture, layout);
  assert.ok(
    source === "venture-map-url" || source === "venture-coordinates",
    `expected venture geo source, got ${source}`
  );
  ok("Map centers via Venture geo when Layout has no geo");

  const layoutWithGeo = {
    ...layout,
    latitude: 16.5,
    longitude: 80.6,
  };
  const layoutCenter = resolveMapCenter(venture, layoutWithGeo);
  assert.strictEqual(layoutCenter.lat, 16.5);
  assert.strictEqual(layoutCenter.lng, 80.6);
  assert.strictEqual(resolveMapCenterSource(venture, layoutWithGeo), "layout-coordinates");
  ok("Layout-specific geo still preferred over Venture");

  const fallback = resolveMapCenter(null, {});
  assert.ok(fallback.lat && fallback.lng);
  assert.strictEqual(resolveMapCenterSource(null, {}), "default-fallback");
  ok("Default geo fallback works");

  // --- 6. resolveLayoutView still prefers Venture for display ---
  const view = resolveLayoutView(layout, venture);
  assert.strictEqual(view.currentPrice, 6200);
  assert.strictEqual(view.ventureName, "Engine Venture");
  ok("resolveLayoutView remains compatible");

  // --- 7. Static source checks ---
  const mapSrc = fs.readFileSync(path.join(src, "features/plot-map/MapWorkspace.jsx"), "utf8");
  assert.ok(mapSrc.includes("resolveLayoutPricingDefaults"));
  assert.ok(!mapSrc.includes("Number(layout?.currentPrice) || Number(layout?.basePrice)"));

  const genSrc = fs.readFileSync(
    path.join(src, "services/layoutGeneration/LayoutGenerationService.js"),
    "utf8"
  );
  assert.ok(genSrc.includes("resolveLayoutPricingDefaults"));
  assert.ok(!genSrc.includes("Number(layout?.currentPrice)"));

  const saveSrc = fs.readFileSync(path.join(src, "services/layoutSave/PlotSaveService.js"), "utf8");
  assert.ok(saveSrc.includes("TRANSPORT METADATA"));
  assert.ok(saveSrc.includes("venture"));

  const importSrc = fs.readFileSync(
    path.join(src, "services/plotImport/PlotImportService.js"),
    "utf8"
  );
  assert.ok(importSrc.includes("TRANSPORT METADATA"));
  ok("Static engine source checks passed");

  // sanity: plotService still strips on persist
  const persisted = plotService.persistPlots({
    layoutId: "LYT-ENG",
    source: "generator",
    plots: [
      {
        plotNumber: "G-1",
        areaSqYards: 100,
        ratePerSqYard: 6200,
        facing: "East",
        ventureName: "X",
        city: "Y",
      },
    ],
  });
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(persisted.plots[0], field)) {
      fail(`persistPlots wrote parent field ${field}`);
    }
  }
  ok("Saved plots contain only Plot-owned fields");

  console.log("");
  console.log("SSOT_ENGINE_COMPATIBILITY_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

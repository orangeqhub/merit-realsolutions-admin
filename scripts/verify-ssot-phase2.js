/**
 * SSOT Phase 2 verification — Layout → Plot.
 * Run: node scripts/verify-ssot-phase2.js
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

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("OK:", msg);
}

async function main() {
  const plotViewUrl = pathToFileURL(path.join(src, "shared/services/plotView.js")).href;
  const plotServiceUrl = pathToFileURL(path.join(src, "shared/services/plotService.js")).href;
  const layoutServiceUrl = pathToFileURL(path.join(src, "shared/services/layoutService.js")).href;
  const dataStoreUrl = pathToFileURL(path.join(src, "shared/repositories/dataStore.js")).href;

  const {
    resolvePlotView,
    pickPlotOwnedFields,
    PLOT_PARENT_INHERITED_FIELDS,
    PLOT_OWNED_FIELDS,
  } = await import(plotViewUrl);
  const { plotService } = await import(plotServiceUrl);
  const { layoutService } = await import(layoutServiceUrl);
  const { dataStore } = await import(dataStoreUrl);

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
    id: "VNT-P2",
    name: "Horizon Estates",
    city: "Hyderabad",
    state: "Telangana",
    district: "Medchal",
    village: "Kompally",
    developer: "Merit Infra",
    description: "Flagship township",
    amenities: { roads: true, park: true },
    basePrice: 5000,
    currentPrice: 5500,
    registrationCharges: 100,
    developmentCharges: 200,
    approval: "DTCP Approved",
    status: "Active",
  };

  const layout = {
    id: "LYT-P2",
    ventureId: "VNT-P2",
    name: "Horizon Phase 1",
    code: "HZ-L1",
    status: "Active",
    totalArea: 20,
    plotCount: 50,
    surveyNumber: "55",
  };

  const legacyPlot = {
    id: "PLT-LEGACY",
    layoutId: "LYT-P2",
    ventureId: "VNT-P2",
    plotNumber: "A-1",
    ventureName: "OLD VENTURE",
    layoutName: "OLD LAYOUT",
    city: "OLD CITY",
    state: "OLD STATE",
    district: "OLD DIST",
    developer: "OLD DEV",
    description: "old desc",
    amenities: { clubHouse: true },
    areaSqYards: 200,
    ratePerSqYard: 4000,
    facing: "East",
    status: "Available",
    latitude: 17.5,
    longitude: 78.5,
    polygonPoints: [
      { lat: 17.5, lng: 78.5 },
      { lat: 17.501, lng: 78.5 },
      { lat: 17.501, lng: 78.501 },
      { lat: 17.5, lng: 78.501 },
    ],
  };

  dataStore.setList("ventures", [venture]);
  dataStore.setList("layouts", [layout]);
  dataStore.setList("plots", [legacyPlot]);

  // --- resolvePlotView prefer Layout/Venture, keep plot geometry ---
  const view = resolvePlotView(legacyPlot, layout, venture);
  assert.strictEqual(view.ventureName, "Horizon Estates");
  assert.strictEqual(view.layoutName, "Horizon Phase 1");
  assert.strictEqual(view.city, "Hyderabad");
  assert.strictEqual(view.state, "Telangana");
  assert.strictEqual(view.developer, "Merit Infra");
  assert.strictEqual(view.description, "Flagship township");
  assert.ok(view.amenities?.park);
  assert.strictEqual(view.latitude, 17.5, "plot geometry must not be overwritten");
  assert.strictEqual(view.longitude, 78.5);
  assert.strictEqual(view.plotNumber, "A-1");
  ok("resolvePlotView prefers Layout/Venture; keeps plot geometry");

  const orphan = resolvePlotView(legacyPlot, null, null);
  assert.strictEqual(orphan.ventureName, "");
  assert.strictEqual(orphan.layoutName, "");
  assert.strictEqual(orphan.city, "");
  assert.strictEqual(orphan.plotNumber, "A-1", "plot-owned fields preserved");
  assert.strictEqual(orphan.latitude, 17.5, "plot geometry preserved");
  ok("resolvePlotView uses Layout/Venture only (no legacy Plot fallback)");

  const picked = pickPlotOwnedFields({
    layoutId: "LYT-P2",
    ventureId: "VNT-P2",
    plotNumber: "B-2",
    city: "DROP",
    ventureName: "DROP",
    layoutName: "DROP",
    amenities: { roads: true },
    basePrice: 1,
    areaSqYards: 150,
    ratePerSqYard: 6000,
    facing: "North",
    status: "Available",
  });
  assert.strictEqual(picked.city, undefined);
  assert.strictEqual(picked.ventureName, undefined);
  assert.strictEqual(picked.layoutName, undefined);
  assert.strictEqual(picked.amenities, undefined);
  assert.strictEqual(picked.basePrice, undefined);
  assert.strictEqual(picked.areaSqYards, 150);
  assert.strictEqual(picked.ratePerSqYard, 6000);
  ok("pickPlotOwnedFields keeps only Plot-owned keys");

  // --- createPlot strips parent duplicates ---
  const created = plotService.createPlot({
    layoutId: "LYT-P2",
    plotNumber: "C-10",
    areaSqYards: 180,
    ratePerSqYard: 5200,
    facing: "West",
    status: "Available",
    dimensions: "30x60",
    block: "C",
    notes: "corner-ish",
    ventureName: "SHOULD_NOT_PERSIST",
    layoutName: "SHOULD_NOT_PERSIST",
    city: "SHOULD_NOT_PERSIST",
    state: "SHOULD_NOT_PERSIST",
    district: "SHOULD_NOT_PERSIST",
    developer: "SHOULD_NOT_PERSIST",
    description: "SHOULD_NOT_PERSIST",
    amenities: { water: true },
    basePrice: 1,
    currentPrice: 2,
  });

  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(created, field)) {
      fail(`New plot must not persist parent field: ${field}`);
    }
  }
  assert.strictEqual(created.layoutId, "LYT-P2");
  assert.strictEqual(created.ventureId, "VNT-P2");
  assert.strictEqual(created.plotNumber, "C-10");
  assert.strictEqual(created.areaSqYards, 180);
  assert.ok(created.ratePerSqYard);
  ok("createPlot persists only Plot-owned fields");

  const createdView = resolvePlotView(created, layout, venture);
  assert.strictEqual(createdView.ventureName, "Horizon Estates");
  assert.strictEqual(createdView.layoutName, "Horizon Phase 1");
  assert.strictEqual(createdView.city, "Hyderabad");
  ok("New plot read model inherits Layout/Venture fields");

  // --- Layout rename reflects without writing layoutName on plot ---
  layoutService.updateLayout("LYT-P2", { name: "Horizon Phase 1 Renamed" });
  const layoutRenamed = layoutService.getById("LYT-P2");
  const plotAfterLayoutRename = plotService.getById(created.id);
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(plotAfterLayoutRename, "layoutName"),
    false
  );
  assert.strictEqual(
    resolvePlotView(plotAfterLayoutRename, layoutRenamed, venture).layoutName,
    "Horizon Phase 1 Renamed"
  );
  ok("Layout rename reflects in Plot view automatically");

  // --- Venture rename reflects without writing ventureName on plot ---
  dataStore.updateList("ventures", (list) =>
    list.map((v) => (v.id === "VNT-P2" ? { ...v, name: "Horizon Estates Renamed" } : v))
  );
  const ventureRenamed = dataStore.getList("ventures").find((v) => v.id === "VNT-P2");
  const plotAfterVentureRename = plotService.getById(created.id);
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(plotAfterVentureRename, "ventureName"),
    false
  );
  assert.strictEqual(
    resolvePlotView(plotAfterVentureRename, layoutRenamed, ventureRenamed).ventureName,
    "Horizon Estates Renamed"
  );
  ok("Venture rename reflects in Plot view automatically");

  // --- Legacy plot still opens ---
  const legacyResolved = resolvePlotView(plotService.getById("PLT-LEGACY"), layoutRenamed, ventureRenamed);
  assert.strictEqual(legacyResolved.plotNumber, "A-1");
  assert.strictEqual(legacyResolved.ventureName, "Horizon Estates Renamed");
  assert.strictEqual(legacyResolved.layoutName, "Horizon Phase 1 Renamed");
  ok("Existing/legacy plots still resolve");

  // --- updatePlot ignores parent duplicates ---
  const updated = plotService.updatePlot(created.id, {
    notes: "updated note",
    city: "SHOULD_NOT_WRITE",
    ventureName: "SHOULD_NOT_WRITE",
    layoutName: "SHOULD_NOT_WRITE",
    amenities: { park: true },
    areaSqYards: 190,
  });
  assert.strictEqual(updated.notes, "updated note");
  assert.strictEqual(updated.areaSqYards, 190);
  assert.notStrictEqual(updated.city, "SHOULD_NOT_WRITE");
  assert.notStrictEqual(updated.ventureName, "SHOULD_NOT_WRITE");
  assert.notStrictEqual(updated.layoutName, "SHOULD_NOT_WRITE");
  ok("updatePlot ignores parent duplicate fields");

  // --- persistPlots (generator/import path via plotService) also strips parents ---
  const persisted = plotService.persistPlots({
    layoutId: "LYT-P2",
    source: "excel",
    plots: [
      {
        plotNumber: "IMP-1",
        areaSqYards: 100,
        ratePerSqYard: 3000,
        facing: "South",
        status: "Available",
        ventureName: "NO",
        layoutName: "NO",
        city: "NO",
      },
    ],
  });
  const imported = persisted.plots[0];
  for (const field of PLOT_PARENT_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(imported, field)) {
      fail(`persistPlots must not write parent field: ${field}`);
    }
  }
  ok("persistPlots strips parent fields");

  // --- Static checks ---
  const plotServiceSrc = fs.readFileSync(path.join(src, "shared/services/plotService.js"), "utf8");
  assert.ok(plotServiceSrc.includes("pickPlotOwnedFields"));
  assert.ok(plotServiceSrc.includes("omitPlotParentFields") || plotServiceSrc.includes("resolveParentRefs"));
  assert.ok(!plotServiceSrc.includes("layoutName: layout.name"));
  assert.ok(!plotServiceSrc.includes("ventureName: venture"));

  const ventureServiceSrc = fs.readFileSync(path.join(src, "shared/services/ventureService.js"), "utf8");
  assert.ok(!ventureServiceSrc.includes("p.ventureId === id ? { ...p, ventureName: record.name }"));

  const layoutServiceSrc = fs.readFileSync(path.join(src, "shared/services/layoutService.js"), "utf8");
  assert.ok(!layoutServiceSrc.includes("p.layoutId === id ? { ...p, layoutName: record.name }"));

  const usePlotsSrc = fs.readFileSync(path.join(src, "shared/hooks/usePlots.js"), "utf8");
  assert.ok(usePlotsSrc.includes("resolvePlotViews"));
  ok("Static source checks passed");

  assert.ok(PLOT_OWNED_FIELDS.includes("layoutId"));
  assert.ok(PLOT_PARENT_INHERITED_FIELDS.includes("ventureName"));
  ok(`Owned=${PLOT_OWNED_FIELDS.length} Inherited=${PLOT_PARENT_INHERITED_FIELDS.length}`);

  console.log("");
  console.log("SSOT_PHASE2_VERIFY_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

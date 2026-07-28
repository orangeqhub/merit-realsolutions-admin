/**
 * SSOT Phase 1 verification — Venture → Layout.
 * Run: node scripts/verify-ssot-phase1.js
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
  const layoutViewUrl = pathToFileURL(path.join(src, "shared/services/layoutView.js")).href;
  const layoutServiceUrl = pathToFileURL(path.join(src, "shared/services/layoutService.js")).href;
  const dataStoreUrl = pathToFileURL(path.join(src, "shared/repositories/dataStore.js")).href;

  const {
    resolveLayoutView,
    pickLayoutOwnedFields,
    LAYOUT_VENTURE_INHERITED_FIELDS,
    LAYOUT_OWNED_FIELDS,
  } = await import(layoutViewUrl);
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

  const legacyLayout = {
    id: "LYT-LEGACY",
    ventureId: "VNT-1",
    name: "Phase 1",
    code: "P1",
    ventureName: "OLD NAME",
    city: "OLD CITY",
    state: "OLD STATE",
    approval: "Pending",
    basePrice: 1000,
    amenities: { roads: true },
    banner: "layout-banner",
    description: "layout desc",
    status: "Active",
    totalArea: 10,
    plotCount: 20,
  };

  const venture = {
    id: "VNT-1",
    name: "Green Valley",
    city: "Hyderabad",
    state: "Telangana",
    district: "Ranga Reddy",
    village: "Narsingi",
    mapUrl: "https://maps.google.com/?q=17.3,78.4",
    approval: "DTCP Approved",
    approvalNumber: "DTCP/1",
    approvalDate: "2024-01-01",
    basePrice: 5000,
    currentPrice: 5500,
    registrationCharges: 100,
    developmentCharges: 200,
    amenities: { roads: true, park: true },
    banner: "venture-banner",
    thumbnail: "venture-thumb",
    brochure: "venture-brochure",
    gallery: ["g1"],
    description: "Venture project description",
    status: "Active",
  };

  const view = resolveLayoutView(legacyLayout, venture);
  assert.strictEqual(view.ventureName, "Green Valley");
  assert.strictEqual(view.city, "Hyderabad");
  assert.strictEqual(view.state, "Telangana");
  assert.strictEqual(view.approval, "DTCP Approved");
  assert.strictEqual(view.basePrice, 5000);
  assert.strictEqual(view.banner, "venture-banner");
  assert.strictEqual(view.description, "Venture project description");
  assert.strictEqual(view.name, "Phase 1");
  assert.strictEqual(view.totalArea, 10);
  ok("resolveLayoutView prefers Venture with layout fallback");

  const orphanView = resolveLayoutView(legacyLayout, null);
  assert.strictEqual(orphanView.ventureName, "");
  assert.strictEqual(orphanView.city, "");
  assert.strictEqual(orphanView.name, "Phase 1", "layout-owned name preserved");
  ok("resolveLayoutView uses Venture only (no legacy Layout fallback)");

  const picked = pickLayoutOwnedFields({
    ventureId: "VNT-1",
    name: "X",
    code: "C",
    city: "SHOULD_DROP",
    amenities: { roads: true },
    basePrice: 999,
    ventureName: "DROP",
    totalArea: 5,
    plotCount: 3,
    surveyNumber: "12",
    status: "Draft",
  });
  assert.strictEqual(picked.city, undefined);
  assert.strictEqual(picked.amenities, undefined);
  assert.strictEqual(picked.basePrice, undefined);
  assert.strictEqual(picked.ventureName, undefined);
  assert.strictEqual(picked.totalArea, 5);
  assert.strictEqual(picked.ventureId, "VNT-1");
  ok("pickLayoutOwnedFields keeps only Layout-owned keys");

  dataStore.setList("ventures", [
    {
      id: "VNT-SSOT",
      name: "SSOT Test Venture",
      code: "SSOT-V1",
      city: "Warangal",
      state: "Telangana",
      district: "Warangal",
      village: "Kazipet",
      approval: "RERA Approved",
      approvalNumber: "RERA/9",
      basePrice: 4000,
      currentPrice: 4200,
      registrationCharges: 50,
      developmentCharges: 75,
      amenities: { water: true, electricity: true },
      banner: "https://example.com/banner.jpg",
      thumbnail: "https://example.com/thumb.jpg",
      gallery: ["https://example.com/g.jpg"],
      description: "Parent venture description",
      status: "Active",
    },
  ]);

  const createdLayout = layoutService.createLayout({
    ventureId: "VNT-SSOT",
    name: "SSOT Phase Layout",
    code: "SSOT-L1",
    layoutType: "Open Plot",
    status: "Active",
    surveyNumber: "101",
    totalArea: 12.5,
    plotCount: 40,
    layoutNotes: "Layout only note",
    ventureName: "SHOULD_NOT_PERSIST",
    city: "SHOULD_NOT_PERSIST",
    state: "SHOULD_NOT_PERSIST",
    district: "SHOULD_NOT_PERSIST",
    village: "SHOULD_NOT_PERSIST",
    mapUrl: "https://evil.example/map",
    approval: "Pending",
    approvalNumber: "NOPE",
    approvalDate: "1999-01-01",
    basePrice: 1,
    currentPrice: 2,
    registrationCharges: 3,
    developmentCharges: 4,
    amenities: { clubHouse: true },
    banner: "no-banner",
    thumbnail: "no-thumb",
    brochure: "no-brochure",
    gallery: ["no-gallery"],
    description: "should not persist project description",
  });

  for (const field of LAYOUT_VENTURE_INHERITED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(createdLayout, field)) {
      fail(`New layout must not persist Venture field: ${field}`);
    }
  }
  assert.strictEqual(createdLayout.ventureId, "VNT-SSOT");
  assert.strictEqual(createdLayout.name, "SSOT Phase Layout");
  assert.strictEqual(createdLayout.code, "SSOT-L1");
  assert.strictEqual(createdLayout.layoutType, "Open Plot");
  assert.strictEqual(createdLayout.surveyNumber, "101");
  assert.strictEqual(createdLayout.layoutNotes, "Layout only note");
  ok("createLayout persists only Layout-owned fields");

  const parent = dataStore.getList("ventures").find((v) => v.id === "VNT-SSOT");
  const resolved = resolveLayoutView(createdLayout, parent);
  assert.strictEqual(resolved.ventureName, "SSOT Test Venture");
  assert.strictEqual(resolved.city, "Warangal");
  assert.strictEqual(resolved.approval, "RERA Approved");
  assert.strictEqual(resolved.currentPrice, 4200);
  assert.strictEqual(resolved.description, "Parent venture description");
  assert.ok(resolved.amenities?.water);
  ok("New layout read model inherits Venture fields");

  dataStore.updateList("ventures", (list) =>
    list.map((v) => (v.id === "VNT-SSOT" ? { ...v, name: "Renamed Venture SSOT" } : v))
  );
  const renamed = dataStore.getList("ventures").find((v) => v.id === "VNT-SSOT");
  const layoutAfterRename = layoutService.getById(createdLayout.id);
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(layoutAfterRename, "ventureName"),
    false
  );
  assert.strictEqual(resolveLayoutView(layoutAfterRename, renamed).ventureName, "Renamed Venture SSOT");
  ok("Venture rename reflects in Layout view automatically");

  dataStore.updateList("layouts", (list) => [legacyLayout, ...list]);
  dataStore.updateList("ventures", (list) => {
    if (list.some((v) => v.id === "VNT-1")) return list;
    return [venture, ...list];
  });
  const legacyResolved = resolveLayoutView(layoutService.getById("LYT-LEGACY"), venture);
  assert.strictEqual(legacyResolved.name, "Phase 1");
  assert.strictEqual(legacyResolved.ventureName, "Green Valley");
  ok("Existing/legacy layouts still resolve");

  const updated = layoutService.updateLayout(createdLayout.id, {
    name: "SSOT Phase Layout Updated",
    city: "SHOULD_NOT_WRITE",
    ventureName: "SHOULD_NOT_WRITE",
    amenities: { park: true },
    basePrice: 9999,
    totalArea: 15,
  });
  assert.strictEqual(updated.name, "SSOT Phase Layout Updated");
  assert.strictEqual(updated.totalArea, 15);
  assert.notStrictEqual(updated.city, "SHOULD_NOT_WRITE");
  assert.notStrictEqual(updated.ventureName, "SHOULD_NOT_WRITE");
  assert.notStrictEqual(updated.basePrice, 9999);
  for (const field of ["city", "ventureName", "amenities", "basePrice"]) {
    if (Object.prototype.hasOwnProperty.call(updated, field) && updated[field] === {
      city: "SHOULD_NOT_WRITE",
      ventureName: "SHOULD_NOT_WRITE",
      amenities: { park: true },
      basePrice: 9999,
    }[field]) {
      fail(`update wrote Venture field ${field}`);
    }
  }
  ok("updateLayout ignores Venture duplicate fields");

  const layoutServiceSrc = fs.readFileSync(path.join(src, "shared/services/layoutService.js"), "utf8");
  assert.ok(layoutServiceSrc.includes("pickLayoutOwnedFields"));
  assert.ok(!layoutServiceSrc.includes("ventureName: venture.name"));
  const ventureServiceSrc = fs.readFileSync(path.join(src, "shared/services/ventureService.js"), "utf8");
  assert.ok(
    !ventureServiceSrc.includes("l.ventureId === id ? { ...l, ventureName: record.name }")
  );
  const useLayoutsSrc = fs.readFileSync(path.join(src, "shared/hooks/useLayouts.js"), "utf8");
  assert.ok(useLayoutsSrc.includes("resolveLayoutViews"));
  ok("Static source checks passed");

  assert.ok(LAYOUT_OWNED_FIELDS.includes("ventureId"));
  assert.ok(LAYOUT_VENTURE_INHERITED_FIELDS.includes("amenities"));
  ok(`Owned=${LAYOUT_OWNED_FIELDS.length} Inherited=${LAYOUT_VENTURE_INHERITED_FIELDS.length}`);

  console.log("");
  console.log("SSOT_PHASE1_VERIFY_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

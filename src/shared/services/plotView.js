/**
 * Layout → Plot SSOT read model.
 * Plot-owned fields come from the Plot record.
 * Parent display fields are always read from Layout / Venture at read time.
 */

import { dataStore } from "../repositories/dataStore.js";
import { resolveLayoutView } from "./layoutView.js";

/**
 * Parent fields that must never be persisted on Plot records.
 * Used by write-path guards and schema migration (v1 → v2).
 */
export const PLOT_PARENT_INHERITED_FIELDS = Object.freeze([
  "ventureName",
  "layoutName",
  "state",
  "district",
  "city",
  "village",
  "mapUrl",
  "developer",
  "developerId",
  "description",
  "amenities",
  "banner",
  "thumbnail",
  "brochure",
  "gallery",
  "approval",
  "approvalNumber",
  "approvalDate",
  "basePrice",
  "currentPrice",
  "pricePerSqYard",
]);

/** Fields Plot may own / persist. */
export const PLOT_OWNED_FIELDS = Object.freeze([
  "id",
  "layoutId",
  "ventureId",
  "plotNumber",
  "block",
  "blockName",
  "dimensions",
  "areaSqYards",
  "facing",
  "corner",
  "cornerPlot",
  "roadWidth",
  "roadWidthFeet",
  "plcType",
  "polygonPoints",
  "coordinates",
  "geometry",
  "latitude",
  "longitude",
  "mapWidth",
  "mapHeight",
  "rotation",
  "shapeType",
  "status",
  "customer",
  "customerId",
  "agent",
  "executive",
  "crmOwner",
  "reservationExpiry",
  "ratePerSqYard",
  "priceOverride",
  "totalPrice",
  "finalPrice",
  "offerPrice",
  "discount",
  "discountPct",
  "developmentCharges",
  "registrationCharges",
  "registrationStatus",
  "notes",
  "documents",
  "history",
  "metadata",
  "source",
  "row",
  "col",
  "rowNumber",
  "columnNumber",
  "createdDate",
  "lastUpdated",
]);

function isPresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

function firstPresent(...values) {
  for (const value of values) {
    if (isPresent(value)) return value;
  }
  return "";
}

function stripParentFields(plot = {}) {
  const next = { ...plot };
  for (const key of PLOT_PARENT_INHERITED_FIELDS) {
    delete next[key];
  }
  return next;
}

export function getLayoutForPlot(plot, layouts) {
  if (!plot?.layoutId) return null;
  if (Array.isArray(layouts)) {
    return layouts.find((l) => l.id === plot.layoutId) || null;
  }
  return dataStore.getList("layouts").find((l) => l.id === plot.layoutId) || null;
}

export function getVentureForPlot(plot, ventures, layout) {
  const ventureId = plot?.ventureId || layout?.ventureId;
  if (!ventureId) return null;
  if (Array.isArray(ventures)) {
    return ventures.find((v) => v.id === ventureId) || null;
  }
  return dataStore.getList("ventures").find((v) => v.id === ventureId) || null;
}

/**
 * Plot read model: plot-owned data + Layout + Venture (read-time only).
 * Does not read denormalized parent copies from the Plot record.
 * Does not overwrite plot geometry with parent site coordinates.
 */
export function resolvePlotView(plot, layoutOrLists, ventureArg) {
  if (!plot) return null;

  let layout = null;
  let venture = null;

  if (layoutOrLists === null) {
    layout = null;
  } else if (layoutOrLists && !Array.isArray(layoutOrLists) && layoutOrLists.id) {
    layout = layoutOrLists;
  } else if (Array.isArray(layoutOrLists)) {
    layout = getLayoutForPlot(plot, layoutOrLists);
  } else {
    layout = getLayoutForPlot(plot);
  }

  if (ventureArg === null) {
    venture = null;
  } else if (ventureArg && !Array.isArray(ventureArg) && ventureArg.id) {
    venture = ventureArg;
  } else if (Array.isArray(ventureArg)) {
    venture = getVentureForPlot(plot, ventureArg, layout);
  } else if (ventureArg === undefined) {
    venture = getVentureForPlot(plot, undefined, layout);
  } else {
    venture = ventureArg;
  }

  const layoutView = layout ? resolveLayoutView(layout, venture) : null;
  const owned = stripParentFields(plot);

  return {
    ...owned,
    layoutId: plot.layoutId || layout?.id || null,
    ventureId: plot.ventureId || layout?.ventureId || venture?.id || null,
    layoutName: layout?.name || "",
    ventureName: venture?.name || layoutView?.ventureName || "",
    state: firstPresent(layoutView?.state, venture?.state),
    district: firstPresent(layoutView?.district, venture?.district),
    city: firstPresent(layoutView?.city, venture?.city),
    village: firstPresent(layoutView?.village, venture?.village),
    developer: firstPresent(layoutView?.developer, venture?.developer),
    developerId: layoutView?.developerId ?? venture?.developerId ?? null,
    description: firstPresent(layoutView?.description, venture?.description),
    amenities:
      (layoutView?.amenities && Object.keys(layoutView.amenities).length
        ? { ...layoutView.amenities }
        : null) ||
      (venture?.amenities && typeof venture.amenities === "object"
        ? { ...venture.amenities }
        : {}),
    parentBasePrice: layoutView?.basePrice ?? venture?.basePrice ?? "",
    parentCurrentPrice:
      layoutView?.currentPrice ?? venture?.currentPrice ?? venture?.pricePerSqYard ?? "",
    parentRegistrationCharges:
      layoutView?.registrationCharges ?? venture?.registrationCharges ?? "",
    parentDevelopmentCharges:
      layoutView?.developmentCharges ?? venture?.developmentCharges ?? "",
    approval: firstPresent(layoutView?.approval, venture?.approval),
  };
}

export function resolvePlotViews(plots = [], layouts, ventures) {
  const layoutList = Array.isArray(layouts) ? layouts : dataStore.getList("layouts");
  const ventureList = Array.isArray(ventures) ? ventures : dataStore.getList("ventures");
  return plots.map((plot) => resolvePlotView(plot, layoutList, ventureList));
}

/**
 * Build a persistence payload containing only Plot-owned fields.
 */
export function pickPlotOwnedFields(data = {}) {
  const out = {};
  for (const key of PLOT_OWNED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      out[key] = data[key];
    }
  }
  if (out.block != null && out.blockName == null) {
    out.blockName = out.block;
  }
  if (out.coordinates != null && out.polygonPoints == null) {
    out.polygonPoints = out.coordinates;
  }
  if (out.priceOverride != null && out.ratePerSqYard == null) {
    out.ratePerSqYard = out.priceOverride;
  }
  return out;
}

/** Remove parent inherited keys from a plain object (for create payloads). */
export function omitPlotParentFields(record = {}) {
  const out = { ...record };
  for (const key of PLOT_PARENT_INHERITED_FIELDS) {
    delete out[key];
  }
  return out;
}

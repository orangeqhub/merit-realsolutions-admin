/**
 * Venture → Layout SSOT read model.
 * Layout-owned fields come from the Layout record.
 * Venture-owned fields are always read from the live Venture parent.
 */

import { sanitizeStoredMediaUrl, getVentureBannerUrl, getVentureCardImageUrl } from "../../utils/media.js";
import { dataStore } from "../repositories/dataStore.js";

/**
 * Venture-owned fields that must never be persisted on Layout records.
 * Used by write-path guards and schema migration (v1 → v2).
 */
export const LAYOUT_VENTURE_INHERITED_FIELDS = Object.freeze([
  "ventureName",
  "state",
  "district",
  "city",
  "village",
  "mapUrl",
  "latitude",
  "longitude",
  "centerLat",
  "centerLng",
  "mapZoom",
  "approval",
  "approvalNumber",
  "approvalDate",
  "basePrice",
  "currentPrice",
  "registrationCharges",
  "developmentCharges",
  "amenities",
  "banner",
  "thumbnail",
  "brochure",
  "gallery",
  "description",
  "developer",
  "developerId",
  "pricePerSqYard",
]);

/** Fields Layout may own / persist. */
export const LAYOUT_OWNED_FIELDS = Object.freeze([
  "id",
  "ventureId",
  "name",
  "code",
  "layoutType",
  "status",
  "surveyNumber",
  "masterPlan",
  "layoutPlan",
  "generationSnapshot",
  "geometry",
  "roadNetwork",
  "plotCount",
  "totalArea",
  "layoutNotes",
  "notes",
  "documents",
  "activities",
  "createdDate",
  "lastUpdated",
  "progress",
  "hasGeneratedLayout",
]);

function stripVentureFields(layout = {}) {
  const next = { ...layout };
  for (const key of LAYOUT_VENTURE_INHERITED_FIELDS) {
    delete next[key];
  }
  return next;
}

export function getVentureForLayout(layout, ventures) {
  if (!layout?.ventureId) return null;
  if (Array.isArray(ventures)) {
    return ventures.find((v) => v.id === layout.ventureId) || null;
  }
  return dataStore.getList("ventures").find((v) => v.id === layout.ventureId) || null;
}

/**
 * Layout read model: layout-owned data + Venture parent fields (read-time only).
 * Does not read denormalized Venture copies from the Layout record.
 */
export function resolveLayoutView(layout, ventureOrList) {
  if (!layout) return null;

  const venture = Array.isArray(ventureOrList)
    ? getVentureForLayout(layout, ventureOrList)
    : ventureOrList !== undefined
      ? ventureOrList
      : getVentureForLayout(layout);

  const owned = stripVentureFields(layout);

  return {
    ...owned,
    layoutPlan: sanitizeStoredMediaUrl(owned.layoutPlan),
    masterPlan: sanitizeStoredMediaUrl(owned.masterPlan),
    ventureId: layout.ventureId,
    ventureName: venture?.name || "",
    state: venture?.state ?? "",
    district: venture?.district ?? "",
    city: venture?.city ?? "",
    village: venture?.village ?? "",
    mapUrl: venture?.mapUrl ?? "",
    latitude: venture?.latitude ?? null,
    longitude: venture?.longitude ?? null,
    centerLat: venture?.centerLat ?? venture?.latitude ?? null,
    centerLng: venture?.centerLng ?? venture?.longitude ?? null,
    mapZoom: venture?.mapZoom ?? null,
    approval: venture?.approval ?? "",
    approvalNumber: venture?.approvalNumber ?? "",
    approvalDate: venture?.approvalDate ?? "",
    basePrice: venture?.basePrice ?? "",
    currentPrice: venture?.currentPrice ?? venture?.pricePerSqYard ?? "",
    registrationCharges: venture?.registrationCharges ?? "",
    developmentCharges: venture?.developmentCharges ?? "",
    amenities:
      venture?.amenities && typeof venture.amenities === "object"
        ? { ...venture.amenities }
        : {},
    banner: getVentureBannerUrl(venture) || "",
    thumbnail: getVentureCardImageUrl(venture) || "",
    brochure: venture?.brochure ?? "",
    gallery: Array.isArray(venture?.gallery) ? [...venture.gallery] : [],
    description: venture?.description ?? "",
    developer: venture?.developer ?? "",
    developerId: venture?.developerId ?? null,
    layoutNotes: layout.layoutNotes ?? layout.notes ?? "",
  };
}

export function resolveLayoutViews(layouts = [], ventures) {
  const ventureList = Array.isArray(ventures) ? ventures : dataStore.getList("ventures");
  return layouts.map((layout) => resolveLayoutView(layout, ventureList));
}

/**
 * Engine-safe pricing defaults for generation / map forms.
 * Reads Venture via resolveLayoutView. Does not mutate stored Layout.
 */
export function resolveLayoutPricingDefaults(layout, venture) {
  const view = resolveLayoutView(layout || { id: layout?.id, ventureId: layout?.ventureId }, venture);
  const current = Number(view?.currentPrice ?? view?.pricePerSqYard);
  const base = Number(view?.basePrice);
  const currentOk = Number.isFinite(current) && current > 0;
  const baseOk = Number.isFinite(base) && base > 0;
  const defaultRatePerSqYard = currentOk ? current : baseOk ? base : 0;

  return {
    currentPrice: currentOk ? current : null,
    basePrice: baseOk ? base : null,
    pricePerSqYard: currentOk ? current : baseOk ? base : null,
    defaultRatePerSqYard,
  };
}

/**
 * Build a persistence payload containing only Layout-owned fields.
 */
export function pickLayoutOwnedFields(data = {}) {
  const out = {};
  for (const key of LAYOUT_OWNED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      out[key] = data[key];
    }
  }
  if (out.notes != null && out.layoutNotes == null) {
    out.layoutNotes = out.notes;
  }
  return out;
}

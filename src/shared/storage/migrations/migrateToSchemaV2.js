/**
 * Schema v2 — SSOT storage migration.
 * Strips duplicated parent fields from Layout and Plot records.
 * Idempotent: safe to run more than once.
 */

import { LAYOUT_VENTURE_INHERITED_FIELDS } from "../../services/layoutView.js";
import { PLOT_PARENT_INHERITED_FIELDS } from "../../services/plotView.js";

function stripFields(record, fields) {
  if (!record || typeof record !== "object") return { record, removed: 0 };
  let removed = 0;
  const next = { ...record };
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      delete next[key];
      removed += 1;
    }
  }
  return { record: next, removed };
}

/**
 * Migrate ERP snapshot to schema v2 (SSOT denormalization strip).
 *
 * @param {object} data - Full mrs_erp_data snapshot
 * @returns {{ data: object, layoutsMigrated: number, plotsMigrated: number, fieldsRemoved: number }}
 */
export function migrateToSchemaV2(data = {}) {
  const layouts = Array.isArray(data.layouts) ? data.layouts : [];
  const plots = Array.isArray(data.plots) ? data.plots : [];

  let layoutsMigrated = 0;
  let plotsMigrated = 0;
  let fieldsRemoved = 0;

  const nextLayouts = layouts.map((layout) => {
    const { record, removed } = stripFields(layout, LAYOUT_VENTURE_INHERITED_FIELDS);
    if (removed > 0) {
      layoutsMigrated += 1;
      fieldsRemoved += removed;
    }
    return record;
  });

  const nextPlots = plots.map((plot) => {
    const { record, removed } = stripFields(plot, PLOT_PARENT_INHERITED_FIELDS);
    if (removed > 0) {
      plotsMigrated += 1;
      fieldsRemoved += removed;
    }
    return record;
  });

  return {
    data: {
      ...data,
      layouts: nextLayouts,
      plots: nextPlots,
    },
    layoutsMigrated,
    plotsMigrated,
    fieldsRemoved,
  };
}

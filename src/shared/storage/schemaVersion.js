/**
 * Local ERP storage schema version.
 * Bump when a one-shot storage migration is required.
 *
 * v1 — original mrs_erp_data
 * v2 — SSOT: strip duplicated Venture fields from Layouts and
 *      duplicated Layout/Venture fields from Plots
 */
export const DATA_SCHEMA_VERSION = 2;

export const STORAGE_KEY = "mrs_erp_data";
export const VERSION_KEY = "mrs_erp_data_version";

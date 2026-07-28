/**
 * Run pending local storage migrations.
 * Logs a single concise sequence per upgrade (no spam).
 */

import { DATA_SCHEMA_VERSION } from "../schemaVersion.js";
import { migrateToSchemaV2 } from "./migrateToSchemaV2.js";

/**
 * @param {object} data
 * @param {number} fromVersion - stored schema version (0/1 = pre-SSOT)
 * @returns {{ data: object, version: number, migrated: boolean }}
 */
export function runStorageMigrations(data, fromVersion = 0) {
  let current = data && typeof data === "object" ? data : {};
  let version = Number(fromVersion) || 0;
  let migrated = false;

  // Treat missing/legacy version with existing payload as v1.
  if (version < 1) version = 1;

  if (version < 2) {
    console.info("[SSOT Migration] Migration started");
    const result = migrateToSchemaV2(current);
    current = result.data;
    console.info(`[SSOT Migration] Layouts migrated: ${result.layoutsMigrated}`);
    console.info(`[SSOT Migration] Plots migrated: ${result.plotsMigrated}`);
    version = 2;
    migrated = true;
    console.info("[SSOT Migration] Migration complete");
  }

  if (version > DATA_SCHEMA_VERSION) {
    // Newer client wrote this — do not mutate; caller may still load read-only.
    return { data: current, version, migrated: false };
  }

  return { data: current, version: DATA_SCHEMA_VERSION, migrated };
}

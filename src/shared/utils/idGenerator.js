/**
 * Generate collision-safe IDs from existing records.
 */
export function nextId(prefix, records, fallbackStart = 1) {
  const nums = (records || [])
    .map((r) => {
      const part = String(r?.id || "").split("-").pop();
      const n = Number(part);
      return Number.isFinite(n) ? n : 0;
    })
    .filter((n) => n > 0);

  const next = nums.length ? Math.max(...nums) + 1 : fallbackStart;
  return `${prefix}-${next}`;
}

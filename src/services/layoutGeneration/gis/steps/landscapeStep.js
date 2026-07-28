import { generateLandscapeBuffers } from '../../township/landscapeBuffers.js';

/**
 * STEP 10 — Landscape layer: trees, medians, walking paths, green strips.
 * Does NOT overlap roads or plots (placed in gaps between blocks).
 */
export function generateGisLandscape(parcels, roads, bbox, config) {
  const result = generateLandscapeBuffers(parcels, roads, config, bbox);
  return {
    buffers: result.buffers,
    landscapeAmenities: result.landscapeAmenities,
    landscapeFeatures: result.landscapeAmenities.map((a) => ({
      id: a.id,
      type: a.type,
      label: a.label,
      rect: a.rect,
      category: 'landscape',
    })),
  };
}

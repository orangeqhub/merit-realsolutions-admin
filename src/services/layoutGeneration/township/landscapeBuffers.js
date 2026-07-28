import { rectsOverlap } from './geometry.js';
import { polygonCentroid } from './polygonGeometry.js';

/**
 * Landscape buffers between blocks — green strips, medians, walking paths, drainage.
 */
export function generateLandscapeBuffers(parcels, roads, config, bbox = null) {
  const buffers = [];
  const features = [];
  let id = 0;

  const types = [
    { key: 'greenStrip', label: 'Green Strip', h: 18, type: 'openSpace' },
    { key: 'median', label: 'Median Planting', h: 14, type: 'openSpace' },
    { key: 'walkPath', label: 'Walking Path', h: 12, type: 'openSpace' },
    { key: 'drainage', label: 'Drainage Buffer', h: 10, type: 'utility' },
  ];

  for (let i = 0; i < parcels.length - 1; i += 1) {
    const a = parcels[i].baseRect;
    const b = parcels[i + 1].baseRect;
    const t = types[i % types.length];
    const gap = config.rng.int(14, 22);

    let rect;
    if (Math.abs(a.y - b.y) < 80) {
      const left = a.x + a.w < b.x ? a : b;
      const right = left === a ? b : a;
      rect = {
        x: left.x + left.w + 2,
        y: (left.y + right.y) / 2 - gap / 2,
        w: Math.max(8, right.x - (left.x + left.w) - 4),
        h: gap,
      };
    } else {
      const top = a.y + a.h < b.y ? a : b;
      const bottom = top === a ? b : a;
      rect = {
        x: (top.x + bottom.x) / 2 - gap / 2,
        y: top.y + top.h + 2,
        w: gap,
        h: Math.max(8, bottom.y - (top.y + top.h) - 4),
      };
    }

    if (rect.w < 6 || rect.h < 6) continue;

    const bufferId = `landscape-${id}`;
    id += 1;
    buffers.push({
      id: bufferId,
      rect,
      bufferType: t.key,
      label: t.label,
    });
    features.push({
      id: bufferId,
      rect,
      type: t.type,
      name: t.label,
      label: t.label,
      isLandscapeBuffer: true,
    });
  }

  roads.filter((r) => r.roadType === 'main').forEach((road, ri) => {
    if (!config.rng.bool(0.65)) return;
    const rect = {
      x: road.rect.x - 8,
      y: road.rect.y + road.rect.h * 0.2,
      w: road.rect.w + 16,
      h: 16,
    };
    const bufferId = `median-${ri}`;
    buffers.push({ id: bufferId, rect, bufferType: 'median', label: 'Road Median' });
    features.push({
      id: bufferId,
      rect,
      type: 'openSpace',
      name: 'Road Median',
      label: 'Road Median',
      isLandscapeBuffer: true,
    });
  });

  if (config.rng.bool(0.7) && bbox) {
    const plaza = {
      x: bbox.minX + (bbox.maxX - bbox.minX) * config.rng.float(0.3, 0.6),
      y: bbox.minY + (bbox.maxY - bbox.minY) * config.rng.float(0.35, 0.55),
      w: 45 + config.rng.int(0, 25),
      h: 45 + config.rng.int(0, 25),
    };
    features.push({
      id: 'plaza-0',
      rect: plaza,
      type: 'openSpace',
      name: 'Neighbourhood Plaza',
      label: 'Neighbourhood Plaza',
      isLandscapeBuffer: true,
    });
  }

  return { buffers, landscapeAmenities: features };
}

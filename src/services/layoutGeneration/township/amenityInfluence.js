import { bboxFromPolygon, pointInPolygon } from './geometry.js';
import { polygonCentroid, polygonBBox } from './polygonGeometry.js';

/**
 * Amenity influence zones — shape township BEFORE road subdivision.
 * Parks carve blocks; clubhouse reserves frontage; open space interrupts packing.
 */
export function planAmenityInfluence(boundary, entrance, config) {
  const bbox = bboxFromPolygon(boundary.points);
  const { rng } = config;
  const zones = [];
  const enabled = config.enabledAmenityKeys || [];

  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;

  if (enabled.includes('park')) {
    zones.push({
      id: 'influence-central-park',
      type: 'park',
      influence: 'carve',
      deformStrength: 1,
      rect: {
        x: cx - 110 + rng.int(-30, 30),
        y: cy - 60 + rng.int(-20, 20),
        w: 220 + rng.int(-20, 40),
        h: 160 + rng.int(-20, 30),
      },
      meta: { type: 'park', name: 'Central Park', label: 'Central Park' },
    });
    if (config.amenitiesLevel !== 'basic') {
      zones.push({
        id: 'influence-pocket-park',
        type: 'park',
        influence: 'carve',
        deformStrength: 0.7,
        rect: {
          x: bbox.minX + 80 + rng.int(0, 60),
          y: bbox.maxY - 200,
          w: 120,
          h: 90,
        },
        meta: { type: 'park', name: 'Children Park', label: 'Children Park' },
      });
    }
  }

  if (enabled.includes('clubHouse')) {
    zones.push({
      id: 'influence-clubhouse',
      type: 'clubHouse',
      influence: 'frontage',
      deformStrength: 0.85,
      rect: {
        x: cx + rng.int(40, 120),
        y: cy + rng.int(-40, 40),
        w: 130,
        h: 95,
      },
      frontageEdge: 'south',
      meta: { type: 'clubHouse', name: 'Club House', label: 'Club House' },
    });
  }

  if (enabled.includes('openSpace')) {
    zones.push({
      id: 'influence-open-corridor',
      type: 'openSpace',
      influence: 'interrupt',
      deformStrength: 0.6,
      rect: {
        x: bbox.minX + 50,
        y: bbox.minY + (bbox.maxY - bbox.minY) * 0.25,
        w: bbox.maxX - bbox.minX - 100,
        h: 35 + rng.int(0, 15),
      },
      meta: { type: 'openSpace', name: 'Green Corridor', label: 'Green Corridor' },
    });
  }

  if (enabled.includes('temple')) {
    zones.push({
      id: 'influence-temple',
      type: 'temple',
      influence: 'carve',
      rect: { x: bbox.minX + 70, y: bbox.maxY - 130, w: 75, h: 65 },
      meta: { type: 'temple', name: 'Temple', label: 'Temple' },
    });
  }

  if (enabled.includes('swimmingPool')) {
    zones.push({
      id: 'influence-pool',
      type: 'swimmingPool',
      influence: 'carve',
      rect: { x: cx - 50, y: cy + 80, w: 85, h: 55 },
      meta: { type: 'swimmingPool', name: 'Swimming Pool', label: 'Swimming Pool' },
    });
  }

  zones.push({
    id: 'influence-entrance-garden',
    type: 'openSpace',
    influence: 'frontage',
    rect: entrance.entranceGarden,
    meta: { type: 'openSpace', name: 'Entrance Garden', label: 'Entrance Garden' },
  });

  return { zones, exclusionRects: zones.map((z) => ({ ...z.rect, id: z.id })) };
}

/** Deform parcel base rect near park / amenity */
export function deformParcelRect(baseRect, influenceZones, rng, parcelIndex) {
  let rect = { ...baseRect };
  influenceZones.forEach((zone) => {
    if (zone.influence !== 'carve' && zone.influence !== 'interrupt') return;
    const zc = polygonCentroid([
      { x: zone.rect.x, y: zone.rect.y },
      { x: zone.rect.x + zone.rect.w, y: zone.rect.y + zone.rect.h },
    ]);
    const pc = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    const dist = Math.hypot(pc.x - zc.x, pc.y - zc.y);
    if (dist > 400) return;
    const pull = (1 - dist / 400) * (zone.deformStrength || 0.5) * 25;
    const dx = pc.x - zc.x;
    const dy = pc.y - zc.y;
    const len = Math.hypot(dx, dy) || 1;
    rect.x += (dx / len) * pull * rng.float(0.5, 1.2);
    rect.y += (dy / len) * pull * rng.float(0.5, 1.2);
    if (zone.influence === 'carve' && dist < 250) {
      rect.w *= rng.float(0.92, 0.98);
      rect.h *= rng.float(0.92, 0.98);
    }
  });
  return rect;
}

export function zonesToAmenities(influenceZones) {
  let id = 0;
  return influenceZones
    .filter((z) => z.meta)
    .map((z) => ({
      id: `amenity-${id++}`,
      rect: z.rect,
      ...z.meta,
    }));
}

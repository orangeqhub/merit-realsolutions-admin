import { AMENITY_TYPES } from '../AmenityGenerator.js';
import { bboxFromPolygon, SpatialGrid, rectCenter } from './geometry.js';

/**
 * STEPS 7–9 — Amenities, green space, open space (placed BEFORE plots).
 */
export function generateAmenitiesAndGreenSpace(boundary, roadNetwork, entrance, config) {
  const { bbox } = roadNetwork;
  const spatial = new SpatialGrid(80);

  roadNetwork.roads.forEach((r) => spatial.insert(r.id, r.rect));
  spatial.insert('entrance-plaza', entrance.plaza);

  const amenities = [];
  const reservedRects = [];
  let amenityId = 0;

  const tryPlace = (rect, meta) => {
    if (rect.w < 30 || rect.h < 30) return false;
    if (spatial.overlapsAny(rect, 2)) return false;
    const id = `amenity-${amenityId}`;
    amenityId += 1;
    spatial.insert(id, rect);
    reservedRects.push({ ...rect, id });
    amenities.push({ id, rect, ...meta });
    return true;
  };

  const enabled = config.enabledAmenityKeys || [];
  const candidates = findOpenPockets(bbox, boundary, spatial, config);

  // Central park
  if (enabled.includes('park') && candidates.length) {
    tryPlace(scaleRect(candidates[0], 0.85), {
      type: 'park',
      name: 'Central Park',
      label: 'Central Park',
    });
  }

  const pocketCount = config.amenitiesLevel === 'luxury' ? 3 : config.amenitiesLevel === 'standard' ? 2 : 1;
  candidates.slice(1, pocketCount + 1).forEach((c, i) => {
    if (!enabled.includes('park')) return;
    tryPlace(scaleRect(c, 0.7), {
      type: 'park',
      name: i === 0 ? 'Children Park' : `Pocket Park ${i + 1}`,
      label: i === 0 ? 'Children Park' : `Pocket Park ${i + 1}`,
    });
  });

  if (enabled.includes('clubHouse')) {
    tryPlace(
      {
        x: bbox.minX + (bbox.maxX - bbox.minX) * 0.35,
        y: bbox.minY + (bbox.maxY - bbox.minY) * 0.45,
        w: 120,
        h: 90,
      },
      { type: 'clubHouse', name: 'Club House', label: 'Club House' }
    );
  }

  if (enabled.includes('temple')) {
    tryPlace(
      { x: bbox.minX + 60, y: bbox.maxY - 120, w: 70, h: 60 },
      { type: 'temple', name: 'Temple', label: 'Temple' }
    );
  }

  if (enabled.includes('swimmingPool')) {
    tryPlace(
      {
        x: bbox.minX + (bbox.maxX - bbox.minX) * 0.5,
        y: bbox.minY + (bbox.maxY - bbox.minY) * 0.42,
        w: 80,
        h: 50,
      },
      { type: 'swimmingPool', name: 'Swimming Pool', label: 'Swimming Pool' }
    );
  }

  if (enabled.includes('utility')) {
    [
      { name: 'Water Tank', w: 40, h: 40 },
      { name: 'STP', w: 50, h: 45 },
      { name: 'Electrical Room', w: 35, h: 35 },
    ].forEach((u, i) => {
      tryPlace(
        { x: bbox.maxX - 100 - i * 55, y: bbox.minY + 80, w: u.w, h: u.h },
        { type: 'utility', name: u.name, label: u.name }
      );
    });
  }

  if (enabled.includes('office')) {
    tryPlace(
      {
        x: entrance.connectPoint.x + 120,
        y: entrance.connectPoint.y + 20,
        w: 90,
        h: 60,
      },
      { type: 'office', name: 'Sales Office', label: 'Sales Office' }
    );
  }

  if (enabled.includes('openSpace')) {
    const sideW = 120;
    [
      { x: bbox.minX + 30, y: bbox.maxY - sideW - 30, w: sideW, h: sideW * 0.6, label: 'DTCP Open Space' },
      { x: bbox.maxX - sideW - 50, y: bbox.maxY - sideW, w: sideW * 0.8, h: sideW * 0.5, label: 'Rainwater Harvest' },
      { x: bbox.minX + 40, y: bbox.minY + 40, w: 100, h: 60, label: 'Landscape Plaza' },
    ].forEach((o) => {
      tryPlace(o, { type: 'openSpace', name: o.label, label: o.label });
    });
  }

  tryPlace(entrance.entranceGarden, {
    type: 'openSpace',
    name: 'Entrance Garden',
    label: 'Entrance Garden',
  });

  if (config.amenitiesLevel === 'luxury') {
    tryPlace(
      {
        x: bbox.minX + 100,
        y: bbox.maxY - 40,
        w: bbox.maxX - bbox.minX - 200,
        h: 25,
      },
      { type: 'openSpace', name: 'Jogging Track', label: 'Jogging Track' }
    );
  }

  return { amenities, reservedRects, pocketCount };
}

function findOpenPockets(bbox, boundary, spatial, config) {
  const pockets = [];
  const gridStep = 100;
  const sizes = [
    { w: 200, h: 160 },
    { w: 160, h: 120 },
    { w: 140, h: 100 },
    { w: 120, h: 90 },
  ];

  for (let y = bbox.minY + 50; y < bbox.maxY - 80; y += gridStep) {
    for (let x = bbox.minX + 50; x < bbox.maxX - 80; x += gridStep) {
      sizes.forEach((size) => {
        const rect = {
          x: x + config.rng.int(-15, 15),
          y: y + config.rng.int(-15, 15),
          ...size,
        };
        const center = rectCenter(rect);
        if (!pointInPolygon(center.x, center.y, boundary.points)) return;
        if (spatial.overlapsAny(rect, 4)) return;
        pockets.push({ ...rect, area: rect.w * rect.h });
      });
    }
  }

  pockets.sort((a, b) => b.area - a.area);
  return pockets.slice(0, 10);
}

function scaleRect(rect, factor) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const w = rect.w * factor;
  const h = rect.h * factor;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getAmenityStyle(type) {
  const def = AMENITY_TYPES[type];
  if (def) {
    return { fillColor: def.fillColor, borderColor: def.borderColor };
  }
  return { fillColor: '#bbf7d0', borderColor: '#059669' };
}

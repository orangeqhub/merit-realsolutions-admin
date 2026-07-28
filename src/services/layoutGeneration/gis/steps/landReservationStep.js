import { bboxFromPolygon } from '../../township/geometry.js';
import { polygonCentroid } from '../../township/polygonGeometry.js';
import { GisSpatialIndex, rectToBBox } from '../core/spatialIndex.js';
import { createReservationEntity } from '../model/townshipModel.js';

const RESERVATION_CATALOG = [
  { type: 'park', label: 'Central Park', w: 200, h: 150, purpose: 'centralPark' },
  { type: 'park', label: 'Children Park', w: 110, h: 85, purpose: 'childrenPark' },
  { type: 'openSpace', label: 'Open Space', w: 130, h: 100, purpose: 'openSpace' },
  { type: 'clubHouse', label: 'Club House', w: 120, h: 90, purpose: 'clubHouse' },
  { type: 'temple', label: 'Temple', w: 70, h: 60, purpose: 'temple' },
  { type: 'utility', label: 'STP', w: 50, h: 45, purpose: 'stp' },
  { type: 'utility', label: 'Water Tank', w: 40, h: 40, purpose: 'waterTank' },
  { type: 'utility', label: 'Electrical Room', w: 35, h: 35, purpose: 'electrical' },
  { type: 'openSpace', label: 'Rain Water Harvesting', w: 100, h: 70, purpose: 'rainwater' },
  { type: 'openSpace', label: 'Walking Track', w: 180, h: 25, purpose: 'joggingTrack' },
  { type: 'office', label: 'Commercial Strip', w: 140, h: 55, purpose: 'commercialStrip' },
  { type: 'park', label: 'Pocket Park', w: 90, h: 70, purpose: 'pocketPark' },
];

/**
 * STEP 5 — Reserve land BEFORE plot subdivision. Amenities shape blocks; no plot overlap.
 */
export function reserveLand(blocks, roadNetwork, entrance, boundary, config) {
  const bbox = bboxFromPolygon(boundary.points);
  const spatial = new GisSpatialIndex(60);
  const enabled = new Set(config.enabledAmenityKeys || []);

  roadNetwork.roads.forEach((r) => spatial.insert(r.id, rectToBBox(r.rect)));
  spatial.insert('entrance-plaza', rectToBBox(entrance.plaza));

  const reservations = [];
  const amenities = [];
  let id = 0;

  const tryReserve = (rect, meta) => {
    const probe = rectToBBox(rect);
    if (probe.maxX - probe.minX < 25 || probe.maxY - probe.minY < 20) return false;
    if (spatial.overlaps(`res-${id}`, probe, 4)) return false;

    const reservation = createReservationEntity({
      id: `reservation-${id}`,
      type: meta.type,
      rect,
      label: meta.label,
      purpose: meta.purpose,
    });
    id += 1;
    spatial.insert(reservation.id, probe);
    reservations.push(reservation);
    amenities.push({
      id: `amenity-${reservation.id}`,
      rect,
      type: meta.type,
      name: meta.label,
      label: meta.label,
    });
    return true;
  };

  const candidates = buildReservationCandidates(bbox, blocks, entrance, config);

  RESERVATION_CATALOG.forEach((item) => {
    const typeKey = item.type === 'office' ? 'office' : item.type;
    if (item.purpose === 'commercialStrip' && !enabled.has('office') && !enabled.has('commercial')) return;
    if (item.type === 'park' && !enabled.has('park')) return;
    if (item.type === 'openSpace' && !enabled.has('openSpace')) return;
    if (item.type === 'clubHouse' && !enabled.has('clubHouse')) return;
    if (item.type === 'temple' && !enabled.has('temple')) return;
    if (item.type === 'utility' && !enabled.has('utility')) return;
    if (item.purpose === 'joggingTrack' && config.amenitiesLevel !== 'luxury') return;

    for (const spot of candidates) {
      const rect = {
        x: spot.x,
        y: spot.y,
        w: item.w + config.rng.int(-15, 20),
        h: item.h + config.rng.int(-10, 15),
      };
      if (tryReserve(rect, item)) break;
    }
  });

  tryReserve(entrance.entranceGarden, {
    type: 'openSpace',
    label: 'Entrance Garden',
    purpose: 'entranceGarden',
  });

  return { reservations, amenities, spatial };
}

function buildReservationCandidates(bbox, blocks, entrance, config) {
  const spots = [];
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;

  spots.push({ x: cx - 100, y: cy - 50 });
  spots.push({ x: entrance.connectPoint.x + 100, y: entrance.connectPoint.y + 30 });
  spots.push({ x: bbox.minX + 80, y: bbox.maxY - 180 });
  spots.push({ x: bbox.maxX - 200, y: bbox.minY + 100 });
  spots.push({ x: cx + 80, y: cy + 60 });

  blocks.forEach((block) => {
    const c = block.blockCenter;
    spots.push({ x: c.x - 60, y: c.y - 40 });
  });

  return config.rng.shuffle(spots);
}

export function reservationsToExclusionRects(reservations) {
  return reservations.map((r) => ({ ...r.rect, id: r.id }));
}

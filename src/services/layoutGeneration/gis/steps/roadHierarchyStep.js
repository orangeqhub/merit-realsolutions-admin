import { bboxFromPolygon, pointInPolygon, SpatialGrid } from '../../township/geometry.js';
import {
  resolveGisRoadWidths,
  createRoadGraph,
  addRoadSegment,
  buildRoadPolygon,
  buildLaneEdges,
  generateCulDeSac,
} from '../core/roadGraph.js';
import { rectToBBox } from '../core/spatialIndex.js';
import { createRoadEntity } from '../model/townshipModel.js';

/**
 * STEP 3 — GIS road hierarchy: Primary → Secondary → Internal → Service.
 * Roads split land into parcels; NOT equally spaced.
 */
export function generateGisRoadHierarchy(boundary, entrance, config) {
  const widths = resolveGisRoadWidths(config);
  const { rng, roadStyle } = config;
  const bbox = bboxFromPolygon(boundary.points);
  const roads = [];
  const spatial = new SpatialGrid(80);
  const graph = createRoadGraph();
  let roadId = 0;

  const addRoad = (rect, hierarchy, orientation, name, intersection = false) => {
    const clipped = clipRect(rect, bbox);
    if (!clipped || clipped.w < 8 || clipped.h < 8) return null;
    if (spatial.overlapsAny(clipped, 3)) return null;

    const id = `gis-road-${roadId++}`;
    const widthFeet = widths[hierarchy] || widths.internal;
    const laneEdges = buildLaneEdges(clipped, widthFeet);
    const entity = createRoadEntity({
      id,
      roadType: hierarchy === 'primary' ? 'main' : hierarchy,
      hierarchy,
      rect: clipped,
      polygon: buildRoadPolygon(clipped),
      widthFeet: Math.min(clipped.w, clipped.h) < Math.max(clipped.w, clipped.h)
        ? Math.min(clipped.w, clipped.h)
        : widthFeet,
      name,
      orientation,
      laneEdges,
      intersection,
    });

    spatial.insert(id, clipped);
    roads.push(entity);
    addRoadSegment(graph, entity, rectToBBox(clipped));
    return entity;
  };

  const spineX = entrance.mainAxisX;
  const crossY = rng.float(bbox.minY + boundary.heightFeet * 0.32, bbox.minY + boundary.heightFeet * 0.52);

  // Primary boulevard from entrance
  addRoad(
    { x: spineX - widths.primary / 2, y: bbox.minY, w: widths.primary, h: bbox.maxY - bbox.minY },
    'primary',
    'vertical',
    'Primary Boulevard'
  );

  addRoad(
    { x: bbox.minX, y: crossY - widths.primary / 2, w: bbox.maxX - bbox.minX, h: widths.primary },
    'primary',
    'horizontal',
    'Central Primary Road',
    true
  );

  // Entrance boulevard connector
  addRoad(
    {
      x: entrance.connectPoint.x - widths.primary / 2,
      y: entrance.connectPoint.y,
      w: widths.primary,
      h: 80,
    },
    'primary',
    'vertical',
    'Entrance Boulevard'
  );

  // Secondary roads — organic spacing
  const zones = partitionZones(bbox, spineX, crossY);
  zones.forEach((zone, zi) => {
    const spacing = rng.int(280, 420);
    let y = zone.minY + rng.int(60, 140);
    while (y < zone.maxY - 80) {
      addRoad(
        {
          x: zone.minX + 25,
          y: y - widths.secondary / 2,
          w: zone.maxX - zone.minX - 50,
          h: widths.secondary,
        },
        'secondary',
        'horizontal',
        `Secondary Road ${zi + 1}H`
      );
      y += spacing + widths.secondary;
    }

    let x = zone.minX + rng.int(60, 160);
    while (x < zone.maxX - 80) {
      if (rng.bool(0.55)) {
        addRoad(
          {
            x: x - widths.internal / 2,
            y: zone.minY + 25,
            w: widths.internal,
            h: zone.maxY - zone.minY - 50,
          },
          'internal',
          'vertical',
          `Internal Road ${zi + 1}V`
        );
      }
      x += rng.int(240, 360) + widths.internal;
    }
  });

  // Service roads & cul-de-sac
  if (config.densityKey !== 'low') {
    zones.forEach((zone, zi) => {
      if (rng.bool(0.5)) {
        addRoad(
          {
            x: zone.minX + 15,
            y: zone.maxY - widths.service - 20,
            w: zone.maxX - zone.minX - 30,
            h: widths.service,
          },
          'service',
          'horizontal',
          `Service Lane ${zi + 1}`
        );
      }
    });
  }

  if (roadStyle === 'premium' || roadStyle === 'organic') {
    const culX = rng.float(bbox.minX + 250, bbox.maxX - 250);
    const culY = rng.float(bbox.minY + 200, bbox.maxY - 200);
    generateCulDeSac(culX, culY, rng.int(80, 120), widths.internal, rng).forEach((seg, i) => {
      addRoad(seg, 'internal', 'culdesac', `Cul-de-sac ${i + 1}`);
    });

    if (rng.bool(0.6)) {
      const loopInset = 70;
      addRoad(
        {
          x: bbox.minX + loopInset,
          y: bbox.minY + loopInset,
          w: bbox.maxX - bbox.minX - loopInset * 2,
          h: widths.secondary,
        },
        'secondary',
        'loop',
        'Perimeter Loop'
      );
    }
  }

  return { roads, graph, bbox, spineX, crossY, spatial, widths };
}

function partitionZones(bbox, spineX, crossY) {
  return [
    { minX: bbox.minX, maxX: spineX, minY: crossY, maxY: bbox.maxY },
    { minX: spineX, maxX: bbox.maxX, minY: crossY, maxY: bbox.maxY },
    { minX: bbox.minX, maxX: spineX, minY: bbox.minY, maxY: crossY },
    { minX: spineX, maxX: bbox.maxX, minY: bbox.minY, maxY: crossY },
  ];
}

function clipRect(rect, bbox) {
  const x = Math.max(bbox.minX, rect.x);
  const y = Math.max(bbox.minY, rect.y);
  const w = Math.min(bbox.maxX, rect.x + rect.w) - x;
  const h = Math.min(bbox.maxY, rect.y + rect.h) - y;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/** Adapter for downstream steps expecting .rect on roads */
export function roadsToLegacyFormat(gisRoads) {
  return gisRoads.map((r) => ({
    id: r.id,
    rect: r.rect,
    roadType: r.roadType,
    hierarchy: r.hierarchy,
    orientation: r.orientation,
    widthFeet: r.widthFeet,
    widthMeters: r.widthMeters,
    name: r.name,
    polygon: r.premiumPolygon || r.polygon,
    centerline: r.centerline,
    lengthFeet: r.lengthFeet,
    lengthMeters: r.lengthMeters,
    connectedRoads: r.connectedRoads,
    laneEdges: r.laneEdges,
    premium: r.premium,
    label: r.label,
    displayLabel: r.displayLabel,
  }));
}

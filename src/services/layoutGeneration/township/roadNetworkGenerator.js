import { bboxFromPolygon, SpatialGrid, rectsOverlap } from './geometry.js';

const ROAD_TYPES = {
  MAIN: 'main',
  INTERNAL: 'internal',
  SECONDARY: 'secondary',
  SERVICE: 'service',
};

/**
 * STEP 3 — Hierarchical road network with T/cross junctions, loops, cul-de-sacs.
 */
export function generateRoadNetwork(boundary, entrance, config) {
  const { roadWidths, roadStyle, rng } = config;
  const bbox = bboxFromPolygon(boundary.points);
  const roads = [];
  const spatial = new SpatialGrid(100);
  let roadId = 0;

  const addRoad = (rect, roadType, orientation, name = '') => {
    const normalized = normalizeRoadRect(rect, bbox);
    if (!normalized) return null;
    if (spatial.overlapsAny(normalized, 2)) return null;
    const id = `road-${roadId}`;
    roadId += 1;
    const record = {
      id,
      rect: normalized,
      roadType,
      orientation,
      widthFeet: Math.min(normalized.w, normalized.h) > Math.max(normalized.w, normalized.h)
        ? Math.min(normalized.w, normalized.h)
        : Math.max(normalized.w, normalized.h),
      name: name || formatRoadName(roadType),
    };
    spatial.insert(id, normalized);
    roads.push(record);
    return record;
  };

  const spineX = entrance.mainAxisX;
  const crossY = rng.float(bbox.minY + boundary.heightFeet * 0.3, bbox.minY + boundary.heightFeet * 0.55);

  // Main spine from entrance to north
  addRoad(
    {
      x: spineX - roadWidths.main / 2,
      y: bbox.minY,
      w: roadWidths.main,
      h: bbox.maxY - bbox.minY,
    },
    ROAD_TYPES.MAIN,
    'vertical',
    'Main Avenue'
  );

  // Cross main road
  addRoad(
    {
      x: bbox.minX,
      y: crossY - roadWidths.main / 2,
      w: bbox.maxX - bbox.minX,
      h: roadWidths.main,
    },
    ROAD_TYPES.MAIN,
    'horizontal',
    'Central Boulevard'
  );

  // Quadrant internal roads
  const quadrants = [
    { minX: bbox.minX, maxX: spineX, minY: crossY, maxY: bbox.maxY, label: 'NW' },
    { minX: spineX, maxX: bbox.maxX, minY: crossY, maxY: bbox.maxY, label: 'NE' },
    { minX: bbox.minX, maxX: spineX, minY: bbox.minY, maxY: crossY, label: 'SW' },
    { minX: spineX, maxX: bbox.maxX, minY: bbox.minY, maxY: crossY, label: 'SE' },
  ];

  quadrants.forEach((q, qi) => {
    const spacing = rng.int(220, 380);
    const offset = rng.int(40, 120);

    // Horizontal internal roads
    for (let y = q.minY + offset; y < q.maxY - 60; y += spacing + roadWidths.internal) {
      addRoad(
        {
          x: q.minX + 20,
          y: y - roadWidths.internal / 2,
          w: q.maxX - q.minX - 40,
          h: roadWidths.internal,
        },
        ROAD_TYPES.INTERNAL,
        'horizontal',
        `Internal Road ${qi + 1}H`
      );
    }

    // Vertical internal / secondary
    const vSpacing = spacing + rng.int(-40, 60);
    for (let x = q.minX + offset; x < q.maxX - 60; x += vSpacing + roadWidths.secondary) {
      const type = rng.bool(0.35) ? ROAD_TYPES.SECONDARY : ROAD_TYPES.INTERNAL;
      const width = type === ROAD_TYPES.SECONDARY ? roadWidths.secondary : roadWidths.internal;
      addRoad(
        {
          x: x - width / 2,
          y: q.minY + 20,
          w: width,
          h: q.maxY - q.minY - 40,
        },
        type,
        'vertical',
        `Internal Road ${qi + 1}V`
      );
    }
  });

  // Service roads along block edges
  if (config.densityKey !== 'low') {
    quadrants.forEach((q, qi) => {
      if (rng.bool(0.6)) {
        addRoad(
          {
            x: q.minX + 10,
            y: q.maxY - roadWidths.service - 15,
            w: q.maxX - q.minX - 20,
            h: roadWidths.service,
          },
          ROAD_TYPES.SERVICE,
          'horizontal',
          `Service Lane ${qi + 1}`
        );
      }
    });
  }

  // Organic boulevard — offset curved spine segments
  if (roadStyle === 'premium' || roadStyle === 'organic') {
    const boulevardSteps = roadStyle === 'premium' ? 8 : 5;
    const amplitude = rng.int(25, 55);
    for (let i = 0; i < boulevardSteps; i += 1) {
      const t = i / boulevardSteps;
      const baseY = bbox.minY + t * (bbox.maxY - bbox.minY);
      const offsetX = spineX + Math.sin(t * Math.PI * 2) * amplitude;
      addRoad(
        {
          x: offsetX - roadWidths.main * 0.45,
          y: baseY,
          w: roadWidths.main * 0.9,
          h: (bbox.maxY - bbox.minY) / boulevardSteps + roadWidths.main,
        },
        ROAD_TYPES.MAIN,
        'curved',
        'Boulevard'
      );
    }

    // Crescent road (arc approximation)
    if (rng.bool(0.75)) {
      const crescentCx = rng.float(bbox.minX + 200, bbox.maxX - 200);
      const crescentCy = rng.float(bbox.minY + 200, bbox.maxY - 250);
      const segments = 7;
      for (let i = 0; i < segments; i += 1) {
        const a0 = Math.PI * 0.15 + (i / segments) * Math.PI * 0.7;
        const r = rng.int(140, 220);
        const cx = crescentCx + Math.cos(a0) * r;
        const cy = crescentCy + Math.sin(a0) * r * 0.5;
        addRoad(
          {
            x: cx - roadWidths.secondary / 2,
            y: cy - roadWidths.secondary / 2,
            w: roadWidths.secondary + 35,
            h: roadWidths.secondary + 20,
          },
          ROAD_TYPES.SECONDARY,
          'crescent',
          'Crescent'
        );
      }
    }

    // Loop road near boundary (partial)
    const inset = 80;
    const loopSegments = [
      { x: bbox.minX + inset, y: bbox.minY + inset, w: bbox.maxX - bbox.minX - inset * 2, h: roadWidths.secondary },
      { x: bbox.maxX - inset - roadWidths.secondary, y: bbox.minY + inset, w: roadWidths.secondary, h: bbox.maxY - bbox.minY - inset * 2 },
    ];
    loopSegments.forEach((seg, i) => {
      if (rng.bool(roadStyle === 'premium' ? 0.85 : 0.5)) {
        addRoad(seg, ROAD_TYPES.SECONDARY, i === 0 ? 'horizontal' : 'vertical', 'Perimeter Loop');
      }
    });

    // Cul-de-sac stubs
    if (rng.bool(0.7)) {
      const culX = rng.float(bbox.minX + 200, bbox.maxX - 200);
      addRoad(
        {
          x: culX - roadWidths.internal / 2,
          y: bbox.maxY - 180,
          w: roadWidths.internal,
          h: 120,
        },
        ROAD_TYPES.INTERNAL,
        'vertical',
        'Cul-de-sac'
      );
    }

    // Diagonal connector (premium)
    if (roadStyle === 'premium' && rng.bool(0.55)) {
      const diagLen = 300;
      const steps = 6;
      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const cx = bbox.minX + 200 + t * (bbox.maxX - bbox.minX - 400);
        const cy = bbox.minY + 150 + t * (bbox.maxY - bbox.minY - 300);
        addRoad(
          {
            x: cx - roadWidths.secondary / 2,
            y: cy - roadWidths.secondary / 2,
            w: roadWidths.secondary + 40,
            h: roadWidths.secondary + 20,
          },
          ROAD_TYPES.SECONDARY,
          'diagonal',
          'Diagonal Link'
        );
      }
    }
  }

  // Connect entrance to main spine (already connected via spine at gate)
  const entranceConnector = {
    x: entrance.connectPoint.x - roadWidths.main / 2,
    y: entrance.connectPoint.y,
    w: roadWidths.main,
    h: 60,
  };
  addRoad(entranceConnector, ROAD_TYPES.MAIN, 'vertical', 'Entrance Drive');

  return { roads, roadSpatial: spatial, bbox, crossY, spineX };
}

function normalizeRoadRect(rect, bbox) {
  if (rect.w <= 0 || rect.h <= 0) return null;
  const clipped = {
    x: Math.max(bbox.minX, rect.x),
    y: Math.max(bbox.minY, rect.y),
    w: Math.min(bbox.maxX, rect.x + rect.w) - Math.max(bbox.minX, rect.x),
    h: Math.min(bbox.maxY, rect.y + rect.h) - Math.max(bbox.minY, rect.y),
  };
  if (clipped.w < 8 || clipped.h < 8) return null;
  return clipped;
}

function formatRoadName(roadType) {
  if (roadType === ROAD_TYPES.MAIN) return 'Main Road';
  if (roadType === ROAD_TYPES.SECONDARY) return 'Secondary Road';
  if (roadType === ROAD_TYPES.SERVICE) return 'Service Road';
  return 'Internal Road';
}

export { ROAD_TYPES };

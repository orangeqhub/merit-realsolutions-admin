import { pointInPolygon } from '../../township/geometry.js';
import {
  buildIrregularBlockPolygon,
  polygonCentroid,
  polygonArea,
  rotatePolygon,
  degToRad,
} from '../../township/polygonGeometry.js';
import { createBlockEntity } from '../model/townshipModel.js';

const CELL = 32;
const BLOCK_SHAPES = ['rectangle', 'trapezoid', 'pentagon', 'lShape', 'longRect', 'irregular'];

/**
 * STEP 4 — Roads define blocks. Each block is unique.
 */
export function formBlocksFromRoads(boundary, roadNetwork, config) {
  const { roads, bbox } = roadNetwork;
  const cols = Math.ceil((bbox.maxX - bbox.minX) / CELL);
  const rows = Math.ceil((bbox.maxY - bbox.minY) / CELL);
  const blocked = new Uint8Array(cols * rows);

  const markRect = (rect, pad = 3) => {
    const c0 = Math.max(0, Math.floor((rect.x - pad - bbox.minX) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((rect.x + rect.w + pad - bbox.minX) / CELL));
    const r0 = Math.max(0, Math.floor((rect.y - pad - bbox.minY) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((rect.y + rect.h + pad - bbox.minY) / CELL));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        blocked[r * cols + c] = 1;
      }
    }
  };

  roads.forEach((road) => markRect(road.rect));

  const parcels = [];
  const grid = new Int16Array(cols * rows).fill(-1);
  let parcelId = 0;
  const queue = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const idx = r * cols + c;
      if (grid[idx] >= 0 || blocked[idx]) continue;
      const wx = bbox.minX + c * CELL + CELL / 2;
      const wy = bbox.minY + r * CELL + CELL / 2;
      if (!pointInPolygon(wx, wy, boundary.points)) continue;

      grid[idx] = parcelId;
      queue.push(idx);
      let minC = c;
      let maxC = c;
      let minR = r;
      let maxR = r;
      let cells = 0;

      while (queue.length) {
        const cur = queue.pop();
        cells += 1;
        const cr = Math.floor(cur / cols);
        const cc = cur % cols;
        minC = Math.min(minC, cc);
        maxC = Math.max(maxC, cc);
        minR = Math.min(minR, cr);
        maxR = Math.max(maxR, cr);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) return;
          const ni = nr * cols + nc;
          if (grid[ni] >= 0 || blocked[ni]) return;
          const nx = bbox.minX + nc * CELL + CELL / 2;
          const ny = bbox.minY + nr * CELL + CELL / 2;
          if (!pointInPolygon(nx, ny, boundary.points)) return;
          grid[ni] = parcelId;
          queue.push(ni);
        });
      }

      if (cells < (config.densityKey === 'high' ? 10 : 14)) continue;

      const baseRect = {
        x: bbox.minX + minC * CELL + 8,
        y: bbox.minY + minR * CELL + 8,
        w: (maxC - minC + 1) * CELL - 16,
        h: (maxR - minR + 1) * CELL - 16,
      };
      if (baseRect.w < 100 || baseRect.h < 75) continue;

      parcels.push({
        id: parcelId,
        baseRect,
        cells,
        roadExposure: countRoadTouch(baseRect, roads),
      });
      parcelId += 1;
    }
  }

  parcels.sort((a, b) => b.cells - a.cells);
  const maxBlocks = config.densityKey === 'high' ? 10 : config.densityKey === 'low' ? 5 : 7;
  const selected = parcels.slice(0, maxBlocks);

  const blocks = selected.map((parcel, index) => {
    const blockName = String.fromCharCode(config.blockPrefix.charCodeAt(0) + index);
    const shapeKey = BLOCK_SHAPES[index % BLOCK_SHAPES.length];
    const shaped = buildBlockShape(parcel.baseRect, shapeKey, config.rng, index);
    const blockPolygon = shaped.polygon;

    return createBlockEntity({
      id: `block-${blockName}`,
      blockName,
      blockPolygon,
      blockCenter: polygonCentroid(blockPolygon),
      blockArea: polygonArea(blockPolygon),
      shapeType: shaped.shapeType,
      rotationDeg: shaped.rotationDeg,
      roadExposure: parcel.roadExposure,
      frontage: parcel.baseRect.w + config.rng.int(-30, 50),
    });
  });

  return { blocks, parcels: selected };
}

function buildBlockShape(baseRect, shapeType, rng, index) {
  if (shapeType === 'lShape') {
    const poly = [
      { x: baseRect.x, y: baseRect.y },
      { x: baseRect.x + baseRect.w * 0.55, y: baseRect.y },
      { x: baseRect.x + baseRect.w * 0.55, y: baseRect.y + baseRect.h * 0.45 },
      { x: baseRect.x + baseRect.w, y: baseRect.y + baseRect.h * 0.45 },
      { x: baseRect.x + baseRect.w, y: baseRect.y + baseRect.h },
      { x: baseRect.x, y: baseRect.y + baseRect.h },
    ];
    const cx = baseRect.x + baseRect.w / 2;
    const cy = baseRect.y + baseRect.h / 2;
    const rotDeg = rng.pick([-12, -8, 0, 8, 15]);
    return {
      polygon: rotatePolygon(poly, cx, cy, degToRad(rotDeg)),
      rotationDeg: rotDeg,
      shapeType: 'L_SHAPE',
    };
  }
  if (shapeType === 'longRect') {
    const r = { ...baseRect, w: baseRect.w * 1.08, h: baseRect.h * 0.78 };
    return buildIrregularBlockPolygon(r, rng, index);
  }
  return buildIrregularBlockPolygon(baseRect, rng, index);
}

function countRoadTouch(rect, roads) {
  let count = 0;
  roads.forEach((road) => {
    const r = road.rect;
    if (
      rect.x <= r.x + r.w && rect.x + rect.w >= r.x
      && rect.y <= r.y + r.h && rect.y + rect.h >= r.y
    ) {
      count += 1;
    }
  });
  return count;
}

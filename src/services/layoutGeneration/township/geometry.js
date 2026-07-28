/** Local feet-space geometry helpers for township generation. */

export function bboxFromPolygon(points) {
  if (!points?.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  points.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY };
}

export function pointInPolygon(x, y, polygon) {
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

export function rectsOverlap(a, b, gap = 0) {
  return !(
    a.x + a.w + gap <= b.x
    || b.x + b.w + gap <= a.x
    || a.y + a.h + gap <= b.y
    || b.y + b.h + gap <= a.y
  );
}

export function expandRect(rect, margin) {
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    w: rect.w + margin * 2,
    h: rect.h + margin * 2,
  };
}

export function rectCenter(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function roundRectCorners(points, radiusFeet) {
  if (!points?.length || radiusFeet <= 0) return points;
  const r = radiusFeet;
  const result = [];
  const n = points.length;

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const trim = Math.min(r, len1 / 2, len2 / 2);

    result.push({
      x: curr.x + (v1x / len1) * trim,
      y: curr.y + (v1y / len1) * trim,
    });
    result.push({
      x: curr.x + (v2x / len2) * trim,
      y: curr.y + (v2y / len2) * trim,
    });
  }
  return result;
}

/** Spatial grid index for fast overlap queries */
export class SpatialGrid {
  constructor(cellSize = 80) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  key(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(id, rect) {
    const minCx = Math.floor(rect.x / this.cellSize);
    const maxCx = Math.floor((rect.x + rect.w) / this.cellSize);
    const minCy = Math.floor(rect.y / this.cellSize);
    const maxCy = Math.floor((rect.y + rect.h) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const k = `${cx},${cy}`;
        if (!this.cells.has(k)) this.cells.set(k, []);
        this.cells.get(k).push({ id, rect });
      }
    }
  }

  query(rect) {
    const results = [];
    const seen = new Set();
    const minCx = Math.floor(rect.x / this.cellSize);
    const maxCx = Math.floor((rect.x + rect.w) / this.cellSize);
    const minCy = Math.floor(rect.y / this.cellSize);
    const maxCy = Math.floor((rect.y + rect.h) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const items = this.cells.get(`${cx},${cy}`) || [];
        items.forEach((item) => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            results.push(item);
          }
        });
      }
    }
    return results;
  }

  overlapsAny(rect, gap = 1) {
    const candidates = this.query(rect);
    return candidates.some((c) => rectsOverlap(c.rect, rect, gap));
  }
}

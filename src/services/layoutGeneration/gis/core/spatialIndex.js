/** GIS-first spatial index — fast collision queries in feet space. */
export class GisSpatialIndex {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.items = new Map();
  }

  insert(id, bbox) {
    this.items.set(id, bbox);
    const minCx = Math.floor(bbox.minX / this.cellSize);
    const maxCx = Math.floor(bbox.maxX / this.cellSize);
    const minCy = Math.floor(bbox.minY / this.cellSize);
    const maxCy = Math.floor(bbox.maxY / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const k = `${cx},${cy}`;
        if (!this.cells.has(k)) this.cells.set(k, new Set());
        this.cells.get(k).add(id);
      }
    }
  }

  queryBBox(bbox) {
    const seen = new Set();
    const minCx = Math.floor(bbox.minX / this.cellSize);
    const maxCx = Math.floor(bbox.maxX / this.cellSize);
    const minCy = Math.floor(bbox.minY / this.cellSize);
    const maxCy = Math.floor(bbox.maxY / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const ids = this.cells.get(`${cx},${cy}`);
        if (!ids) continue;
        ids.forEach((id) => seen.add(id));
      }
    }
    return [...seen];
  }

  overlaps(id, bbox, gap = 2) {
    const candidates = this.queryBBox(bbox);
    return candidates.some((cid) => {
      if (cid === id) return false;
      const other = this.items.get(cid);
      if (!other) return false;
      return !(
        bbox.maxX + gap <= other.minX
        || other.maxX + gap <= bbox.minX
        || bbox.maxY + gap <= other.minY
        || other.maxY + gap <= bbox.minY
      );
    });
  }
}

export function polygonToBBox(polygon) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  polygon.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  return { minX, maxX, minY, maxY };
}

export function rectToBBox(rect) {
  return {
    minX: rect.x,
    maxX: rect.x + rect.w,
    minY: rect.y,
    maxY: rect.y + rect.h,
  };
}

export function bboxFromRect(rect) {
  return rectToBBox(rect);
}

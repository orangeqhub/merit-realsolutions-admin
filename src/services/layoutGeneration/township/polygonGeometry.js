/** Polygon geometry for organic township generation (feet space). */

export function degToRad(d) {
  return (d * Math.PI) / 180;
}

export function rotatePoint(x, y, cx, cy, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

export function rotatePolygon(polygon, cx, cy, angleRad) {
  return polygon.map((p) => rotatePoint(p.x, p.y, cx, cy, angleRad));
}

export function polygonCentroid(polygon) {
  if (!polygon?.length) return { x: 0, y: 0 };
  const sum = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / polygon.length, y: sum.y / polygon.length };
}

export function polygonBBox(polygon) {
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
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

export function rectToPolygon(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
}

/** Irregular block: rotated trapezoid / tapered quad with chamfered feel */
export function buildIrregularBlockPolygon(rect, rng, varietyIndex = 0) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const rotations = [-12, -8, 0, 8, 15, -15, 12];
  const rotDeg = rotations[varietyIndex % rotations.length] + rng.int(-3, 3);
  const rot = degToRad(rotDeg);

  const taper = rng.float(0.88, 1.0);
  const skew = rng.float(-0.06, 0.06) * rect.w;
  const inset = rng.int(8, 28);

  let poly = [
    { x: rect.x + inset, y: rect.y + inset },
    { x: rect.x + rect.w - inset, y: rect.y + inset + skew * 0.3 },
    { x: rect.x + rect.w * taper - inset * 0.5, y: rect.y + rect.h - inset },
    { x: rect.x + inset + skew, y: rect.y + rect.h - inset * 0.8 },
  ];

  if (rng.bool(0.35)) {
    poly = [
      { x: rect.x + inset, y: rect.y + inset },
      { x: rect.x + rect.w - inset, y: rect.y + inset },
      { x: rect.x + rect.w - inset * 2, y: rect.y + rect.h - inset },
      { x: rect.x + inset * 2, y: rect.y + rect.h - inset * 1.2 },
      { x: rect.x + inset, y: rect.y + rect.h * 0.55 },
    ];
  }

  poly = rotatePolygon(poly, cx, cy, rot);

  return {
    polygon: poly,
    rotationDeg: rotDeg,
    rotationRad: rot,
    center: { x: cx, y: cy },
    shapeType: rng.bool(0.25) ? 'TRAPEZOID' : 'POLYGON',
  };
}

/** Transform world point to parcel-local axes (inverse rotation) */
export function toLocalPoint(x, y, center, angleRad) {
  return rotatePoint(x, y, center.x, center.y, -angleRad);
}

export function toWorldPoint(x, y, center, angleRad) {
  return rotatePoint(x, y, center.x, center.y, angleRad);
}

export function localRectToWorldPolygon(lx, ly, w, h, center, angleRad) {
  const corners = [
    { x: lx, y: ly },
    { x: lx + w, y: ly },
    { x: lx + w, y: ly + h },
    { x: lx, y: ly + h },
  ];
  return corners.map((c) => toWorldPoint(c.x, c.y, center, angleRad));
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

export function polygonArea(polygon) {
  let area = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

export function insetPolygon(polygon, margin) {
  const c = polygonCentroid(polygon);
  return polygon.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.max(0, 1 - margin / len);
    return { x: c.x + dx * scale, y: c.y + dy * scale };
  });
}

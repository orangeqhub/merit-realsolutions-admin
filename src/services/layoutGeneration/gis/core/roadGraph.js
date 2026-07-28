/** GIS road hierarchy — DTCP/HMDA standard widths (feet). */
export const GIS_ROAD_HIERARCHY = {
  primary: { width: 60, type: 'main', label: 'Primary Road' },
  secondary: { width: 40, type: 'secondary', label: 'Secondary Road' },
  internal: { width: 33, type: 'internal', label: 'Internal Road' },
  service: { width: 24, type: 'service', label: 'Service Road' },
  connector: { width: 18, type: 'service', label: 'Connector' },
};

export function resolveGisRoadWidths(config) {
  const preset = config.roadWidths || {};
  return {
    primary: preset.main || GIS_ROAD_HIERARCHY.primary.width,
    secondary: preset.secondary || GIS_ROAD_HIERARCHY.secondary.width,
    internal: preset.internal || GIS_ROAD_HIERARCHY.internal.width,
    service: preset.service || GIS_ROAD_HIERARCHY.service.width,
    connector: GIS_ROAD_HIERARCHY.connector.width,
  };
}

export function createRoadGraph() {
  return { nodes: [], edges: [], intersections: [] };
}

export function addRoadSegment(graph, road, bbox) {
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const nodeId = `node-${graph.nodes.length}`;
  graph.nodes.push({ id: nodeId, x: cx, y: cy });
  graph.edges.push({
    id: road.id,
    from: nodeId,
    roadType: road.hierarchy,
    widthFeet: road.widthFeet,
    lengthFeet: Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY),
  });
  return graph;
}

export function buildRoadPolygon(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
}

export function buildLaneEdges(rect, widthFeet) {
  const inset = Math.min(widthFeet * 0.15, 6);
  return {
    left: { x: rect.x + inset, y: rect.y, w: inset, h: rect.h },
    right: { x: rect.x + rect.w - inset * 2, y: rect.y, w: inset, h: rect.h },
    centerLine: {
      x: rect.x + rect.w / 2 - 1,
      y: rect.y,
      w: 2,
      h: rect.h,
    },
  };
}

export function generateCulDeSac(cx, cy, radius, width, rng) {
  const segments = [];
  const steps = 6;
  for (let i = 0; i < steps; i += 1) {
    const a = Math.PI * 0.2 + (i / steps) * Math.PI * 0.6;
    const px = cx + Math.cos(a) * radius - width / 2;
    const py = cy + Math.sin(a) * radius * 0.6 - width / 2;
    segments.push({ x: px, y: py, w: width + 20, h: width + 15 });
  }
  return segments;
}

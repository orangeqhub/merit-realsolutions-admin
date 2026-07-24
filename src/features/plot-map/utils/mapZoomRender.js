import { getPolygonPositions } from './polygonUtils';

export const ZOOM_LEVEL = {
  OVERVIEW: 'overview',
  BLOCK: 'block',
  DETAIL: 'detail',
};

/** Zoom 14–15 → overview, 16–17 → block, 18+ → detail */
export function getMapRenderLevel(zoom = 18) {
  const z = Number(zoom) || 18;
  if (z <= 15) return ZOOM_LEVEL.OVERVIEW;
  if (z <= 17) return ZOOM_LEVEL.BLOCK;
  return ZOOM_LEVEL.DETAIL;
}

export function getMapRenderConfig(zoom = 18) {
  const level = getMapRenderLevel(zoom);

  return {
    level,
    showBoundary: true,
    showMainRoadsOnly: level === ZOOM_LEVEL.OVERVIEW,
    showRoadLabels: level !== ZOOM_LEVEL.OVERVIEW,
    showPlotPolygons: level !== ZOOM_LEVEL.OVERVIEW,
    showAmenities: level !== ZOOM_LEVEL.OVERVIEW,
    showPlotNumberLabels: level === ZOOM_LEVEL.DETAIL,
    showBlockClusters: level === ZOOM_LEVEL.OVERVIEW,
    showBlockNameLabels: level === ZOOM_LEVEL.OVERVIEW,
    showFullPlotTooltip: level === ZOOM_LEVEL.DETAIL,
    showBasicPlotTooltip: level === ZOOM_LEVEL.BLOCK,
  };
}

const STATUS_KEYS = ['Available', 'Reserved', 'Booked', 'Sold', 'Blocked'];

export function resolvePlotBlockName(plot) {
  if (plot?.blockName) return String(plot.blockName).trim();
  const match = String(plot?.plotNumber || '').match(/^([A-Za-z]+)/);
  return match?.[1]?.toUpperCase() || 'Unknown';
}

export function countPlotsByStatus(plots = []) {
  const counts = {};
  STATUS_KEYS.forEach((status) => {
    counts[status] = 0;
  });
  plots.forEach((plot) => {
    const status = plot.status || 'Available';
    if (counts[status] !== undefined) counts[status] += 1;
  });
  return counts;
}

export function buildBlockClusters(plots = [], blockLabels = []) {
  const byBlock = new Map();

  plots.forEach((plot) => {
    const blockName = resolvePlotBlockName(plot);
    if (!byBlock.has(blockName)) byBlock.set(blockName, []);
    byBlock.get(blockName).push(plot);
  });

  const labelByBlock = new Map(
    blockLabels.map((label) => [String(label.blockName || '').toUpperCase(), label])
  );

  return [...byBlock.entries()].map(([blockName, blockPlots]) => {
    const positions = blockPlots.flatMap((plot) => getPolygonPositions(plot.polygonPoints));
    let centerLat = null;
    let centerLng = null;

    if (positions.length) {
      const sum = positions.reduce(
        (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
        { lat: 0, lng: 0 }
      );
      centerLat = sum.lat / positions.length;
      centerLng = sum.lng / positions.length;
    }

    const savedLabel = labelByBlock.get(blockName.toUpperCase());
    if (savedLabel?.latitude != null && savedLabel?.longitude != null) {
      centerLat = savedLabel.latitude;
      centerLng = savedLabel.longitude;
    }

    const bounds = positions.length
      ? positions.reduce(
          (acc, [lat, lng]) => ({
            minLat: Math.min(acc.minLat, lat),
            maxLat: Math.max(acc.maxLat, lat),
            minLng: Math.min(acc.minLng, lng),
            maxLng: Math.max(acc.maxLng, lng),
          }),
          {
            minLat: Infinity,
            maxLat: -Infinity,
            minLng: Infinity,
            maxLng: -Infinity,
          }
        )
      : null;

    const statusCounts = countPlotsByStatus(blockPlots);

    return {
      id: `block-cluster-${blockName}`,
      blockName,
      label: `Block ${blockName}`,
      latitude: centerLat,
      longitude: centerLng,
      bounds,
      plotCount: blockPlots.length,
      statusCounts,
      plotIds: blockPlots.map((plot) => plot.id),
    };
  });
}

/**
 * Reduce plot-number label density at lower detail zoom levels.
 * Selected and highlighted plots always keep their labels.
 */
export function filterPlotLabelsForZoom(plots = [], zoom = 18, { alwaysShowIds = [] } = {}) {
  const always = new Set(alwaysShowIds.filter(Boolean));
  if (zoom >= 19) return plots;

  const minGap = zoom >= 18 ? 0.000045 : 0.00012;
  const accepted = [];
  const anchors = [];

  const sorted = [...plots].sort((a, b) => {
    if (always.has(a.id)) return -1;
    if (always.has(b.id)) return 1;
    return String(a.plotNumber || '').localeCompare(String(b.plotNumber || ''));
  });

  sorted.forEach((plot) => {
    if (always.has(plot.id)) {
      accepted.push(plot);
      anchors.push({ lat: Number(plot.latitude), lng: Number(plot.longitude) });
      return;
    }

    const lat = Number(plot.latitude);
    const lng = Number(plot.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const crowded = anchors.some(
      (anchor) => Math.abs(anchor.lat - lat) < minGap && Math.abs(anchor.lng - lng) < minGap
    );
    if (crowded) return;

    accepted.push(plot);
    anchors.push({ lat, lng });
  });

  return accepted;
}

export function computeBoundaryFromPlots(plots = []) {
  const positions = plots.flatMap((plot) => getPolygonPositions(plot.polygonPoints));
  if (positions.length < 3) return [];

  const bounds = positions.reduce(
    (acc, [lat, lng]) => ({
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );

  const { minLat, maxLat, minLng, maxLng } = bounds;
  return [
    { lat: minLat, lng: minLng },
    { lat: minLat, lng: maxLng },
    { lat: maxLat, lng: maxLng },
    { lat: maxLat, lng: minLng },
  ];
}

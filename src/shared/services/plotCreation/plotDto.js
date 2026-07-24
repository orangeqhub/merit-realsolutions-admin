export const PLOT_SOURCES = {
  GENERATOR: 'generator',
  EXCEL: 'excel',
};

export const PLOT_MODES = {
  APPEND: 'append',
  REPLACE: 'replace',
};

const PLOT_STATUSES = ['Available', 'Reserved', 'Booked', 'Sold', 'Blocked'];

function computeCentroid(points = []) {
  if (!points.length) return { latitude: null, longitude: null };
  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + Number(point.lat),
      lng: acc.lng + Number(point.lng),
    }),
    { lat: 0, lng: 0 }
  );
  return {
    latitude: sum.lat / points.length,
    longitude: sum.lng / points.length,
  };
}

function resolveBlockName(raw = {}) {
  if (raw.blockName) return String(raw.blockName).trim();
  const match = String(raw.plotNumber || '').match(/^([A-Za-z]+)/);
  return match?.[1]?.toUpperCase() || null;
}

function normalizeStatus(value) {
  const key = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  const map = {
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BOOKED: 'Booked',
    SOLD: 'Sold',
    BLOCKED: 'Blocked',
  };
  if (map[key]) return map[key];
  if (PLOT_STATUSES.includes(value)) return value;
  return 'Available';
}

/**
 * Canonical plot DTO used by generator save and excel import.
 */
export function normalizePlotInput(raw = {}, source = PLOT_SOURCES.EXCEL) {
  const polygonPoints = Array.isArray(raw.polygonPoints)
    ? raw.polygonPoints
    : Array.isArray(raw.coordinates)
      ? raw.coordinates
      : [];

  const areaSqYards = Number(raw.areaSqYards) || 0;
  const ratePerSqYard = Number(raw.ratePerSqYard) || 0;
  const latitude = raw.latitude != null ? Number(raw.latitude) : null;
  const longitude = raw.longitude != null ? Number(raw.longitude) : null;
  const centroid =
    latitude != null && longitude != null
      ? { latitude, longitude }
      : computeCentroid(polygonPoints);

  return {
    id: raw.id || null,
    plotNumber: String(raw.plotNumber || '').trim(),
    areaSqYards,
    ratePerSqYard,
    totalPrice: raw.totalPrice != null ? Number(raw.totalPrice) : areaSqYards * ratePerSqYard,
    finalPrice:
      raw.finalPrice != null
        ? Number(raw.finalPrice)
        : raw.totalPrice != null
          ? Number(raw.totalPrice)
          : areaSqYards * ratePerSqYard,
    status: normalizeStatus(raw.status),
    facing: String(raw.facing || 'East').trim() || 'East',
    shapeType: raw.shapeType || 'POLYGON',
    polygonPoints,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    mapWidth: raw.mapWidth ?? null,
    mapHeight: raw.mapHeight ?? null,
    metadata: {
      blockName: resolveBlockName(raw),
      row: raw.row ?? raw.metadata?.row ?? null,
      col: raw.col ?? raw.metadata?.col ?? null,
      rowNumber: raw.rowNumber ?? raw.metadata?.rowNumber ?? null,
      columnNumber: raw.columnNumber ?? raw.metadata?.columnNumber ?? null,
      dimensions: raw.dimensions ?? raw.metadata?.dimensions ?? null,
      roadWidthFeet: raw.roadWidthFeet ?? raw.metadata?.roadWidthFeet ?? null,
      plcType: raw.plcType ?? raw.metadata?.plcType ?? 'Open',
      cornerPlot: Boolean(raw.cornerPlot ?? raw.metadata?.cornerPlot),
      source: raw.metadata?.source || raw.source || source,
    },
    blockName: resolveBlockName(raw),
    row: raw.row ?? raw.metadata?.row ?? null,
    col: raw.col ?? raw.metadata?.col ?? null,
    rowNumber: raw.rowNumber ?? raw.metadata?.rowNumber ?? null,
    columnNumber: raw.columnNumber ?? raw.metadata?.columnNumber ?? null,
    dimensions: raw.dimensions ?? raw.metadata?.dimensions ?? null,
    roadWidthFeet: raw.roadWidthFeet ?? raw.metadata?.roadWidthFeet ?? null,
    plcType: raw.plcType ?? raw.metadata?.plcType ?? 'Open',
    cornerPlot: Boolean(raw.cornerPlot ?? raw.metadata?.cornerPlot),
    source: raw.metadata?.source || raw.source || source,
  };
}

export function normalizePlotBatch(rawPlots = [], source = PLOT_SOURCES.EXCEL) {
  return rawPlots.map((plot) => normalizePlotInput(plot, source));
}

export function mapApiPlotToDto(record = {}) {
  return normalizePlotInput(
    {
      ...record,
      blockName: record.blockName || record.metadata?.blockName,
      row: record.row ?? record.metadata?.row,
      col: record.col ?? record.metadata?.col,
      metadata: record.metadata || {},
    },
    record.metadata?.source || record.source || PLOT_SOURCES.EXCEL
  );
}

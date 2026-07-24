import {
  isValidLatitude,
  isValidLongitude,
  parseStrictCoordinate,
} from '../../shared/utils/geoValidation.js';
import { ALLOWED_IMPORT_STATUSES, STATUS_TO_APP } from './importConstants.js';

function normalizeStatus(raw) {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  return key;
}

function parseNumber(value, label, errors) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    errors.push(`${label} is required.`);
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    errors.push(`${label} must be a number.`);
    return null;
  }
  return n;
}

function parseCorner(value, axis, cornerLabel, errors) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    errors.push(`${cornerLabel} ${axis} is required.`);
    return null;
  }
  const n = parseStrictCoordinate(raw);
  if (n == null) {
    errors.push(`${cornerLabel} ${axis} must be a decimal degree (example: 16.555972).`);
    return null;
  }
  if (axis === 'Latitude' && !isValidLatitude(n)) {
    errors.push(`${cornerLabel} latitude must be between -90 and 90.`);
    return null;
  }
  if (axis === 'Longitude' && !isValidLongitude(n)) {
    errors.push(`${cornerLabel} longitude must be between -180 and 180.`);
    return null;
  }
  return n;
}

function buildPolygonPoints(row) {
  const corners = [
    { lat: row.corner1Lat, lng: row.corner1Lng, label: 'Corner 1' },
    { lat: row.corner2Lat, lng: row.corner2Lng, label: 'Corner 2' },
    { lat: row.corner3Lat, lng: row.corner3Lng, label: 'Corner 3' },
    { lat: row.corner4Lat, lng: row.corner4Lng, label: 'Corner 4' },
  ];
  const errors = [];
  const points = corners.map(({ lat, lng, label }) => ({
    lat: parseCorner(lat, 'Latitude', label, errors),
    lng: parseCorner(lng, 'Longitude', label, errors),
  }));

  if (errors.length) return { points: [], errors };

  return {
    points: points.map(({ lat, lng }) => ({ lat, lng })),
    errors: [],
  };
}

function computeCentroid(points) {
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export const PlotValidationService = {
  validateRows(rows, { layoutId, existingPlots = [] } = {}) {
    const existingNumbers = new Set(
      existingPlots
        .filter((p) => p.layoutId === layoutId)
        .map((p) => String(p.plotNumber ?? '').trim().toLowerCase())
        .filter(Boolean)
    );
    const fileNumbers = new Map();

    const results = rows.map((row) => {
      const errors = [];
      const rowNumber = row.__rowNumber ?? row.rowNumber;
      const plotNumber = String(row.plotNumber ?? '').trim();

      if (!plotNumber) {
        errors.push('Plot Number is required.');
      } else {
        const key = plotNumber.toLowerCase();
        if (existingNumbers.has(key)) {
          errors.push(`Plot Number "${plotNumber}" already exists in this layout.`);
        }
        if (fileNumbers.has(key)) {
          errors.push(`Duplicate Plot Number "${plotNumber}" in row ${fileNumbers.get(key)}.`);
        } else {
          fileNumbers.set(key, rowNumber);
        }
      }

      const areaSqYards = parseNumber(row.areaSqYards, 'Area', errors);
      if (areaSqYards != null && areaSqYards <= 0) {
        errors.push('Area must be greater than zero.');
      }

      const ratePerSqYard = parseNumber(row.ratePerSqYard, 'Price (Rate per sq.yd)', errors);
      if (ratePerSqYard != null && ratePerSqYard < 0) {
        errors.push('Price cannot be negative.');
      }

      const statusKey = normalizeStatus(row.status);
      if (!statusKey) {
        errors.push('Status is required.');
      } else if (!ALLOWED_IMPORT_STATUSES.includes(statusKey)) {
        errors.push(
          `Status must be one of: ${ALLOWED_IMPORT_STATUSES.join(', ')}.`
        );
      }

      const { points: polygonPoints, errors: cornerErrors } = buildPolygonPoints(row);
      errors.push(...cornerErrors);

      const centroid = polygonPoints.length === 4 ? computeCentroid(polygonPoints) : null;
      const facing = String(row.facing ?? '').trim() || 'East';
      const status = STATUS_TO_APP[statusKey] || null;

      return {
        rowNumber,
        plotNumber,
        areaSqYards,
        ratePerSqYard,
        status,
        statusKey,
        facing,
        polygonPoints,
        latitude: centroid?.lat ?? null,
        longitude: centroid?.lng ?? null,
        errors,
        valid: errors.length === 0,
      };
    });

    const validRows = results.filter((r) => r.valid);
    const invalidRows = results.filter((r) => !r.valid);

    return {
      results,
      validRows,
      invalidRows,
      summary: {
        total: results.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        duplicates: invalidRows.filter((r) =>
          r.errors.some((e) => e.includes('Duplicate') || e.includes('already exists'))
        ).length,
      },
    };
  },

  toPreviewPlot(row) {
    return {
      id: `preview-${row.rowNumber}`,
      plotNumber: row.plotNumber,
      status: row.status || 'Available',
      polygonPoints: row.polygonPoints,
      latitude: row.latitude,
      longitude: row.longitude,
      areaSqYards: row.areaSqYards,
      ratePerSqYard: row.ratePerSqYard,
      facing: row.facing,
      shapeType: 'POLYGON',
    };
  },
};

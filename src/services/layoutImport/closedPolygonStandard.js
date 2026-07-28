/**
 * GIS Township Workbook V2.1 — Closed Polygon Ring Standard
 * GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE
 *
 * All polygon geometry sheets must explicitly repeat the first vertex as the last row.
 * The validator enforces this — do not auto-close silently during validation.
 */

export const CLOSED_POLYGON_STANDARD_MARKER = 'GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE';

/** Sheets that store polygon rings (explicit closing coordinate required). */
export const CLOSED_POLYGON_SHEETS = Object.freeze([
  'Boundary',
  'Blocks',
  'PlotGeometry',
  'Amenities',
]);

/**
 * Sheets that use coordinates but are NOT closed polygon rings.
 * Roads = polyline centerlines; Entrances / Utilities (Point) / Landscaping (Point) = single points.
 */
export const NON_POLYGON_COORDINATE_SHEETS = Object.freeze([
  'Roads',
  'Entrances',
  'Utilities',
  'Landscaping',
]);

export const CLOSED_POLYGON_RULE_SUMMARY =
  'Every polygon ring must explicitly close: the last coordinate row must equal the first coordinate row (Sequence N = Sequence 1).';

export function closedPolygonErrorMessage(label, lastSequence = 'N') {
  return (
    `${label} polygon must be explicitly closed — Sequence ${lastSequence} must repeat `
    + 'the same Latitude and Longitude as Sequence 1.'
  );
}

/** Example ring for documentation and inline help (5 rows, row 5 closes row 1). */
export const CLOSED_POLYGON_EXAMPLE = Object.freeze({
  description: 'Rectangle with explicit closing vertex',
  rows: [
    { sequence: 1, latitude: 16.55665, longitude: 80.38235, note: 'Start / will repeat at Sequence 5' },
    { sequence: 2, latitude: 16.55665, longitude: 80.3885, note: '' },
    { sequence: 3, latitude: 16.5548, longitude: 80.3885, note: '' },
    { sequence: 4, latitude: 16.5548, longitude: 80.38235, note: '' },
    { sequence: 5, latitude: 16.55665, longitude: 80.38235, note: 'Must equal Sequence 1' },
  ],
});

const FEET_TO_METERS = 0.3048;
const METERS_PER_DEGREE_LAT = 111_320;

function feetToMeters(feet) {
  return Number(feet) * FEET_TO_METERS;
}

function metersToLatitudeDegrees(meters) {
  return meters / METERS_PER_DEGREE_LAT;
}

function metersToLongitudeDegrees(meters, latitude) {
  const latRad = (Number(latitude) * Math.PI) / 180;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latRad);
  if (metersPerDegreeLng <= 0) return 0;
  return meters / metersPerDegreeLng;
}

function offsetCoordinate(originLat, originLng, northFeet, eastFeet) {
  const lat =
    Number(originLat) + metersToLatitudeDegrees(feetToMeters(northFeet));
  const lng =
    Number(originLng) + metersToLongitudeDegrees(feetToMeters(eastFeet), originLat);
  return { lat, lng };
}

/**
 * Compute the four corners of a plot at grid position (row, col).
 * Origin is the south-west corner of plot (0, 0).
 */
export function generatePlotCorners({
  row,
  col,
  plotWidthFeet,
  plotHeightFeet,
  roadWidthFeet,
  originLat,
  originLng,
}) {
  const width = Number(plotWidthFeet);
  const height = Number(plotHeightFeet);
  const road = Number(roadWidthFeet) || 0;

  if (!Number.isFinite(width) || width <= 0) {
    throw new Error('Plot width must be greater than zero.');
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error('Plot height must be greater than zero.');
  }

  const baseEast = col * (width + road);
  const baseNorth = row * (height + road);

  const sw = offsetCoordinate(originLat, originLng, baseNorth, baseEast);
  const se = offsetCoordinate(originLat, originLng, baseNorth, baseEast + width);
  const ne = offsetCoordinate(originLat, originLng, baseNorth + height, baseEast + width);
  const nw = offsetCoordinate(originLat, originLng, baseNorth + height, baseEast);

  return [sw, se, ne, nw];
}

export function generateGridCornerOrigins({
  rows,
  columns,
  plotWidthFeet,
  plotHeightFeet,
  roadWidthFeet,
  originLat,
  originLng,
}) {
  const totalRows = Math.max(1, Math.floor(Number(rows) || 1));
  const totalCols = Math.max(1, Math.floor(Number(columns) || 1));
  const corners = [];

  for (let row = 0; row < totalRows; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      corners.push(
        generatePlotCorners({
          row,
          col,
          plotWidthFeet,
          plotHeightFeet,
          roadWidthFeet,
          originLat,
          originLng,
        })
      );
    }
  }

  return corners;
}

export { feetToMeters, metersToLatitudeDegrees, metersToLongitudeDegrees };

const FEET_TO_METERS = 0.3048;
const METERS_PER_DEGREE_LAT = 111_320;

export function feetToMeters(feet) {
  return Number(feet) * FEET_TO_METERS;
}

export function metersToLatitudeDegrees(meters) {
  return meters / METERS_PER_DEGREE_LAT;
}

export function metersToLongitudeDegrees(meters, latitude) {
  const latRad = (Number(latitude) * Math.PI) / 180;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latRad);
  if (metersPerDegreeLng <= 0) return 0;
  return meters / metersPerDegreeLng;
}

export function offsetCoordinate(originLat, originLng, northFeet, eastFeet) {
  const lat =
    Number(originLat) + metersToLatitudeDegrees(feetToMeters(northFeet));
  const lng =
    Number(originLng) +
    metersToLongitudeDegrees(feetToMeters(eastFeet), originLat);
  return { lat, lng };
}

/**
 * Build a closed polygon (SW → SE → NE → NW) from a south-west anchor in feet.
 */
export function rectangleFromFeet(
  originLat,
  originLng,
  southWestNorthFeet,
  southWestEastFeet,
  widthFeet,
  heightFeet
) {
  const sw = offsetCoordinate(
    originLat,
    originLng,
    southWestNorthFeet,
    southWestEastFeet
  );
  const se = offsetCoordinate(
    originLat,
    originLng,
    southWestNorthFeet,
    southWestEastFeet + widthFeet
  );
  const ne = offsetCoordinate(
    originLat,
    originLng,
    southWestNorthFeet + heightFeet,
    southWestEastFeet + widthFeet
  );
  const nw = offsetCoordinate(
    originLat,
    originLng,
    southWestNorthFeet + heightFeet,
    southWestEastFeet
  );
  return [sw, se, ne, nw];
}

export function getPlotNorthOffset(row, plotHeightFeet, roadWidthFeet, roadEveryRows) {
  const group = Math.floor(row / roadEveryRows);
  const rowInGroup = row % roadEveryRows;
  return (
    group * (roadEveryRows * plotHeightFeet + roadWidthFeet) +
    rowInGroup * plotHeightFeet
  );
}

export function getPlotEastOffset(col, plotWidthFeet, roadWidthFeet, roadEveryColumns) {
  const group = Math.floor(col / roadEveryColumns);
  const colInGroup = col % roadEveryColumns;
  return (
    group * (roadEveryColumns * plotWidthFeet + roadWidthFeet) +
    colInGroup * plotWidthFeet
  );
}

export function computeLayoutDimensions({
  rows,
  columns,
  plotWidthFeet,
  plotHeightFeet,
  roadWidthFeet,
  roadEveryRows,
  roadEveryColumns,
}) {
  const rowGroups = Math.ceil(rows / roadEveryRows);
  const colGroups = Math.ceil(columns / roadEveryColumns);
  const totalHeightFeet =
    rows * plotHeightFeet + Math.max(0, rowGroups - 1) * roadWidthFeet;
  const totalWidthFeet =
    columns * plotWidthFeet + Math.max(0, colGroups - 1) * roadWidthFeet;

  return {
    totalWidthFeet,
    totalHeightFeet,
    rowGroups,
    colGroups,
  };
}

export function computeSingleBlockDimensions(params) {
  const rows = Math.max(1, Math.floor(Number(params.rows) || 1));
  const columns = Math.max(1, Math.floor(Number(params.columns) || 1));
  const plotWidthFeet = Number(params.plotWidthFeet);
  const plotHeightFeet = Number(params.plotHeightFeet);
  const internalRoadWidth = Number(params.internalRoadWidth) || 30;
  const serviceRoadWidth = Number(params.serviceRoadWidth) || 20;
  const roadEveryRows = Math.max(1, Math.floor(Number(params.roadEveryRows) || 5));
  const roadEveryColumns = Math.max(1, Math.floor(Number(params.roadEveryColumns) || 8));
  const enableServiceRoads = Boolean(params.enableServiceRoads);

  const rowGroups = Math.ceil(rows / roadEveryRows);
  const colGroups = Math.ceil(columns / roadEveryColumns);

  const heightFeet =
    rows * plotHeightFeet + Math.max(0, rowGroups - 1) * internalRoadWidth;
  const widthFeet =
    columns * plotWidthFeet +
    Math.max(0, colGroups - 1) * (enableServiceRoads ? serviceRoadWidth : 0);

  return {
    rows,
    columns,
    plotWidthFeet,
    plotHeightFeet,
    internalRoadWidth,
    serviceRoadWidth,
    roadEveryRows,
    roadEveryColumns,
    enableServiceRoads,
    heightFeet,
    widthFeet,
    rowGroups,
    colGroups,
  };
}

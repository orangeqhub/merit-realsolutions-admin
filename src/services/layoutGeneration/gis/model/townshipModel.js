/**
 * Editable township model — every GIS object retains geometry for future editing.
 * Move road → blocks update; move boundary → roads update; resize block → plots regenerate.
 */
export function createTownshipModel() {
  return {
    boundary: null,
    entrance: null,
    roads: [],
    blocks: [],
    reservations: [],
    plots: [],
    amenities: [],
    landscape: [],
    blockLabels: [],
    roadGraph: null,
    statistics: null,
    metadata: {},
  };
}

export function createBlockEntity({
  id,
  blockName,
  blockPolygon,
  blockCenter,
  blockArea,
  shapeType,
  rotationDeg,
  roadExposure,
  frontage,
  editable = true,
}) {
  return {
    id,
    type: 'block',
    blockName,
    blockPolygon,
    blockCenter,
    blockArea,
    shapeType,
    rotationDeg,
    roadExposure,
    frontage,
    editable,
  };
}

export function createRoadEntity({
  id,
  roadType,
  hierarchy,
  polygon,
  rect,
  widthFeet,
  name,
  orientation,
  laneEdges = null,
  intersection = false,
  editable = true,
}) {
  return {
    id,
    type: 'road',
    roadType,
    hierarchy,
    polygon: polygon || rectToPoly(rect),
    rect,
    widthFeet,
    name,
    orientation,
    laneEdges,
    intersection,
    editable,
  };
}

export function createPlotEntity({
  id,
  plotNumber,
  blockName,
  polygon,
  center,
  areaSqFt,
  widthFeet,
  heightFeet,
  facing,
  cornerPlot,
  category,
  shapeType,
  editable = true,
}) {
  return {
    id,
    type: 'plot',
    plotNumber,
    blockName,
    worldPolygon: polygon,
    polygon,
    center,
    areaSqFt,
    widthFeet,
    heightFeet,
    facing,
    cornerPlot,
    category,
    shapeType,
    rect: polygonToBBox(polygon),
    editable,
  };
}

export function createReservationEntity({ id, type, polygon, rect, label, purpose }) {
  return {
    id,
    type: 'reservation',
    reservationType: type,
    polygon: polygon || rectToPoly(rect),
    rect,
    label,
    purpose,
    editable: true,
  };
}

function rectToPoly(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
}

function polygonToBBox(polygon) {
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
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

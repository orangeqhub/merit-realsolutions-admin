import { AMENITY_STYLES, AMENITY_TYPE_MAP, ROAD_TYPE_MAP } from './constants.js';
import {
  closePolygon,
  parsePolylineString,
  polylineToCorridorPolygon,
  pointsToPolylineString,
} from './polylineUtils.js';
import { ROAD_TYPES } from '../layoutGeneration/RoadGenerator.js';

function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function resolveRoadType(raw) {
  const key = normalizeKey(raw);
  return ROAD_TYPE_MAP[key] || ROAD_TYPES.INTERNAL;
}

function resolveAmenityType(raw) {
  const key = normalizeKey(raw);
  return AMENITY_TYPE_MAP[key] || key || 'openSpace';
}

function amenityLabel(type, fallback) {
  const labels = {
    park: 'Park',
    clubHouse: 'Club House',
    openSpace: 'Open Space',
    temple: 'Temple',
    swimmingPool: 'Swimming Pool',
    office: 'Office',
    utility: 'Utility',
  };
  return fallback || labels[type] || type;
}

export function mapRoadRecord(row, validationResult) {
  const points = validationResult?.points?.length
    ? validationResult.points
    : parsePolylineString(row.Polyline ?? row.polyline);
  const widthFt = Number(row.WidthFt ?? row.widthFt) || 30;
  const roadType = resolveRoadType(row.RoadType ?? row.roadType);
  const polygonPoints = points.length >= 3 && points.length <= 4
    ? closePolygon(points)
    : polylineToCorridorPolygon(points, widthFt);

  const roadId = String(row.RoadID ?? row.roadId ?? '').trim();
  const roadName = String(row.RoadName ?? row.roadName ?? roadId).trim();

  return {
    id: `import-road-${roadId}`,
    name: roadName,
    roadName,
    roadType,
    widthFeet: widthFt,
    roadWidth: widthFt,
    label: roadName,
    displayLabel: roadName,
    coordinates: points,
    polygonPoints,
    metadata: {
      roadColor: row.RoadColor ?? row.roadColor ?? null,
      sourceRoadId: roadId,
    },
  };
}

export function mapAmenityRecord(row, validationResult) {
  const amenityId = String(row.AmenityID ?? row.amenityId ?? '').trim();
  const type = resolveAmenityType(row.Type ?? row.type);
  const polygonPoints = validationResult?.polygonPoints?.length
    ? validationResult.polygonPoints
    : closePolygon(parsePolylineString(row.Polygon ?? row.polygon));
  const style = AMENITY_STYLES[type] || AMENITY_STYLES.openSpace;
  const label = String(row.Label ?? row.label ?? amenityLabel(type)).trim();

  return {
    id: `import-amenity-${amenityId}`,
    type,
    name: label,
    label,
    coordinates: polygonPoints,
    polygonPoints,
    style,
    metadata: { sourceAmenityId: amenityId },
  };
}

export function mapPlotRecord(row, layout, validationResult) {
  const plotNo = String(row.PlotNo ?? row.plotNo ?? '').trim();
  const polygonPoints = validationResult?.polygonPoints?.length
    ? validationResult.polygonPoints
    : closePolygon(parsePolylineString(row.Polygon ?? row.polygon));

  const areaSqYards = Number(row.AreaSqYd ?? row.areaSqYd) || 0;
  const ratePerSqYard = Number(row.Rate ?? row.rate) || 0;
  const widthFt = Number(row.WidthFt ?? row.widthFt);
  const depthFt = Number(row.DepthFt ?? row.depthFt);
  const dimensions =
    Number.isFinite(widthFt) && Number.isFinite(depthFt)
      ? `${widthFt} x ${depthFt} ft`
      : null;

  const latitude = row.Latitude ?? row.latitude;
  const longitude = row.Longitude ?? row.longitude;

  return {
    plotNumber: plotNo,
    blockName: String(row.Block ?? row.block ?? '').trim() || null,
    facing: String(row.Facing ?? row.facing ?? 'East').trim() || 'East',
    status: validationResult?.normalized?.status || 'Available',
    areaSqYards,
    ratePerSqYard,
    totalPrice: areaSqYards * ratePerSqYard,
    finalPrice: areaSqYards * ratePerSqYard,
    shapeType: 'POLYGON',
    polygonPoints,
    coordinates: polygonPoints,
    latitude: latitude !== '' && latitude != null ? Number(latitude) : null,
    longitude: longitude !== '' && longitude != null ? Number(longitude) : null,
    dimensions,
    roadWidthFeet: row.RoadWidth ?? row.roadWidth ?? null,
    cornerPlot: String(row.CornerPlot ?? row.cornerPlot ?? '').toLowerCase() === 'true'
      || row.CornerPlot === true
      || row.CornerPlot === 1,
    metadata: {
      owner: row.Owner ?? row.owner ?? null,
      remarks: row.Remarks ?? row.remarks ?? null,
      blockName: String(row.Block ?? row.block ?? '').trim() || null,
      widthFt: Number.isFinite(widthFt) ? widthFt : null,
      depthFt: Number.isFinite(depthFt) ? depthFt : null,
      source: 'layout-import',
    },
    source: 'layout-import',
    layoutId: layout?.id,
    ventureId: layout?.ventureId,
  };
}

export function mapLayoutMetadata(row = {}, layout = {}) {
  return {
    code: row.LayoutCode ?? row.layoutCode ?? layout.code ?? '',
    name: row.LayoutName ?? row.layoutName ?? layout.name ?? '',
    surveyNumber: row.SurveyNumber ?? row.surveyNumber ?? layout.surveyNumber ?? '',
    centerLatitude: row.CenterLatitude ?? row.centerLatitude ?? null,
    centerLongitude: row.CenterLongitude ?? row.centerLongitude ?? null,
    totalAreaAcres: row.TotalAreaAcres ?? row.totalAreaAcres ?? null,
    approvalNumber: row.ApprovalNo ?? row.approvalNo ?? null,
    approvalDate: row.ApprovalDate ?? row.approvalDate ?? null,
    defaultRate: row.DefaultRate ?? row.defaultRate ?? null,
    registrationCharge: row.RegistrationCharge ?? row.registrationCharge ?? null,
    developmentCharge: row.DevelopmentCharge ?? row.developmentCharge ?? null,
    styling: {
      roadColor: row.RoadColor ?? row.roadColor ?? null,
      plotColor: row.PlotColor ?? row.plotColor ?? null,
      mainRoadColor: row.MainRoadColor ?? row.mainRoadColor ?? null,
      boundaryColor: row.BoundaryColor ?? row.boundaryColor ?? null,
      backgroundOpacity: row.BackgroundOpacity ?? row.backgroundOpacity ?? null,
    },
  };
}

export function buildImportConfiguration(layoutMeta, parsed) {
  return {
    source: 'layout-import',
    importedAt: null,
    layoutMeta,
    fileName: parsed.fileName,
    styling: layoutMeta.styling,
    center: {
      lat: layoutMeta.centerLatitude,
      lng: layoutMeta.centerLongitude,
    },
  };
}

export function mapValidationToPreview(parsed, validation, layout) {
  const layoutMeta = mapLayoutMetadata(parsed.layoutRow, layout);

  const roads = (parsed.roads || []).map((row, index) =>
    mapRoadRecord(row, validation.roadResults[index])
  );
  const amenities = (parsed.amenities || []).map((row, index) =>
    mapAmenityRecord(row, validation.amenityResults[index])
  );
  const plots = (parsed.plots || []).map((row, index) =>
    mapPlotRecord(row, layout, validation.plotResults[index])
  );

  const configuration = buildImportConfiguration(layoutMeta, parsed);

  return {
    layoutMeta,
    roads,
    amenities,
    plots,
    configuration,
    blockLabels: [],
    summary: {
      plots: plots.length,
      roads: roads.length,
      amenities: amenities.length,
      blocks: 0,
    },
  };
}

/** Reverse map for export */
function parseDimensionsFt(dimensions) {
  if (!dimensions) return { widthFt: '', depthFt: '' };
  const match = String(dimensions).match(/([\d.]+)\s*x\s*([\d.]+)/i);
  if (!match) return { widthFt: '', depthFt: '' };
  return { widthFt: match[1], depthFt: match[2] };
}

export function plotToExportRow(plot) {
  const points = plot.polygonPoints || plot.coordinates || [];
  const fromDimensions = parseDimensionsFt(plot.dimensions);
  return {
    PlotNo: plot.plotNumber,
    Block: plot.blockName || plot.metadata?.blockName || '',
    Facing: plot.facing || '',
    Status: plot.status || 'Available',
    AreaSqYd: plot.areaSqYards ?? '',
    WidthFt: plot.metadata?.widthFt ?? fromDimensions.widthFt ?? '',
    DepthFt: plot.metadata?.depthFt ?? fromDimensions.depthFt ?? '',
    Rate: plot.ratePerSqYard ?? '',
    Latitude: plot.latitude ?? '',
    Longitude: plot.longitude ?? '',
    Polygon: pointsToPolylineString(points),
    Owner: plot.metadata?.owner ?? '',
    CornerPlot: plot.cornerPlot ? 'TRUE' : 'FALSE',
    RoadWidth: plot.roadWidthFeet ?? plot.metadata?.roadWidthFeet ?? '',
    Remarks: plot.metadata?.remarks ?? '',
  };
}

export function roadToExportRow(road) {
  const points = road.coordinates || road.polygonPoints || [];
  return {
    RoadID: road.metadata?.sourceRoadId || road.id,
    RoadName: road.roadName || road.name,
    RoadType: road.roadType,
    WidthFt: road.widthFeet ?? road.roadWidth,
    Polyline: pointsToPolylineString(points),
    RoadColor: road.metadata?.roadColor ?? '',
  };
}

export function amenityToExportRow(amenity) {
  return {
    AmenityID: amenity.metadata?.sourceAmenityId || amenity.id,
    Type: amenity.type,
    Polygon: pointsToPolylineString(amenity.polygonPoints || amenity.coordinates || []),
    Label: amenity.label || amenity.name,
  };
}

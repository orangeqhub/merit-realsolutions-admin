import { offsetCoordinate } from '../geoUtils.js';
import { formatRoadLabel, formatRoadName, ROAD_TYPES } from '../RoadGenerator.js';
import { getAmenityStyle } from './amenityPlanner.js';
import { bboxFromPolygon } from './geometry.js';
import { polygonCentroid } from './polygonGeometry.js';
import { formatPremiumRoadLabel } from '@map-rendering/road-engine/PremiumRoadGenerator.js';

/**
 * Convert feet-space township model to lat/lng schema compatible with PremiumMapRenderer.
 */
export function adaptTownshipOutput(model, originLat, originLng) {
  const { boundary, roads, plots, amenities, blockLabels, entrance, metadata } = model;
  const bbox = bboxFromPolygon(boundary.points);
  const centerOffsetNorthFeet = bbox.minY;
  const centerOffsetEastFeet = bbox.minX;

  const feetToLatLng = (x, y) => offsetCoordinate(originLat, originLng, y, x);

  const feetPolygonToLatLng = (polygon) =>
    polygon.map((p) => feetToLatLng(p.x, p.y));

  const rectToLatLng = (rect) => {
    const sw = feetToLatLng(rect.x, rect.y);
    const se = feetToLatLng(rect.x + rect.w, rect.y);
    const ne = feetToLatLng(rect.x + rect.w, rect.y + rect.h);
    const nw = feetToLatLng(rect.x, rect.y + rect.h);
    return [sw, se, ne, nw];
  };

  const polygonCentroidLatLng = (polygon) => {
    const c = polygonCentroid(polygon);
    return feetToLatLng(c.x, c.y);
  };

  const adaptedRoads = roads.map((road) => {
    const widthFeet = road.widthFeet || 30;
    const roadType = road.roadType || 'internal';

    const centerlineLatLng = Array.isArray(road.centerline) && road.centerline.length >= 2
      ? road.centerline.map((p) => feetToLatLng(p.x, p.y))
      : null;

    const polygonFromPremium = Array.isArray(road.polygon) && road.polygon.length >= 3
      && road.polygon[0]?.x != null
      ? feetPolygonToLatLng(road.polygon)
      : null;

    const polygonLatLng = polygonFromPremium?.length >= 3
      ? polygonFromPremium
      : rectToLatLng(road.rect);

    const centerlineCoords = centerlineLatLng?.length >= 2
      ? centerlineLatLng
      : polygonLatLng;

    const label = road.label || formatPremiumRoadLabel({ roadType, widthFeet }) || formatRoadLabel(
      roadType === 'main' ? ROAD_TYPES.MAIN : ROAD_TYPES.INTERNAL,
      widthFeet
    );

    return {
      id: road.id,
      name: road.name || formatRoadName(roadType === 'main' ? ROAD_TYPES.MAIN : ROAD_TYPES.INTERNAL, widthFeet),
      roadName: road.name,
      roadType,
      type: road.orientation || 'horizontal',
      direction: road.orientation || 'horizontal',
      widthFeet,
      widthMeters: road.widthMeters,
      roadWidth: widthFeet,
      blockName: road.blockName || '',
      coordinates: centerlineCoords,
      centerline: centerlineLatLng,
      polygonPoints: polygonLatLng.map(({ lat, lng }) => ({ lat, lng })),
      lengthFeet: road.lengthFeet,
      lengthMeters: road.lengthMeters,
      connectedRoads: road.connectedRoads || [],
      label,
      displayLabel: road.displayLabel || `${label}\n${Math.round(widthFeet)} FT`,
      premium: Boolean(road.premium),
    };
  });

  const adaptedPlots = plots.map((plot) => {
    const coordinates = plot.worldPolygon?.length
      ? feetPolygonToLatLng(plot.worldPolygon)
      : rectToLatLng(plot.rect);
    const centroid = plot.worldPolygon?.length
      ? polygonCentroidLatLng(plot.worldPolygon)
      : feetToLatLng(plot.rect.x + plot.rect.w / 2, plot.rect.y + plot.rect.h / 2);
    const areaSqYards = Math.round(((plot.widthFeet * plot.heightFeet) / 9) * 100) / 100;
    const rate = Number(plot.ratePerSqYard) || 0;

    return {
      id: plot.id,
      plotNumber: plot.plotNumber,
      blockName: plot.blockName,
      coordinates,
      polygonPoints: coordinates.map(({ lat, lng }) => ({ lat, lng })),
      latitude: centroid.lat,
      longitude: centroid.lng,
      row: plot.row ?? 0,
      col: plot.col ?? 0,
      rowNumber: (plot.row ?? 0) + 1,
      columnNumber: (plot.col ?? 0) + 1,
      status: 'Available',
      shapeType: plot.shapeType || 'POLYGON',
      areaSqYards,
      dimensions: `${Math.round(plot.widthFeet)} × ${Math.round(plot.heightFeet)} ft`,
      mapWidth: plot.widthFeet,
      mapHeight: plot.heightFeet,
      facing: plot.facing || inferFacing(plot, bbox),
      roadWidthFeet: 30,
      plcType: plot.plcType || (plot.cornerPlot ? 'Corner' : 'Open'),
      cornerPlot: Boolean(plot.cornerPlot),
      plotType: plot.plotType || plot.category || 'Residential',
      ratePerSqYard: rate,
      totalPrice: rate > 0 ? Math.round(rate * areaSqYards) : 0,
      finalPrice: rate > 0 ? Math.round(rate * areaSqYards) : 0,
    };
  });

  const adaptedAmenities = amenities.map((a) => {
    const coordinates = rectToLatLng(a.rect);
    const style = getAmenityStyle(a.type);
    return {
      id: a.id,
      type: a.type,
      name: a.name,
      label: a.label,
      heightFeet: a.rect.h,
      widthFeet: a.rect.w,
      coordinates,
      polygonPoints: coordinates.map(({ lat, lng }) => ({ lat, lng })),
      style,
    };
  });

  const adaptedBlockLabels = blockLabels.map((bl) => {
    const pos = feetToLatLng(bl.center.x, bl.center.y);
    return {
      id: `block-label-${bl.blockName}`,
      blockName: bl.blockName,
      label: `Block ${bl.blockName}`,
      latitude: pos.lat,
      longitude: pos.lng,
      plotCount: bl.plotCount,
    };
  });

  const boundaryCoords = boundary.points.map((pt) => feetToLatLng(pt.x, pt.y));
  const closedBoundary = [...boundaryCoords, boundaryCoords[0]];

  const footprint = {
    totalWidthFeet: boundary.widthFeet,
    totalHeightFeet: boundary.heightFeet,
    centerOffsetNorthFeet,
    centerOffsetEastFeet,
  };

  return {
    plots: adaptedPlots,
    roads: adaptedRoads,
    amenities: adaptedAmenities,
    blockLabels: adaptedBlockLabels,
    blockNames: blockLabels.map((b) => b.blockName),
    boundary: closedBoundary,
    boundaryPolygon: closedBoundary.map(({ lat, lng }) => ({ lat, lng })),
    footprint,
    metadata: {
      ...metadata,
      entrance: {
        gate: rectToLatLng(entrance.gate),
        plaza: rectToLatLng(entrance.plaza),
      },
    },
  };
}

function inferFacing(plot, bbox) {
  const cx = plot.rect.x + plot.rect.w / 2;
  const cy = plot.rect.y + plot.rect.h / 2;
  const midX = (bbox.minX + bbox.maxX) / 2;
  const midY = (bbox.minY + bbox.maxY) / 2;
  const dx = cx - midX;
  const dy = cy - midY;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'East' : 'West';
  return dy > 0 ? 'North' : 'South';
}

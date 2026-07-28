import { bboxFromPolygon } from '../../township/geometry.js';

/**
 * STEP 13 — Township statistics for preview and save metadata.
 */
export function computeGisTownshipStatistics(model, boundary) {
  const bbox = bboxFromPolygon(boundary.points);
  const totalAreaSqFt = boundary.widthFeet * boundary.heightFeet;

  let saleableAreaSqFt = 0;
  let cornerCount = 0;
  let commercialCount = 0;

  model.plots.forEach((plot) => {
    saleableAreaSqFt += plot.areaSqFt || plot.widthFeet * plot.heightFeet;
    if (plot.cornerPlot) cornerCount += 1;
    if (plot.category === 'commercial' || plot.plotType === 'Commercial') commercialCount += 1;
  });

  let roadAreaSqFt = 0;
  let roadLengthFeet = 0;
  model.roads.forEach((road) => {
    roadAreaSqFt += road.rect.w * road.rect.h;
    roadLengthFeet += Math.max(road.rect.w, road.rect.h);
  });

  let amenityAreaSqFt = 0;
  model.amenities.forEach((a) => {
    amenityAreaSqFt += a.rect.w * a.rect.h;
  });

  let landscapeAreaSqFt = 0;
  (model.landscape || []).forEach((l) => {
    if (l.rect) landscapeAreaSqFt += l.rect.w * l.rect.h;
  });

  const openSpaceAreaSqFt = amenityAreaSqFt + landscapeAreaSqFt;
  const sqYds = (sqFt) => Math.round((sqFt / 9) * 100) / 100;
  const pct = (part, whole) => Math.round((part / whole) * 10000) / 100;

  return {
    totalAreaSqYds: sqYds(totalAreaSqFt),
    saleableAreaSqYds: sqYds(saleableAreaSqFt),
    roadAreaSqYds: sqYds(roadAreaSqFt),
    amenityAreaSqYds: sqYds(amenityAreaSqFt),
    openSpaceAreaSqYds: sqYds(openSpaceAreaSqFt),
    landscapeAreaSqYds: sqYds(landscapeAreaSqFt),
    roadPercent: pct(roadAreaSqFt, totalAreaSqFt),
    amenityPercent: pct(amenityAreaSqFt, totalAreaSqFt),
    openSpacePercent: pct(openSpaceAreaSqFt, totalAreaSqFt),
    commercialPercent: pct(commercialCount, model.plots.length || 1),
    plotCount: model.plots.length,
    cornerPlotCount: cornerCount,
    blockCount: model.blocks.length,
    roadCount: model.roads.length,
    amenityCount: model.amenities.length,
    roadLengthFeet: Math.round(roadLengthFeet),
    boundaryVertices: boundary.points.length,
    bbox,
  };
}

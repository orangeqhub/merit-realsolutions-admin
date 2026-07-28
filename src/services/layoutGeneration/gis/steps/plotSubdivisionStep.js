import { pickPlotSize } from '../../township/presets.js';
import {
  insetPolygon,
  toLocalPoint,
  localRectToWorldPolygon,
  pointInPolygon,
  polygonCentroid,
  polygonBBox,
  degToRad,
} from '../../township/polygonGeometry.js';
import { GisSpatialIndex, rectToBBox } from '../core/spatialIndex.js';
import { createPlotEntity } from '../model/townshipModel.js';

/**
 * STEP 6 — Subdivide each block independently with varied plot sizes and orientations.
 */
export function subdivideBlocksIntoPlots(blocks, roadNetwork, reservations, config) {
  const spatial = new GisSpatialIndex(45);

  roadNetwork.roads.forEach((r) => spatial.insert(r.id, rectToBBox(r.rect)));
  reservations.forEach((res) => spatial.insert(res.id, rectToBBox(res.rect)));

  const allPlots = [];
  const blockLabels = [];

  blocks.forEach((block) => {
    const plots = packBlock(block, spatial, config);
    allPlots.push(...plots);
    blockLabels.push({
      blockName: block.blockName,
      center: block.blockCenter,
      plotCount: plots.length,
      rotationDeg: block.rotationDeg,
    });
  });

  return { plots: allPlots, blockLabels };
}

function packBlock(block, spatial, config) {
  const { blockPolygon, blockCenter, blockName, rotationDeg } = block;
  const rotationRad = degToRad(rotationDeg || 0);
  const inner = insetPolygon(blockPolygon, 14);
  const localBounds = inner.map((p) => toLocalPoint(p.x, p.y, blockCenter, rotationRad));
  const lb = polygonBBox(localBounds);
  const plots = [];
  const gap = config.rng.int(28, 38);
  let row = 0;
  let localY = lb.minY + 6;

  while (localY + 28 < lb.maxY - 6) {
    let localX = lb.minX + 6;
    let col = 0;

    while (localX + 28 < lb.maxX - 6) {
      let size = pickPlotSize(config.rng);
      if (config.rng.bool(0.07) && block.roadExposure > 1) {
        size = pickPlotSize(config.rng, 'commercial');
      }
      if (config.rng.bool(0.04)) {
        size = pickPlotSize(config.rng, 'villa');
      }
      if (config.rng.bool(0.06)) {
        size = { w: size.w + config.rng.int(-5, 8), h: size.h + config.rng.int(-5, 8), category: 'irregular' };
      }

      const remainingW = lb.maxX - localX - 6;
      const remainingH = lb.maxY - localY - 6;
      if (size.w > remainingW) size = { ...size, w: Math.max(28, Math.floor(remainingW / 10) * 10) };
      if (size.h > remainingH) size = { ...size, h: Math.max(28, Math.min(size.h, Math.floor(remainingH / 10) * 10)) };

      const worldPoly = localRectToWorldPolygon(localX, localY, size.w, size.h, blockCenter, rotationRad);
      const wc = polygonCentroid(worldPoly);
      if (!pointInPolygon(wc.x, wc.y, inner)) {
        localX += 10;
        continue;
      }

      const probe = rectToBBox({ x: wc.x - size.w / 2, y: wc.y - size.h / 2, w: size.w, h: size.h });
      if (spatial.overlaps(`plot-${blockName}-${row}-${col}`, probe, 2)) {
        localX += 8;
        continue;
      }

      const facing = inferFacing(wc, blockCenter, rotationDeg);
      const plot = createPlotEntity({
        id: `generated-${blockName}-pending-${row}-${col}`,
        plotNumber: '',
        blockName,
        polygon: worldPoly,
        center: wc,
        areaSqFt: size.w * size.h,
        widthFeet: size.w,
        heightFeet: size.h,
        facing,
        cornerPlot: false,
        category: size.category || 'residential',
        shapeType: size.category === 'irregular' ? 'TRAPEZOID' : 'POLYGON',
      });

      plot.row = row;
      plot.col = col;
      plot.blockRotationDeg = rotationDeg;
      plot.rect = { x: probe.minX, y: probe.minY, w: probe.maxX - probe.minX, h: probe.maxY - probe.minY };

      spatial.insert(plot.id, probe);
      plots.push(plot);
      localX += size.w + (col % 3 === 2 ? gap * 0.4 : config.rng.int(3, 8));
      col += 1;
    }

    const rowH = 30 + config.rng.int(0, 15);
    localY += rowH + (row % 2 === 1 ? gap * 0.35 : config.rng.int(4, 8));
    row += 1;
  }

  markCornerPlots(plots, inner, config);
  return plots;
}

function inferFacing(center, blockCenter, rotationDeg) {
  const dx = center.x - blockCenter.x;
  const dy = center.y - blockCenter.y;
  const angle = Math.atan2(dy, dx) + degToRad(rotationDeg || 0);
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  if (deg >= 45 && deg < 135) return 'North';
  if (deg >= 135 && deg < 225) return 'West';
  if (deg >= 225 && deg < 315) return 'South';
  return 'East';
}

function markCornerPlots(plots, blockPoly, config) {
  if (plots.length < 3) return;
  const bb = polygonBBox(blockPoly);
  const corners = plots.filter((p) => {
    const c = p.center;
    const edge = Math.min(c.x - bb.minX, bb.maxX - c.x, c.y - bb.minY, bb.maxY - c.y);
    return edge < 35;
  });
  const limit = Math.max(1, Math.floor(plots.length * (config.cornerPlotPercent / 100)));
  config.rng.shuffle(corners).slice(0, limit).forEach((p) => {
    p.cornerPlot = true;
    p.plcType = 'Corner';
  });
}

import { bboxFromPolygon, pointInPolygon, SpatialGrid, rectsOverlap } from './geometry.js';
import { buildIrregularBlockPolygon, polygonBBox, polygonCentroid } from './polygonGeometry.js';
import { deformParcelRect } from './amenityInfluence.js';
import { pickPlotSize } from './presets.js';
import {
  localRectToWorldPolygon,
  toLocalPoint,
  pointInPolygon as pip,
  insetPolygon,
} from './polygonGeometry.js';

const CELL = 35;

/**
 * Road-first parcel subdivision → irregular rotated blocks → organic plot packing.
 */
export function generateOrganicBlocksAndPlots(boundary, roadNetwork, entrance, config, options = {}) {
  const { influenceZones = [], exclusionRects = [], landscapeBuffers = [] } = options;
  const { roads, bbox } = roadNetwork;

  const parcels = subdivideParcelsFromRoads(boundary, roads, exclusionRects, landscapeBuffers, config);
  const spatial = new SpatialGrid(50);
  roads.forEach((r) => spatial.insert(r.id, r.rect));
  exclusionRects.forEach((r) => spatial.insert(r.id || 'ex', r));
  landscapeBuffers.forEach((b) => spatial.insert(b.id, b.rect));

  const allPlots = [];
  const blocks = [];
  const blockLabels = [];
  let plotSerial = config.startingPlotNumber;

  parcels.forEach((parcel, index) => {
    const blockName = String.fromCharCode(config.blockPrefix.charCodeAt(0) + index);
    const deformedRect = deformParcelRect(parcel.baseRect, influenceZones, config.rng, index);
    const irregular = buildIrregularBlockPolygon(deformedRect, config.rng, index);

    const block = {
      id: index,
      blockName,
      ...irregular,
      baseRect: deformedRect,
      parcelIndex: index,
      roadExposure: parcel.roadExposure,
      frontage: parcel.frontage,
    };
    blocks.push(block);

    const plots = packPlotsInBlock(block, blockName, spatial, config, plotSerial);
    plotSerial += plots.length;
    allPlots.push(...plots);

    const center = polygonCentroid(block.polygon);
    blockLabels.push({
      blockName,
      center,
      plotCount: plots.length,
      rotationDeg: block.rotationDeg,
    });
  });

  markCommercialPlots(allPlots, entrance, roads, config);
  markCornerPlots(allPlots, blocks, config);

  return {
    blocks,
    plots: allPlots,
    blockLabels,
    blockNames: blocks.map((b) => b.blockName),
    parcels,
  };
}

function subdivideParcelsFromRoads(boundary, roads, exclusions, buffers, config) {
  const bbox = bboxFromPolygon(boundary.points);
  const cols = Math.ceil((bbox.maxX - bbox.minX) / CELL);
  const rows = Math.ceil((bbox.maxY - bbox.minY) / CELL);

  const blocked = new Uint8Array(cols * rows);

  const markRect = (rect, val = 1) => {
    const c0 = Math.max(0, Math.floor((rect.x - bbox.minX) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((rect.x + rect.w - bbox.minX) / CELL));
    const r0 = Math.max(0, Math.floor((rect.y - bbox.minY) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((rect.y + rect.h - bbox.minY) / CELL));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        blocked[r * cols + c] = val;
      }
    }
  };

  roads.forEach((road) => markRect(expandRect(road.rect, 4), 1));
  exclusions.forEach((ex) => markRect(ex, 1));
  buffers.forEach((b) => markRect(b.rect, 1));

  const parcels = [];
  const grid = new Int16Array(cols * rows).fill(-1);
  let parcelId = 0;
  const queue = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const idx = r * cols + c;
      if (grid[idx] >= 0 || blocked[idx]) continue;
      const wx = bbox.minX + c * CELL + CELL / 2;
      const wy = bbox.minY + r * CELL + CELL / 2;
      if (!pointInPolygon(wx, wy, boundary.points)) continue;

      grid[idx] = parcelId;
      queue.push(idx);
      let minC = c;
      let maxC = c;
      let minR = r;
      let maxR = r;
      let cells = 0;

      while (queue.length) {
        const cur = queue.pop();
        cells += 1;
        const cr = Math.floor(cur / cols);
        const cc = cur % cols;
        minC = Math.min(minC, cc);
        maxC = Math.max(maxC, cc);
        minR = Math.min(minR, cr);
        maxR = Math.max(maxR, cr);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) return;
          const ni = nr * cols + nc;
          if (grid[ni] >= 0 || blocked[ni]) return;
          const nx = bbox.minX + nc * CELL + CELL / 2;
          const ny = bbox.minY + nr * CELL + CELL / 2;
          if (!pointInPolygon(nx, ny, boundary.points)) return;
          grid[ni] = parcelId;
          queue.push(ni);
        });
      }

      if (cells < (config.densityKey === 'high' ? 8 : 12)) continue;

      const baseRect = {
        x: bbox.minX + minC * CELL + 6,
        y: bbox.minY + minR * CELL + 6,
        w: (maxC - minC + 1) * CELL - 12,
        h: (maxR - minR + 1) * CELL - 12,
      };
      if (baseRect.w < 90 || baseRect.h < 70) continue;

      const roadExposure = countRoadExposure(baseRect, roads);
      parcels.push({
        id: parcelId,
        baseRect,
        cells,
        roadExposure,
        frontage: baseRect.w + config.rng.int(-40, 60),
      });
      parcelId += 1;
    }
  }

  parcels.sort((a, b) => b.cells - a.cells);
  const maxParcels = config.densityKey === 'high' ? 10 : config.densityKey === 'low' ? 5 : 7;
  const selected = parcels.slice(0, maxParcels);

  ensureParcelVariety(selected, config.rng);
  return selected;
}

function ensureParcelVariety(parcels, rng) {
  parcels.forEach((p, i) => {
    p.varietySeed = rng.int(1000, 9999) + i * 137;
    if (i > 0 && p.cells === parcels[i - 1].cells) {
      p.baseRect.w += rng.int(15, 45) * (rng.bool(0.5) ? 1 : -1);
    }
  });
}

function countRoadExposure(rect, roads) {
  let count = 0;
  roads.forEach((road) => {
    if (rectsOverlap(rect, expandRect(road.rect, 20), 0)) count += 1;
  });
  return count;
}

function packPlotsInBlock(block, blockName, spatial, config, startSerial) {
  const { polygon, center, rotationRad } = block;
  const inner = insetPolygon(polygon, 12);
  const localBounds = inner.map((p) => toLocalPoint(p.x, p.y, center, rotationRad));
  const lb = polygonBBox(localBounds);
  const plots = [];
  let serial = startSerial;
  let row = 0;
  let localY = lb.minY + 8;
  const gap = config.roadWidths.internal;

  while (localY + 28 < lb.maxY - 8) {
    let localX = lb.minX + 8;
    let col = 0;
    const rowPlots = [];

    while (localX + 28 < lb.maxX - 8) {
      let size = pickPlotSize(config.rng);
      if (config.rng.bool(0.08) && block.roadExposure > 1) {
        size = pickPlotSize(config.rng, 'commercial');
      }
      if (config.rng.bool(0.05)) {
        size = pickPlotSize(config.rng, 'villa');
      }

      const remainingW = lb.maxX - localX - 8;
      const remainingH = lb.maxY - localY - 8;
      if (size.w > remainingW) size = { ...size, w: Math.max(28, Math.floor(remainingW / 10) * 10) };
      if (size.h > remainingH) size = { ...size, h: Math.max(28, Math.min(size.h, Math.floor(remainingH / 10) * 10)) };

      const worldPoly = localRectToWorldPolygon(localX, localY, size.w, size.h, center, rotationRad);
      const wc = polygonCentroid(worldPoly);
      if (!pip(wc.x, wc.y, inner)) {
        localX += 12;
        continue;
      }

      const wb = polygonBBox(worldPoly);
      const probe = { x: wb.minX, y: wb.minY, w: wb.w, h: wb.h };
      if (spatial.overlapsAny(probe, 2)) {
        localX += 10;
        continue;
      }

      const plotNumber = `${blockName}${serial}`;
      serial += 1;
      const plot = {
        id: `generated-${blockName}-${plotNumber}`,
        plotNumber,
        blockName,
        row,
        col,
        worldPolygon: worldPoly,
        rect: probe,
        widthFeet: size.w,
        heightFeet: size.h,
        category: size.category || 'residential',
        shapeType: block.shapeType,
        blockRotationDeg: block.rotationDeg,
      };

      spatial.insert(plot.id, probe);
      rowPlots.push(plot);
      localX += size.w + (col % 4 === 3 ? gap * 0.35 : config.rng.int(3, 7));
      col += 1;
    }

    plots.push(...rowPlots);
    const rowH = rowPlots.reduce((m, p) => Math.max(m, p.heightFeet), 28);
    localY += rowH + (row % 2 === 1 ? gap * 0.4 : config.rng.int(4, 9));
    row += 1;
  }

  return plots;
}

function markCommercialPlots(plots, entrance, roads, config) {
  const threshold = config.commercialPercent / 100;
  const candidates = plots.filter((plot) => {
    const c = polygonCentroid(plot.worldPolygon || rectToPolyFromRect(plot.rect));
    const dist = Math.hypot(c.x - entrance.connectPoint.x, c.y - entrance.connectPoint.y);
    const nearRoad = roads.some((r) => r.roadType === 'main' && rectsOverlap(plot.rect, expandRect(r.rect, 35), 0));
    return dist < 380 || nearRoad;
  });
  const count = Math.max(1, Math.floor(plots.length * threshold));
  config.rng.shuffle(candidates).slice(0, count).forEach((p) => {
    p.category = 'commercial';
    p.plotType = 'Commercial';
  });
}

function markCornerPlots(plots, blocks, config) {
  blocks.forEach((block) => {
    const blockPlots = plots.filter((p) => p.blockName === block.blockName);
    if (blockPlots.length < 3) return;
    const poly = block.polygon;
    const corners = blockPlots.filter((p) => {
      const c = polygonCentroid(p.worldPolygon);
      const bb = polygonBBox(poly);
      const edgeDist = Math.min(
        c.x - bb.minX,
        bb.maxX - c.x,
        c.y - bb.minY,
        bb.maxY - c.y
      );
      return edgeDist < 35;
    });
    const limit = Math.max(1, Math.floor(blockPlots.length * (config.cornerPlotPercent / 100)));
    config.rng.shuffle(corners).slice(0, limit).forEach((p) => {
      p.cornerPlot = true;
      p.plcType = 'Corner';
    });
  });
}

function expandRect(rect, m) {
  return { x: rect.x - m, y: rect.y - m, w: rect.w + m * 2, h: rect.h + m * 2 };
}

function rectToPolyFromRect(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
}

// re-export for legacy import path
export { generateOrganicBlocksAndPlots as generateBlocksAndPlots };

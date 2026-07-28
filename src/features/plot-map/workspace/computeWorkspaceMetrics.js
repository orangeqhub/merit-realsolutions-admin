import { formatINR } from '../../../pages/plotInventory/constants';
import { countPlotsByStatus } from '../utils/mapHelpers';

function plotPrice(plot) {
  const rate = Number(plot.ratePerSqYard) || 0;
  const area = Number(plot.areaSqYards) || 0;
  return Number(plot.finalPrice || plot.totalPrice || (rate && area ? rate * area : 0)) || 0;
}

function plotArea(plot) {
  return Number(plot.areaSqYards) || 0;
}

/** Presentation-only metrics from existing plot records. */
export function computeWorkspaceMetrics(plots = []) {
  const counts = countPlotsByStatus(plots);
  const total = plots.length;
  const bookedLike = (counts.Booked || 0) + (counts.Sold || 0) + (counts.Reserved || 0);
  const available = counts.Available || 0;

  let areaSold = 0;
  let areaAvailable = 0;
  let inventoryValue = 0;
  let revenue = 0;
  let areaSum = 0;
  let largest = 0;
  let smallest = Infinity;

  plots.forEach((plot) => {
    const area = plotArea(plot);
    const price = plotPrice(plot);
    areaSum += area;
    if (area > largest) largest = area;
    if (area > 0 && area < smallest) smallest = area;

    if (plot.status === 'Available') {
      areaAvailable += area;
      inventoryValue += price;
    } else if (plot.status === 'Sold' || plot.status === 'Booked') {
      areaSold += area;
      revenue += price;
    } else if (plot.status === 'Reserved') {
      inventoryValue += price;
    } else {
      inventoryValue += price;
    }
  });

  if (smallest === Infinity) smallest = 0;

  const bookingPct = total ? Math.round((bookedLike / total) * 100) : 0;
  const reservationPct = total ? Math.round(((counts.Reserved || 0) / total) * 100) : 0;

  return {
    counts,
    total,
    available,
    booked: counts.Booked || 0,
    reserved: counts.Reserved || 0,
    sold: counts.Sold || 0,
    blocked: counts.Blocked || 0,
    mortgaged: 0,
    registered: counts.Sold || 0,
    revenue,
    revenueLabel: formatINR(revenue),
    inventoryValue,
    inventoryValueLabel: formatINR(inventoryValue),
    bookingPct,
    reservationPct,
    areaSold,
    areaAvailable,
    averagePlotSize: total ? Math.round(areaSum / total) : 0,
    largestPlot: largest,
    smallestPlot: smallest,
  };
}

export function applyPresentationFilters(plots = [], filters = {}) {
  const {
    facing = '',
    block = '',
    minArea = '',
    maxArea = '',
    minPrice = '',
    maxPrice = '',
    roadWidth = '',
    cornerOnly = false,
    availability = '',
  } = filters;

  return plots.filter((plot) => {
    if (facing && String(plot.facing || '').toLowerCase() !== facing.toLowerCase()) return false;
    if (block && String(plot.blockName || '').toLowerCase() !== block.toLowerCase()) return false;
    if (cornerOnly && !plot.cornerPlot) return false;

    if (availability === 'available' && plot.status !== 'Available') return false;
    if (availability === 'unavailable' && plot.status === 'Available') return false;

    const area = plotArea(plot);
    if (minArea !== '' && area < Number(minArea)) return false;
    if (maxArea !== '' && area > Number(maxArea)) return false;

    const price = plotPrice(plot);
    if (minPrice !== '' && price < Number(minPrice)) return false;
    if (maxPrice !== '' && price > Number(maxPrice)) return false;

    if (roadWidth !== '' && Number(plot.roadWidthFeet || 0) !== Number(roadWidth)) return false;

    return true;
  });
}

export function collectFilterOptions(plots = []) {
  const facings = new Set();
  const blocks = new Set();
  const roadWidths = new Set();

  plots.forEach((plot) => {
    if (plot.facing) facings.add(plot.facing);
    if (plot.blockName) blocks.add(plot.blockName);
    if (plot.roadWidthFeet != null) roadWidths.add(String(plot.roadWidthFeet));
  });

  return {
    facings: Array.from(facings).sort(),
    blocks: Array.from(blocks).sort(),
    roadWidths: Array.from(roadWidths).sort((a, b) => Number(a) - Number(b)),
  };
}

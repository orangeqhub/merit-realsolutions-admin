import { createSeededRng } from './rng.js';

export const TOWNSHIP_SIZES = {
  small: { widthFeet: 1200, heightFeet: 900, targetPlots: 120 },
  medium: { widthFeet: 1800, heightFeet: 1400, targetPlots: 450 },
  large: { widthFeet: 2800, heightFeet: 2200, targetPlots: 1200 },
};

export const DENSITY_MULTIPLIERS = {
  low: 0.65,
  medium: 1,
  high: 1.45,
};

export const ROAD_WIDTH_PRESETS = {
  DTCP: { main: 50, internal: 33, secondary: 24, service: 18 },
  HMDA: { main: 60, internal: 40, secondary: 30, service: 20 },
  RERA: { main: 45, internal: 36, secondary: 24, service: 18 },
  custom: null,
};

export const PLOT_SIZE_CATALOG = [
  { w: 30, h: 40, weight: 22, category: 'residential' },
  { w: 30, h: 50, weight: 20, category: 'residential' },
  { w: 30, h: 60, weight: 18, category: 'residential' },
  { w: 40, h: 60, weight: 16, category: 'residential' },
  { w: 40, h: 80, weight: 10, category: 'residential' },
  { w: 50, h: 80, weight: 8, category: 'villa' },
  { w: 40, h: 40, weight: 6, category: 'commercial' },
  { w: 50, h: 50, weight: 5, category: 'commercial' },
  { w: 35, h: 45, weight: 5, category: 'irregular' },
];

export const AMENITY_LEVELS = {
  basic: ['park', 'openSpace'],
  standard: ['park', 'openSpace', 'clubHouse', 'temple'],
  luxury: ['park', 'openSpace', 'clubHouse', 'temple', 'swimmingPool', 'utility', 'office'],
};

const AMENITY_EXTRA_LUXURY = [
  { type: 'park', label: 'Children Park', key: 'childrenPark' },
  { type: 'openSpace', label: 'Jogging Track', key: 'joggingTrack' },
  { type: 'utility', label: 'Water Tank', key: 'waterTank' },
  { type: 'utility', label: 'STP', key: 'stp' },
  { type: 'utility', label: 'Electrical Room', key: 'electricalRoom' },
];

export function resolveTownshipConfig(params = {}) {
  const sizeKey = params.townshipSize || 'medium';
  const densityKey = params.density || 'medium';
  const size = TOWNSHIP_SIZES[sizeKey] || TOWNSHIP_SIZES.medium;
  const densityMult = DENSITY_MULTIPLIERS[densityKey] || 1;

  const presetKey = params.roadWidthPreset || 'DTCP';
  const presetWidths = ROAD_WIDTH_PRESETS[presetKey] || ROAD_WIDTH_PRESETS.DTCP;
  const roadWidths = presetKey === 'custom'
    ? {
        main: Number(params.mainRoadWidth) || 50,
        internal: Number(params.internalRoadWidth) || 33,
        secondary: Number(params.secondaryRoadWidth) || 24,
        service: Number(params.serviceRoadWidth) || 18,
      }
    : { ...presetWidths };

  const seedRaw = params.randomSeed;
  const rng = createSeededRng(
    seedRaw !== '' && seedRaw != null ? Number(seedRaw) : Date.now()
  );

  const amenitiesLevel = params.amenitiesLevel || 'standard';
  const amenityTypes = [...(AMENITY_LEVELS[amenitiesLevel] || AMENITY_LEVELS.standard)];

  if (amenitiesLevel === 'luxury') {
    AMENITY_EXTRA_LUXURY.forEach((item) => {
      if (!amenityTypes.includes(item.type)) amenityTypes.push(item.type);
    });
  }

  const userAmenities = params.amenities || {};
  const enabledAmenityKeys = Object.keys(userAmenities).length
    ? Object.keys(userAmenities).filter((k) => userAmenities[k])
    : amenityTypes;

  return {
    size,
    sizeKey,
    densityKey,
    densityMult,
    targetPlots: Math.round(size.targetPlots * densityMult),
    roadWidths,
    roadStyle: params.roadStyle || 'premium',
    boundaryShape: params.boundaryShape || 'auto',
    plotNumbering: params.plotNumbering || 'block-wise',
    commercialPercent: Math.min(25, Math.max(0, Number(params.commercialPercent) || 8)),
    cornerPlotPercent: Math.min(30, Math.max(0, Number(params.cornerPlotPercent) || 12)),
    parkPercent: Math.min(25, Math.max(5, Number(params.parkPercent) || 10)),
    openSpacePercent: Math.min(30, Math.max(5, Number(params.openSpacePercent) || 15)),
    blockPrefix: String(params.blockPrefix || 'A').trim().toUpperCase(),
    startingPlotNumber: Number(params.startingPlotNumber) || 101,
    ratePerSqYard: Number(params.defaultRatePerSqYard) || 0,
    rng,
    enabledAmenityKeys,
    amenitiesLevel,
    extraAmenities: amenitiesLevel === 'luxury' ? AMENITY_EXTRA_LUXURY : [],
  };
}

export function pickPlotSize(rng, category = null) {
  const pool = category
    ? PLOT_SIZE_CATALOG.filter((s) => s.category === category)
    : PLOT_SIZE_CATALOG;
  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let roll = rng.next() * totalWeight;
  for (const size of pool) {
    roll -= size.weight;
    if (roll <= 0) return { ...size };
  }
  return { ...pool[pool.length - 1] };
}

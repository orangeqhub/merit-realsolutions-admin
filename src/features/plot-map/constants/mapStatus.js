/** Map plot status colors — sourced from shared PremiumMapTheme */
import {
  MAP_STATUS_COLORS,
  MAP_LEGEND_ITEMS,
  PLOT_STATUS_THEME,
} from '@map-rendering/PremiumMapTheme.js';

export { MAP_STATUS_COLORS, PLOT_STATUS_THEME, MAP_LEGEND_ITEMS };

export const MAP_STATUS_OPTIONS = Object.keys(MAP_STATUS_COLORS).map((value) => ({
  value,
  label: MAP_STATUS_COLORS[value].label,
}));

export const SHAPE_TYPES = {
  RECTANGLE: 'RECTANGLE',
  POLYGON: 'POLYGON',
};

export const DEFAULT_PLOT_OVERLAY = {
  mapWidth: 72,
  mapHeight: 48,
  rotation: 0,
  shapeType: SHAPE_TYPES.RECTANGLE,
};

export const MOCK_CUSTOMERS = [
  'Rajesh Kumar',
  'Sneha Reddy',
  'Anil Sharma',
  'Priya Nair',
  'Vikram Singh',
];

export const MOCK_PARTNERS = [
  'Merit Sales Team',
  'Skyline Partners',
  'Green Valley Agents',
  'Coastal Realty',
];

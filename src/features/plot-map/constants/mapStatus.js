/** Map plot status colors — do not change */
export const MAP_STATUS_COLORS = {
  Available: { fill: '#22c55e', border: '#16a34a', label: 'Available' },
  Reserved: { fill: '#eab308', border: '#ca8a04', label: 'Reserved' },
  Booked: { fill: '#2563eb', border: '#1d4ed8', label: 'Booked' },
  Sold: { fill: '#ef4444', border: '#dc2626', label: 'Sold' },
  Blocked: { fill: '#6b7280', border: '#4b5563', label: 'Blocked' },
};

export const MAP_STATUS_OPTIONS = Object.keys(MAP_STATUS_COLORS).map((value) => ({
  value,
  label: MAP_STATUS_COLORS[value].label,
}));

export const MAP_LEGEND_ITEMS = Object.entries(MAP_STATUS_COLORS).map(([status, meta]) => ({
  status,
  ...meta,
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

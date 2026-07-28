/** Local status metadata retained while premium map rendering is disabled. */
export const MAP_STATUS_COLORS = {
  Available: { fill: '#4ade80', border: '#16a34a', label: 'Available' },
  Reserved: { fill: '#fbbf24', border: '#d97706', label: 'Reserved' },
  Booked: { fill: '#60a5fa', border: '#2563eb', label: 'Booked' },
  Sold: { fill: '#f87171', border: '#dc2626', label: 'Sold' },
  Blocked: { fill: '#9ca3af', border: '#6b7280', label: 'Blocked' },
};
export const PLOT_STATUS_THEME = MAP_STATUS_COLORS;
export const MAP_LEGEND_ITEMS = Object.entries(MAP_STATUS_COLORS).map(([status, meta]) => ({ status, ...meta }));
export const MAP_STATUS_OPTIONS = Object.keys(MAP_STATUS_COLORS).map((value) => ({ value, label: MAP_STATUS_COLORS[value].label }));
export const SHAPE_TYPES = { RECTANGLE: 'RECTANGLE', POLYGON: 'POLYGON' };
export const DEFAULT_PLOT_OVERLAY = { mapWidth: 72, mapHeight: 48, rotation: 0, shapeType: SHAPE_TYPES.RECTANGLE };
export const MOCK_CUSTOMERS = ['Rajesh Kumar', 'Sneha Reddy', 'Anil Sharma', 'Priya Nair', 'Vikram Singh'];
export const MOCK_PARTNERS = ['Merit Sales Team', 'Skyline Partners', 'Green Valley Agents', 'Coastal Realty'];
export const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['xlsx', 'xls'];
export const VALIDATION_CHUNK_SIZE = 500;

export const SHEET_NAMES = {
  layout: 'Layout',
  roads: 'Roads',
  amenities: 'Amenities',
  plots: 'Plots',
};

export const LAYOUT_HEADERS = [
  'LayoutCode',
  'LayoutName',
  'CenterLatitude',
  'CenterLongitude',
  'TotalAreaAcres',
  'RoadColor',
  'PlotColor',
  'MainRoadColor',
  'BoundaryColor',
  'BackgroundOpacity',
  'DefaultRate',
  'RegistrationCharge',
  'DevelopmentCharge',
  'SurveyNumber',
  'ApprovalNo',
  'ApprovalDate',
];

export const ROAD_HEADERS = [
  'RoadID',
  'RoadName',
  'RoadType',
  'WidthFt',
  'Polyline',
  'RoadColor',
];

export const AMENITY_HEADERS = [
  'AmenityID',
  'Type',
  'Polygon',
  'Label',
];

export const PLOT_HEADERS = [
  'PlotNo',
  'Block',
  'Facing',
  'Status',
  'AreaSqYd',
  'WidthFt',
  'DepthFt',
  'Rate',
  'Latitude',
  'Longitude',
  'Polygon',
  'Owner',
  'CornerPlot',
  'RoadWidth',
  'Remarks',
];

export const ROAD_TYPE_MAP = {
  main: 'main',
  internal: 'internal',
  service: 'service',
};

export const AMENITY_TYPE_MAP = {
  park: 'park',
  club: 'clubHouse',
  clubhouse: 'clubHouse',
  temple: 'temple',
  swimmingpool: 'swimmingPool',
  pool: 'swimmingPool',
  office: 'office',
  utility: 'utility',
  openspace: 'openSpace',
  open_space: 'openSpace',
};

export const AMENITY_STYLES = {
  park: { fillColor: '#86efac', borderColor: '#16a34a' },
  clubHouse: { fillColor: '#fde68a', borderColor: '#d97706' },
  openSpace: { fillColor: '#bbf7d0', borderColor: '#059669' },
  temple: { fillColor: '#fecaca', borderColor: '#dc2626' },
  swimmingPool: { fillColor: '#bae6fd', borderColor: '#0284c7' },
  office: { fillColor: '#e2e8f0', borderColor: '#475569' },
  utility: { fillColor: '#fcd34d', borderColor: '#b45309' },
};

export const VALID_PLOT_STATUSES = ['Available', 'Reserved', 'Booked', 'Sold', 'Blocked'];

export const SAMPLE_LAYOUT_ROW = {
  LayoutCode: 'LYT-001',
  LayoutName: 'Sample Layout',
  CenterLatitude: 16.55628,
  CenterLongitude: 80.38521,
  TotalAreaAcres: 25,
  RoadColor: '#64748b',
  PlotColor: '#0ea5e9',
  MainRoadColor: '#475569',
  BoundaryColor: '#2563eb',
  BackgroundOpacity: 0.35,
  DefaultRate: 26000,
  RegistrationCharge: 5000,
  DevelopmentCharge: 3000,
  SurveyNumber: '123/2024',
  ApprovalNo: 'DTCP/2024/001',
  ApprovalDate: '2024-01-15',
};

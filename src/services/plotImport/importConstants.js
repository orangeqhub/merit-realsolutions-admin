/** Excel template column headers (row 1). */
export const TEMPLATE_HEADERS = [
  'Plot Number',
  'Area (sq.yd)',
  'Rate per sq.yd',
  'Status',
  'Facing',
  'Corner 1 Lat',
  'Corner 1 Lng',
  'Corner 2 Lat',
  'Corner 2 Lng',
  'Corner 3 Lat',
  'Corner 3 Lng',
  'Corner 4 Lat',
  'Corner 4 Lng',
];

export const TEMPLATE_SHEET_NAME = 'Plot Import';

export const ALLOWED_IMPORT_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'BOOKED',
  'SOLD',
  'BLOCKED',
];

export const STATUS_TO_APP = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  BOOKED: 'Booked',
  SOLD: 'Sold',
  BLOCKED: 'Blocked',
};

export const IMPORT_WIZARD_STEPS = [
  { label: 'Template', description: 'Download Excel' },
  { label: 'Upload', description: 'Excel file' },
  { label: 'Validate', description: 'Check rows' },
  { label: 'Preview', description: 'Table & map' },
  { label: 'Finish', description: 'Import summary' },
];

export const SAMPLE_TEMPLATE_ROW = {
  'Plot Number': 'P-001',
  'Area (sq.yd)': 200,
  'Rate per sq.yd': 12500,
  Status: 'AVAILABLE',
  Facing: 'East',
  'Corner 1 Lat': 16.55597,
  'Corner 1 Lng': 80.38575,
  'Corner 2 Lat': 16.55601,
  'Corner 2 Lng': 80.38582,
  'Corner 3 Lat': 16.55595,
  'Corner 3 Lng': 80.38588,
  'Corner 4 Lat': 16.55591,
  'Corner 4 Lng': 80.38581,
};

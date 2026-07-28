/** GIS Township Workbook V2.1 — validation & template constants */
/* GIS_WORKBOOK_VALIDATOR_V21_COMPLETE */
/* GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE */
/* GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE */

import {
  CLOSED_POLYGON_RULE_SUMMARY,
  CLOSED_POLYGON_SHEETS,
} from './closedPolygonStandard.js';

export { CLOSED_POLYGON_RULE_SUMMARY, CLOSED_POLYGON_SHEETS };

export const WORKBOOK_FORMAT_VERSION = '2.1.0';

export const SHEET_NAMES_V21 = Object.freeze({
  project: 'Project',
  statistics: 'Statistics',
  surveyReference: 'SurveyReference',
  boundary: 'Boundary',
  entrances: 'Entrances',
  roads: 'Roads',
  blocks: 'Blocks',
  plotGeometry: 'PlotGeometry',
  amenities: 'Amenities',
  utilities: 'Utilities',
  landscaping: 'Landscaping',
  plotMaster: 'PlotMaster',
});

/** Required for a valid V2.1 import (minimum path). */
export const REQUIRED_SHEETS_V21 = Object.freeze([
  SHEET_NAMES_V21.project,
  SHEET_NAMES_V21.boundary,
  SHEET_NAMES_V21.plotGeometry,
  SHEET_NAMES_V21.plotMaster,
]);

export const OPTIONAL_SHEETS_V21 = Object.freeze([
  SHEET_NAMES_V21.statistics,
  SHEET_NAMES_V21.surveyReference,
  SHEET_NAMES_V21.entrances,
  SHEET_NAMES_V21.roads,
  SHEET_NAMES_V21.blocks,
  SHEET_NAMES_V21.amenities,
  SHEET_NAMES_V21.utilities,
  SHEET_NAMES_V21.landscaping,
]);

export const V21_SHEET_TAB_ORDER = Object.freeze([
  SHEET_NAMES_V21.project,
  SHEET_NAMES_V21.statistics,
  SHEET_NAMES_V21.surveyReference,
  SHEET_NAMES_V21.boundary,
  SHEET_NAMES_V21.entrances,
  SHEET_NAMES_V21.roads,
  SHEET_NAMES_V21.blocks,
  SHEET_NAMES_V21.plotGeometry,
  SHEET_NAMES_V21.amenities,
  SHEET_NAMES_V21.utilities,
  SHEET_NAMES_V21.landscaping,
  SHEET_NAMES_V21.plotMaster,
]);

export const PROJECT_HEADERS = [
  'ProjectID',
  'WorkbookFormatVersion',
  'ProjectCode',
  'ProjectName',
  'CenterLatitude',
  'CenterLongitude',
  'TotalAreaAcres',
  'CoordinateReferenceSystem',
  'SurveyNumber',
  'ApprovalAuthority',
  'ApprovalNumber',
  'ApprovalDate',
  'DefaultRatePerSqYd',
  'RegistrationCharge',
  'DevelopmentCharge',
  'Description',
];

export const STATISTICS_HEADERS = [
  'ProjectID',
  'TotalPlots',
  'TotalRoads',
  'TotalAmenities',
  'TotalAreaAcres',
  'Remarks',
];

export const SURVEY_REFERENCE_HEADERS = [
  'ProjectID',
  'SurveyID',
  'ReferenceType',
  'FileName',
  'DocumentType',
  'Revision',
  'Date',
  'PreparedBy',
  'CoordinateSystem',
  'Description',
];

export const BOUNDARY_HEADERS = ['ProjectID', 'Sequence', 'Latitude', 'Longitude'];

export const ENTRANCE_HEADERS = [
  'ProjectID',
  'EntranceID',
  'EntranceName',
  'Sequence',
  'Latitude',
  'Longitude',
  'ConnectedRoadID',
];

export const ROAD_HEADERS_V21 = [
  'ProjectID',
  'RoadID',
  'RoadName',
  'RoadType',
  'RoadWidth',
  'RoadGroup',
  'ConnectedRoadID',
  'Sequence',
  'Latitude',
  'Longitude',
];

/** Core geometry columns first; BlockName/LandUse are optional metadata. */
export const BLOCK_HEADERS = [
  'ProjectID',
  'BlockID',
  'Sequence',
  'Latitude',
  'Longitude',
  'BlockName',
  'LandUse',
];

export const PLOT_GEOMETRY_HEADERS = [
  'ProjectID',
  'PlotID',
  'Sequence',
  'Latitude',
  'Longitude',
];

/** Core geometry columns first; Type/Label are optional metadata. */
export const AMENITY_HEADERS_V21 = [
  'ProjectID',
  'AmenityID',
  'Sequence',
  'Latitude',
  'Longitude',
  'Type',
  'Label',
];

export const UTILITY_HEADERS = [
  'ProjectID',
  'UtilityID',
  'GeometryType',
  'Sequence',
  'Type',
  'Latitude',
  'Longitude',
  'Description',
];

export const LANDSCAPING_HEADERS = [
  'ProjectID',
  'FeatureID',
  'FeatureType',
  'Label',
  'Sequence',
  'Latitude',
  'Longitude',
];

export const PLOT_MASTER_HEADERS = [
  'ProjectID',
  'PlotID',
  'PlotNumber',
  'BlockID',
  'AreaSqYd',
  'Facing',
  'Status',
  'CornerPlot',
  'RoadWidth',
  'Owner',
  'RegistrationStatus',
  'PlotType',
  'SaleType',
  'RatePerSqYd',
  'Dimensions',
  'Description',
  'Remarks',
];

export const VALID_PLOT_STATUSES_V21 = Object.freeze([
  'Available',
  'Reserved',
  'Booked',
  'Sold',
  'Blocked',
]);

export const SURVEY_REFERENCE_TYPES = Object.freeze([
  'DTCP',
  'HMDA',
  'RERA',
  'AutoCAD',
  'DWG',
  'DXF',
  'GeoJSON',
  'KML',
  'Survey Drawing',
  'Google Earth',
  'QGIS',
  'PDF',
  'Image',
]);

export const SAMPLE_PROJECT_ROW = {
  ProjectID: 'PRJ-001',
  WorkbookFormatVersion: WORKBOOK_FORMAT_VERSION,
  ProjectCode: 'LYT-001',
  ProjectName: 'Sample Township',
  CenterLatitude: 16.55628,
  CenterLongitude: 80.38521,
  TotalAreaAcres: 25,
  CoordinateReferenceSystem: 'EPSG:4326',
  SurveyNumber: '123/2024',
  ApprovalAuthority: 'DTCP',
  ApprovalNumber: 'DTCP/2024/001',
  ApprovalDate: '2024-01-15',
  DefaultRatePerSqYd: 26000,
  RegistrationCharge: 5000,
  DevelopmentCharge: 3000,
  Description: 'GIS Township Workbook V2.1 template — all polygon sheets use explicit closing coordinates',
};

/** Boundary — Sequence 5 repeats Sequence 1 (closed ring). */
export const SAMPLE_BOUNDARY_ROWS = [
  { ProjectID: 'PRJ-001', Sequence: 1, Latitude: 16.55665, Longitude: 80.38235 },
  { ProjectID: 'PRJ-001', Sequence: 2, Latitude: 16.55665, Longitude: 80.38850 },
  { ProjectID: 'PRJ-001', Sequence: 3, Latitude: 16.55480, Longitude: 80.38850 },
  { ProjectID: 'PRJ-001', Sequence: 4, Latitude: 16.55480, Longitude: 80.38235 },
  { ProjectID: 'PRJ-001', Sequence: 5, Latitude: 16.55665, Longitude: 80.38235 },
];

/** Blocks — optional polygon; geometry columns before optional metadata. */
export const SAMPLE_BLOCK_ROWS = [
  { ProjectID: 'PRJ-001', BlockID: 'BLK-A', Sequence: 1, Latitude: 16.55620, Longitude: 80.38300, BlockName: 'Block A', LandUse: 'Residential' },
  { ProjectID: 'PRJ-001', BlockID: 'BLK-A', Sequence: 2, Latitude: 16.55620, Longitude: 80.38600, BlockName: 'Block A', LandUse: 'Residential' },
  { ProjectID: 'PRJ-001', BlockID: 'BLK-A', Sequence: 3, Latitude: 16.55500, Longitude: 80.38600, BlockName: 'Block A', LandUse: 'Residential' },
  { ProjectID: 'PRJ-001', BlockID: 'BLK-A', Sequence: 4, Latitude: 16.55500, Longitude: 80.38300, BlockName: 'Block A', LandUse: 'Residential' },
  { ProjectID: 'PRJ-001', BlockID: 'BLK-A', Sequence: 5, Latitude: 16.55620, Longitude: 80.38300, BlockName: 'Block A', LandUse: 'Residential' },
];

/** PlotGeometry — Sequence 5 repeats Sequence 1 for PlotID P-A101. */
export const SAMPLE_PLOT_GEOMETRY_ROWS = [
  { ProjectID: 'PRJ-001', PlotID: 'P-A101', Sequence: 1, Latitude: 16.55775, Longitude: 80.38355 },
  { ProjectID: 'PRJ-001', PlotID: 'P-A101', Sequence: 2, Latitude: 16.55775, Longitude: 80.38385 },
  { ProjectID: 'PRJ-001', PlotID: 'P-A101', Sequence: 3, Latitude: 16.55755, Longitude: 80.38385 },
  { ProjectID: 'PRJ-001', PlotID: 'P-A101', Sequence: 4, Latitude: 16.55755, Longitude: 80.38355 },
  { ProjectID: 'PRJ-001', PlotID: 'P-A101', Sequence: 5, Latitude: 16.55775, Longitude: 80.38355 },
];

/** Amenities — geometry columns before optional Type/Label metadata. */
export const SAMPLE_AMENITY_ROWS = [
  { ProjectID: 'PRJ-001', AmenityID: 'AMN-1', Sequence: 1, Latitude: 16.55600, Longitude: 80.38450, Type: 'park', Label: 'Central Park' },
  { ProjectID: 'PRJ-001', AmenityID: 'AMN-1', Sequence: 2, Latitude: 16.55600, Longitude: 80.38550, Type: 'park', Label: 'Central Park' },
  { ProjectID: 'PRJ-001', AmenityID: 'AMN-1', Sequence: 3, Latitude: 16.55540, Longitude: 80.38550, Type: 'park', Label: 'Central Park' },
  { ProjectID: 'PRJ-001', AmenityID: 'AMN-1', Sequence: 4, Latitude: 16.55540, Longitude: 80.38450, Type: 'park', Label: 'Central Park' },
  { ProjectID: 'PRJ-001', AmenityID: 'AMN-1', Sequence: 5, Latitude: 16.55600, Longitude: 80.38450, Type: 'park', Label: 'Central Park' },
];

export const SAMPLE_PLOT_MASTER_ROW = {
  ProjectID: 'PRJ-001',
  PlotID: 'P-A101',
  PlotNumber: 'A101',
  BlockID: '',
  AreaSqYd: 166.67,
  Facing: 'East',
  Status: 'Available',
  CornerPlot: 'TRUE',
  RoadWidth: 40,
  Owner: '',
  RegistrationStatus: 'Pending',
  PlotType: 'Residential',
  SaleType: 'Sale',
  RatePerSqYd: 26000,
  Dimensions: '30 x 50 ft',
  Description: 'Sample plot inventory row',
  Remarks: '',
};

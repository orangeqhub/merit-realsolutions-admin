import { buildV21TemplateWorkbook, workbookToArrayBuffer } from './src/services/layoutImport/workbookV21Template.js';
import { readXlsxWorkbook, extractParsedSheets } from './src/services/layoutImport/workbookParseUtils.js';
import { LayoutImportValidator } from './src/services/layoutImport/layoutImportValidator.js';
import { mapValidationToPreview } from './src/services/layoutImport/layoutImportMapper.js';
import { buildLayoutSavePayload } from './src/services/layoutSave/PlotSaveService.js';

// We want to add a sample road to the template so we can trace it
import { SAMPLE_PROJECT_ROW, SAMPLE_BOUNDARY_ROWS, SAMPLE_BLOCK_ROWS, SAMPLE_PLOT_GEOMETRY_ROWS, SAMPLE_AMENITY_ROWS, SAMPLE_PLOT_MASTER_ROW } from './src/services/layoutImport/workbookV21Constants.js';
import * as XLSX from 'xlsx';

async function run() {
  // Let's create a workbook with Roads as well
  const ROAD_HEADERS_V21 = [
    'ProjectID', 'RoadID', 'RoadName', 'RoadType', 'RoadWidth', 'RoadGroup', 'ConnectedRoadID', 'Sequence', 'Latitude', 'Longitude'
  ];
  const SAMPLE_ROAD_ROWS = [
    { ProjectID: 'PRJ-001', RoadID: 'R-1', RoadName: 'Main Road', RoadType: 'main', RoadWidth: 40, Sequence: 1, Latitude: 16.55600, Longitude: 80.38300 },
    { ProjectID: 'PRJ-001', RoadID: 'R-1', RoadName: 'Main Road', RoadType: 'main', RoadWidth: 40, Sequence: 2, Latitude: 16.55600, Longitude: 80.38600 }
  ];

  const wb = XLSX.utils.book_new();
  const sheets = {
    Project: XLSX.utils.json_to_sheet([SAMPLE_PROJECT_ROW]),
    Statistics: XLSX.utils.json_to_sheet([]),
    SurveyReference: XLSX.utils.json_to_sheet([]),
    Boundary: XLSX.utils.json_to_sheet(SAMPLE_BOUNDARY_ROWS),
    Entrances: XLSX.utils.json_to_sheet([]),
    Roads: XLSX.utils.json_to_sheet(SAMPLE_ROAD_ROWS, { header: ROAD_HEADERS_V21 }),
    Blocks: XLSX.utils.json_to_sheet(SAMPLE_BLOCK_ROWS),
    PlotGeometry: XLSX.utils.json_to_sheet(SAMPLE_PLOT_GEOMETRY_ROWS),
    Amenities: XLSX.utils.json_to_sheet(SAMPLE_AMENITY_ROWS),
    Utilities: XLSX.utils.json_to_sheet([]),
    Landscaping: XLSX.utils.json_to_sheet([]),
    PlotMaster: XLSX.utils.json_to_sheet([SAMPLE_PLOT_MASTER_ROW]),
  };

  const V21_SHEET_TAB_ORDER = [
    'Project', 'Statistics', 'SurveyReference', 'Boundary', 'Entrances', 'Roads', 'Blocks',
    'PlotGeometry', 'Amenities', 'Utilities', 'Landscaping', 'PlotMaster'
  ];
  V21_SHEET_TAB_ORDER.forEach((tabName) => {
    XLSX.utils.book_append_sheet(wb, sheets[tabName], tabName);
  });

  console.log("=== STAGE 1: Workbook ===");
  console.log("Boundary rows:", SAMPLE_BOUNDARY_ROWS.length);
  console.log("Road rows:", SAMPLE_ROAD_ROWS.length);
  console.log("Block rows:", SAMPLE_BLOCK_ROWS.length);
  console.log("PlotGeometry rows:", SAMPLE_PLOT_GEOMETRY_ROWS.length);
  console.log("PlotMaster rows:", 1);
  console.log("Amenity rows:", SAMPLE_AMENITY_ROWS.length);

  console.log("\n=== STAGE 2: Workbook Parser ===");
  const parsed = extractParsedSheets(wb, 'test.xlsx');
  console.log("Parsed Boundary vertices count:", parsed.boundary.length);
  console.log("Parsed Roads raw rows count:", parsed.roads.length);
  console.log("Parsed Blocks raw rows count:", parsed.blocks.length);
  console.log("Parsed PlotGeometry raw rows count:", parsed.plotGeometry.length);
  console.log("Parsed PlotMaster raw rows count:", parsed.plotMaster.length);
  console.log("Parsed Plots (synthesized) count:", parsed.plots.length);
  console.log("Parsed Amenities raw rows count:", parsed.amenities.length);

  console.log("\n=== STAGE 3: Importer (Validator) ===");
  const validation = await LayoutImportValidator.validateParsed(parsed);
  console.log("Validation valid:", validation.valid);
  console.log("Validation errors:", validation.errors);
  console.log("Validation roadResults count:", validation.roadResults.length);
  console.log("Validation amenityResults count:", validation.amenityResults.length);
  console.log("Validation plotResults count:", validation.plotResults.length);

  console.log("\n=== STAGE 4: Output Adapter (buildPreview / mapValidationToPreview) ===");
  const preview = mapValidationToPreview(parsed, validation, { id: 'layout-123' });
  console.log("Preview Boundary (Wait, does preview have boundary?):", preview.boundary ? preview.boundary.length : "undefined");
  console.log("Preview Roads count:", preview.roads.length);
  if (preview.roads.length > 0) {
    console.log("Preview Road 0:", JSON.stringify(preview.roads[0], null, 2));
  }
  console.log("Preview Amenities count:", preview.amenities.length);
  if (preview.amenities.length > 0) {
    console.log("Preview Amenity 0:", JSON.stringify(preview.amenities[0], null, 2));
  }
  console.log("Preview Plots count:", preview.plots.length);
  if (preview.plots.length > 0) {
    console.log("Preview Plot 0:", JSON.stringify(preview.plots[0], null, 2));
  }
  console.log("Preview Block Labels count:", preview.blockLabels ? preview.blockLabels.length : "undefined");

  console.log("\n=== STAGE 5: Save Payload (buildLayoutSavePayload) ===");
  const savePayload = buildLayoutSavePayload({
    layout: { id: 'layout-123' },
    venture: { id: 'venture-123' },
    preview,
    generationForm: preview.configuration
  });
  console.log("Save Payload plots count:", savePayload.plots.length);
  console.log("Save Payload roads count:", savePayload.roads.length);
  console.log("Save Payload amenities count:", savePayload.amenities.length);
  console.log("Save Payload blockLabels count:", savePayload.blockLabels.length);
}

run().catch(console.error);

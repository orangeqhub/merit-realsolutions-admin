import * as XLSX from 'xlsx';
import { layoutService } from '../../shared/services/layoutService.js';
import { dataStore } from '../../shared/repositories/dataStore.js';
import {
  ROAD_HEADERS,
  AMENITY_HEADERS,
  PLOT_HEADERS,
  SHEET_NAMES,
} from './constants.js';
import {
  plotToExportRow,
  roadToExportRow,
  amenityToExportRow,
  mapLayoutMetadata,
} from './layoutImportMapper.js';
import { buildV21TemplateWorkbook } from './workbookV21Template.js';

function layoutSheetRow(layout, venture, snapshot) {
  const config = snapshot?.configuration?.layoutMeta || snapshot?.configuration || {};
  const styling = config.styling || snapshot?.configuration?.styling || {};
  return {
    LayoutCode: layout.code || '',
    LayoutName: layout.name || '',
    CenterLatitude: config.centerLatitude ?? config.center?.lat ?? venture?.latitude ?? '',
    CenterLongitude: config.centerLongitude ?? config.center?.lng ?? venture?.longitude ?? '',
    TotalAreaAcres: layout.totalArea ?? config.totalAreaAcres ?? '',
    RoadColor: styling.roadColor ?? '',
    PlotColor: styling.plotColor ?? '',
    MainRoadColor: styling.mainRoadColor ?? '',
    BoundaryColor: styling.boundaryColor ?? '',
    BackgroundOpacity: styling.backgroundOpacity ?? '',
    DefaultRate: config.defaultRate ?? venture?.currentPrice ?? '',
    RegistrationCharge: config.registrationCharge ?? venture?.registrationCharges ?? '',
    DevelopmentCharge: config.developmentCharge ?? venture?.developmentCharges ?? '',
    SurveyNumber: layout.surveyNumber ?? config.surveyNumber ?? '',
    ApprovalNo: config.approvalNumber ?? venture?.approvalNumber ?? '',
    ApprovalDate: config.approvalDate ?? venture?.approvalDate ?? '',
  };
}

export const LayoutExcelExporter = {
  /** GIS Township Workbook V2.1 template — GIS_WORKBOOK_TEMPLATE_V21_SYNCHRONIZED_COMPLETE */
  downloadTemplate(filename = 'gis-township-workbook-v2.1-template.xlsx') {
    const wb = buildV21TemplateWorkbook();
    XLSX.writeFile(wb, filename);
  },

  buildWorkbookFromLayout({ layout, venture, snapshot, plots }) {
    const roads = snapshot?.roads || [];
    const amenities = snapshot?.amenities || [];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([layoutSheetRow(layout, venture, snapshot)]),
      SHEET_NAMES.layout
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(roads.map(roadToExportRow), { header: ROAD_HEADERS }),
      SHEET_NAMES.roads
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(amenities.map(amenityToExportRow), { header: AMENITY_HEADERS }),
      SHEET_NAMES.amenities
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(plots.map(plotToExportRow), { header: PLOT_HEADERS }),
      SHEET_NAMES.plots
    );
    return wb;
  },

  exportLayout(layoutId, venture = null, filename) {
    const layout = layoutService.getById(layoutId);
    if (!layout) throw new Error('Layout not found.');

    const plots = dataStore.getList('plots').filter((plot) => plot.layoutId === layoutId);
    const snapshot = layout.generationSnapshot;

    if (!plots.length && !snapshot) {
      throw new Error('No imported or generated layout data to export.');
    }

    const safeName = (layout.name || layoutId).replace(/[^\w-]+/g, '-').toLowerCase();
    const wb = this.buildWorkbookFromLayout({
      layout,
      venture,
      snapshot,
      plots,
    });

    XLSX.writeFile(wb, filename || `${safeName}-layout-export.xlsx`);

    return {
      filename: filename || `${safeName}-layout-export.xlsx`,
      counts: {
        plots: plots.length,
        roads: snapshot?.roads?.length || 0,
        amenities: snapshot?.amenities?.length || 0,
      },
    };
  },
};

export { mapLayoutMetadata };

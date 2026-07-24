import * as XLSX from 'xlsx';
import { TEMPLATE_HEADERS, TEMPLATE_SHEET_NAME } from '../../plotImport/importConstants.js';

function statusToImport(status) {
  return String(status || 'Available').toUpperCase().replace(/\s+/g, '_');
}

function cornerValue(points, index, axis) {
  const point = points[index];
  if (!point) return '';
  const value = axis === 'lat' ? point.lat : point.lng;
  return Number.isFinite(Number(value)) ? Number(value) : '';
}

export function plotToImportRow(plot) {
  const points = plot.polygonPoints || plot.coordinates || [];

  return {
    'Plot Number': plot.plotNumber || '',
    'Area (sq.yd)': plot.areaSqYards ?? '',
    'Rate per sq.yd': plot.ratePerSqYard ?? plot.totalPrice ?? '',
    Status: statusToImport(plot.status),
    Facing: plot.facing || 'East',
    'Corner 1 Lat': cornerValue(points, 0, 'lat'),
    'Corner 1 Lng': cornerValue(points, 0, 'lng'),
    'Corner 2 Lat': cornerValue(points, 1, 'lat'),
    'Corner 2 Lng': cornerValue(points, 1, 'lng'),
    'Corner 3 Lat': cornerValue(points, 2, 'lat'),
    'Corner 3 Lng': cornerValue(points, 2, 'lng'),
    'Corner 4 Lat': cornerValue(points, 3, 'lat'),
    'Corner 4 Lng': cornerValue(points, 3, 'lng'),
  };
}

export const ExcelExportService = {
  buildRows(plots = []) {
    return plots.map(plotToImportRow);
  },

  exportGeneratedPlots(plots = [], filename = 'generated-layout-plots.xlsx') {
    const rows = this.buildRows(plots);
    const ws = XLSX.utils.json_to_sheet(rows, { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, TEMPLATE_SHEET_NAME);
    XLSX.writeFile(wb, filename);
    return { rowCount: rows.length, filename };
  },
};

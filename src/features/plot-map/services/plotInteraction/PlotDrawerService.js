import { formatINR } from '../../../../pages/plotInventory/constants';
import { formatCoordinate } from '../../utils/coordinateUtils';
import { PlotStatusService } from './PlotStatusService';

function formatDimensions(plot) {
  if (plot.dimensions) return plot.dimensions;
  if (plot.mapWidth && plot.mapHeight) return `${plot.mapWidth} × ${plot.mapHeight} ft`;
  return '—';
}

export const PlotDrawerService = {
  buildDetailView(plot, layout) {
    if (!plot) return null;

    const areaSqYards = plot.areaSqYards;
    const rate = plot.ratePerSqYard;

    return {
      plotNumber: plot.plotNumber || '—',
      block: plot.blockName || '—',
      layout: plot.layoutName || layout?.name || '—',
      area: areaSqYards ? `${areaSqYards} Sq.Yds` : '—',
      facing: plot.facing || '—',
      dimensions: formatDimensions(plot),
      price: formatINR(plot.finalPrice || plot.totalPrice || (rate && areaSqYards ? rate * areaSqYards : 0)),
      ratePerSqYard: rate ? formatINR(rate) : '—',
      status: plot.status || 'Available',
      statusLabel: PlotStatusService.getStatusLabel(plot.status),
      latitude: formatCoordinate(plot.latitude),
      longitude: formatCoordinate(plot.longitude),
      rowNumber: plot.rowNumber ?? (plot.row != null ? plot.row + 1 : '—'),
      columnNumber: plot.columnNumber ?? (plot.col != null ? plot.col + 1 : '—'),
      roadWidth: plot.roadWidthFeet ? `${plot.roadWidthFeet} ft` : '—',
      plcType: plot.plcType || '—',
      cornerPlot: plot.cornerPlot ? 'Yes' : 'No',
      description: plot.notes || plot.description || '—',
      customer: plot.customer || '—',
      agent: plot.agent || '—',
      actions: PlotStatusService.getActionsForStatus(plot.status),
    };
  },

  buildEditForm(plot) {
    return {
      plotNumber: plot.plotNumber || '',
      areaSqYards: plot.areaSqYards ?? '',
      facing: plot.facing || 'East',
      ratePerSqYard: plot.ratePerSqYard ?? '',
      dimensions: plot.dimensions || '',
      status: plot.status || 'Available',
      description: plot.notes || plot.description || '',
    };
  },
};

import { memo } from 'react';
import { formatINR } from '../../../pages/plotInventory/constants';

function Stat({ label, value }) {
  return (
    <div className="ws-quick-stats__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkspaceQuickStats({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="ws-quick-stats" aria-label="Quick statistics">
      <Stat label="Area Sold" value={`${metrics.areaSold.toLocaleString('en-IN')} Sq.Yd`} />
      <Stat label="Area Available" value={`${metrics.areaAvailable.toLocaleString('en-IN')} Sq.Yd`} />
      <Stat label="Inventory Value" value={metrics.inventoryValueLabel || formatINR(metrics.inventoryValue)} />
      <Stat label="Revenue" value={metrics.revenueLabel || formatINR(metrics.revenue)} />
      <Stat label="Reservation %" value={`${metrics.reservationPct}%`} />
      <Stat label="Avg Plot Size" value={`${metrics.averagePlotSize} Sq.Yd`} />
      <Stat label="Largest Plot" value={`${metrics.largestPlot} Sq.Yd`} />
      <Stat label="Smallest Plot" value={`${metrics.smallestPlot} Sq.Yd`} />
    </div>
  );
}

export default memo(WorkspaceQuickStats);

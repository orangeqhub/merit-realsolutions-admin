import { MAP_STATUS_COLORS } from './constants/mapStatus';

export default function PlotStatusBar({ layoutName, plotCount, mappedCount, mapTypeLabel }) {
  return (
    <div className="plot-map-statusbar">
      <span>{layoutName}</span>
      <span className="plot-map-statusbar__dot" />
      <span>{plotCount} plots</span>
      <span className="plot-map-statusbar__dot" />
      <span>{mappedCount} on map</span>
      <span className="plot-map-statusbar__dot" />
      <span>{mapTypeLabel}</span>
      <span className="plot-map-statusbar__provider">OpenStreetMap</span>
    </div>
  );
}

export function MapStatus({ status }) {
  const meta = MAP_STATUS_COLORS[status] || MAP_STATUS_COLORS.Available;
  return (
    <span
      className="map-status"
      style={{ background: meta.fill, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  );
}

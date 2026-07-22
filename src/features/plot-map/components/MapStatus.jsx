import { MAP_STATUS_COLORS } from '../constants/mapStatus';

export default function MapStatus({ status }) {
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

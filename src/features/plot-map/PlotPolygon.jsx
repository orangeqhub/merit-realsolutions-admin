import { MAP_STATUS_COLORS } from './constants/mapStatus';

/**
 * Future polygon plot rendering.
 * Architecture placeholder — polygonPoints stored on plot records.
 */
export default function PlotPolygon({
  plot,
  map,
  selected = false,
  onClick,
}) {
  if (!plot?.polygonPoints?.length || plot.polygonPoints.length < 3) return null;

  const colors = MAP_STATUS_COLORS[plot.status] || MAP_STATUS_COLORS.Available;
  const points = plot.polygonPoints
    .map((pt) => {
      const lat = pt.lat ?? pt.latitude;
      const lng = pt.lng ?? pt.longitude;
      if (lat == null || lng == null) return null;
      const p = map.latLngToContainerPoint([lat, lng]);
      return `${p.x},${p.y}`;
    })
    .filter(Boolean)
    .join(' ');

  if (!points) return null;

  return (
    <g
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(plot);
      }}
    >
      <polygon
        points={points}
        fill={colors.fill}
        fillOpacity={0.88}
        stroke={selected ? '#ffffff' : colors.border}
        strokeWidth={selected ? 3 : 2}
        filter="url(#plot-shadow)"
      />
      <text
        x={map.latLngToContainerPoint([
          plot.latitude,
          plot.longitude,
        ]).x}
        y={map.latLngToContainerPoint([
          plot.latitude,
          plot.longitude,
        ]).y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={12}
        fontWeight={800}
        style={{ pointerEvents: 'none' }}
      >
        {plot.plotNumber}
      </text>
    </g>
  );
}

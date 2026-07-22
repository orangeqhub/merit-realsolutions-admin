import { motion } from 'framer-motion';
import { MAP_STATUS_COLORS } from './constants/mapStatus';
import { getPlotDimensions } from './utils/overlayUtils';

export default function PlotRectangle({
  plot,
  point,
  zoom,
  selected = false,
  hovered = false,
  onClick,
  onHover,
}) {
  const colors = MAP_STATUS_COLORS[plot.status] || MAP_STATUS_COLORS.Available;
  const { width, height, rotation } = getPlotDimensions(plot, zoom);
  const halfW = width / 2;
  const halfH = height / 2;
  const active = selected || hovered;

  return (
    <motion.g
      transform={`translate(${point.x}, ${point.y}) rotate(${rotation})`}
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: active ? 1.06 : 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(plot);
      }}
      onMouseEnter={() => onHover?.(plot.id)}
      onMouseLeave={() => onHover?.(null)}
      role="button"
      aria-label={`Plot ${plot.plotNumber}, ${plot.status}`}
    >
      <rect
        x={-halfW}
        y={-halfH}
        width={width}
        height={height}
        rx={12}
        ry={12}
        fill={colors.fill}
        stroke={selected ? '#ffffff' : colors.border}
        strokeWidth={selected ? 3 : 2}
        filter="url(#plot-shadow)"
        className="plot-rect__shape"
      />
      {selected ? (
        <rect
          x={-halfW - 4}
          y={-halfH - 4}
          width={width + 8}
          height={height + 8}
          rx={14}
          ry={14}
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      ) : null}
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={Math.max(10, Math.min(13, width * 0.18))}
        fontWeight={800}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {plot.plotNumber}
      </text>
    </motion.g>
  );
}

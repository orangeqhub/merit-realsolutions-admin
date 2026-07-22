import { motion } from 'framer-motion';
import { MAP_STATUS_COLORS } from '../constants/mapStatus';

export default function PlotBlock({
  plot,
  selected = false,
  onClick,
  scale = 1,
}) {
  const colors = MAP_STATUS_COLORS[plot.status] || MAP_STATUS_COLORS.Available;
  const width = (plot.mapWidth || 72) * scale;
  const height = (plot.mapHeight || 48) * scale;
  const rotation = plot.rotation || 0;

  return (
    <motion.button
      type="button"
      className={`plot-block ${selected ? 'plot-block--selected' : ''}`}
      style={{
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        background: colors.fill,
        borderColor: colors.border,
        boxShadow: selected
          ? `0 0 0 3px rgba(255,255,255,0.95), 0 12px 28px rgba(10,22,40,0.35)`
          : '0 8px 20px rgba(10,22,40,0.22)',
      }}
      whileHover={{ scale: 1.06, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(plot);
      }}
      aria-label={`Plot ${plot.plotNumber}, ${plot.status}`}
    >
      <span className="plot-block__label">{plot.plotNumber}</span>
    </motion.button>
  );
}

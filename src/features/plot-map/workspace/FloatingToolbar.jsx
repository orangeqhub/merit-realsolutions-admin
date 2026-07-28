import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  FiMaximize2,
  FiMinimize2,
  FiLayers,
  FiZoomIn,
  FiZoomOut,
  FiCrosshair,
  FiEdit3,
  FiMinus,
} from 'react-icons/fi';

const TOOLS = [
  { id: 'zoomIn', label: 'Zoom In', icon: FiZoomIn, enabled: true },
  { id: 'zoomOut', label: 'Zoom Out', icon: FiZoomOut, enabled: true },
  { id: 'reset', label: 'Reset View', icon: FiCrosshair, enabled: true },
  { id: 'layers', label: 'Layers', icon: FiLayers, enabled: true },
  { id: 'measure', label: 'Measure', icon: FiMinus, enabled: false },
  { id: 'draw', label: 'Draw', icon: FiEdit3, enabled: false },
  { id: 'fullscreen', label: 'Fullscreen', icon: FiMaximize2, enabled: true },
];

function FloatingToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleLayers,
  onToggleFullscreen,
  isFullscreen = false,
  mapType = 'satellite',
}) {
  const handlers = {
    zoomIn: onZoomIn,
    zoomOut: onZoomOut,
    reset: onReset,
    layers: onToggleLayers,
    fullscreen: onToggleFullscreen,
  };

  return (
    <motion.aside
      className="ws-float-toolbar"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      aria-label="Map tools"
    >
      {TOOLS.map((tool) => {
        const Icon = tool.id === 'fullscreen' && isFullscreen ? FiMinimize2 : tool.icon;
        const enabled = tool.enabled;
        const title = enabled
          ? tool.id === 'layers'
            ? `Basemap: ${mapType === 'satellite' ? 'Satellite' : 'Standard'}`
            : tool.label
          : 'Coming Soon';

        return (
          <button
            key={tool.id}
            type="button"
            className={`ws-float-toolbar__btn ${!enabled ? 'is-disabled' : ''} ${
              tool.id === 'layers' ? 'is-layers' : ''
            }`}
            onClick={enabled ? handlers[tool.id] : undefined}
            disabled={!enabled}
            title={title}
            aria-label={title}
          >
            <Icon />
          </button>
        );
      })}
    </motion.aside>
  );
}

export default memo(FloatingToolbar);

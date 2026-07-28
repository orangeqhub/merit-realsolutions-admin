import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiMaximize2,
  FiMinimize2,
  FiLayers,
  FiZoomIn,
  FiZoomOut,
  FiCrosshair,
  FiCompass,
  FiMap,
} from 'react-icons/fi';

function formatScaleLabel(zoom = 18, lat = 16.5) {
  const metersPerPixel =
    (156543.03392 * Math.cos((Number(lat) * Math.PI) / 180)) / Math.pow(2, Number(zoom) || 18);
  const feet = metersPerPixel * 100;
  if (feet >= 5280) return `~${(feet / 5280).toFixed(1)} mi`;
  if (feet >= 1000) return `~${Math.round(feet)} ft`;
  if (feet >= 100) return `~${Math.round(feet / 10) * 10} ft`;
  return `~${Math.max(10, Math.round(feet / 5) * 5)} ft`;
}

function WorkspaceMapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleLayers,
  onToggleRoadLayer,
  showRoadLayer = true,
  onToggleFullscreen,
  isFullscreen = false,
  mapType = 'satellite',
  mapZoom = 18,
  mapCenter = null,
}) {
  const scaleLabel = useMemo(
    () => formatScaleLabel(mapZoom, mapCenter?.lat),
    [mapZoom, mapCenter?.lat]
  );

  const basemapLabel = mapType === 'satellite' ? 'Satellite' : 'Standard';

  return (
    <motion.aside
      className="ws-p1-map-controls"
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.36, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Map controls"
    >
      <div className="ws-p1-map-controls__group">
        <button
          type="button"
          className="ws-p1-map-controls__btn"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <FiZoomIn />
        </button>
        <button
          type="button"
          className="ws-p1-map-controls__btn"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <FiZoomOut />
        </button>
      </div>

      <div className="ws-p1-map-controls__group ws-p1-map-controls__group--compass" aria-hidden>
        <div className="ws-p1-map-controls__compass">
          <FiCompass />
          <span>N</span>
        </div>
      </div>

      <div className="ws-p1-map-controls__group ws-p1-map-controls__scale" aria-label="Map scale">
        <span className="ws-p1-map-controls__scale-bar" />
        <span className="ws-p1-map-controls__scale-label">{scaleLabel}</span>
      </div>

      <div className="ws-p1-map-controls__group">
        <button
          type="button"
          className="ws-p1-map-controls__btn"
          onClick={onReset}
          title="Reset view"
          aria-label="Reset view"
        >
          <FiCrosshair />
        </button>
        <button
          type="button"
          className={`ws-p1-map-controls__btn${showRoadLayer ? ' is-active-soft' : ''}`}
          onClick={onToggleRoadLayer}
          title={showRoadLayer ? 'Hide road layer' : 'Show road layer'}
          aria-label={showRoadLayer ? 'Hide road layer' : 'Show road layer'}
          aria-pressed={showRoadLayer}
        >
          <FiMap />
        </button>
        <button
          type="button"
          className="ws-p1-map-controls__btn is-active-soft"
          onClick={onToggleLayers}
          title={`Basemap: ${basemapLabel}`}
          aria-label={`Basemap: ${basemapLabel}`}
        >
          <FiLayers />
        </button>
        <button
          type="button"
          className="ws-p1-map-controls__btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>
    </motion.aside>
  );
}

export default memo(WorkspaceMapControls);

import { motion } from 'framer-motion';
import { FiCrosshair, FiMapPin, FiTarget } from 'react-icons/fi';
import { formatCoordinate } from './utils/coordinateUtils';
import { MapStatus } from './PlotStatusBar';

export default function CoordinatePanel({ liveCoords, frozenCoords, selectedPlot }) {
  const display = frozenCoords || liveCoords;

  return (
    <motion.aside
      className="plot-map-panel plot-map-panel--coords"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="plot-map-panel__head">
        <FiCrosshair />
        <div>
          <h3>Live Coordinates</h3>
          <p>Move cursor over map · click to place plot</p>
        </div>
      </div>

      <div className="plot-map-panel__coords">
        <div className="plot-map-panel__coord">
          <span>Latitude</span>
          <strong>{formatCoordinate(display?.lat)}</strong>
        </div>
        <div className="plot-map-panel__coord">
          <span>Longitude</span>
          <strong>{formatCoordinate(display?.lng)}</strong>
        </div>
      </div>

      {frozenCoords ? (
        <div className="plot-map-panel__badge plot-map-panel__badge--frozen">
          <FiTarget /> Coordinates frozen — creating plot
        </div>
      ) : (
        <div className="plot-map-panel__badge">
          <FiMapPin /> Tracking live pointer
        </div>
      )}

      {selectedPlot ? (
        <div className="plot-map-panel__selected">
          <span>Selected Plot</span>
          <strong>{selectedPlot.plotNumber}</strong>
          <MapStatus status={selectedPlot.status} />
        </div>
      ) : null}
    </motion.aside>
  );
}

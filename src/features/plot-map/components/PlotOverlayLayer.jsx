import { OverlayViewF } from '@react-google-maps/api';
import PlotBlock from './PlotBlock';

export default function PlotOverlayLayer({ plots = [], selectedPlotId, onPlotClick, zoom = 15 }) {
  const scale = Math.max(0.65, Math.min(1.35, (zoom - 12) * 0.12 + 0.85));

  return plots
    .filter((plot) => plot.latitude != null && plot.longitude != null)
    .map((plot) => (
      <OverlayViewF
        key={plot.id}
        position={{ lat: Number(plot.latitude), lng: Number(plot.longitude) }}
        mapPaneName="overlayMouseTarget"
        getPixelPositionOffset={(width, height) => ({
          x: -(width / 2),
          y: -(height / 2),
        })}
      >
        <PlotBlock
          plot={plot}
          selected={plot.id === selectedPlotId}
          onClick={onPlotClick}
          scale={scale}
        />
      </OverlayViewF>
    ));
}

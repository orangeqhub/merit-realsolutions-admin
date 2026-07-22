import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap, useMapEvents } from 'react-leaflet';
import PlotRectangle from './PlotRectangle';
import PlotPolygon from './PlotPolygon';
import { filterPlottablePlots, isPolygonPlot, isRectanglePlot } from './utils/overlayUtils';

function SvgDefs() {
  return (
    <defs>
      <filter id="plot-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(10,22,40,0.35)" />
      </filter>
    </defs>
  );
}

function MapViewportSync({ onViewportChange }) {
  const map = useMap();

  const sync = useCallback(() => {
    const size = map.getSize();
    onViewportChange({
      zoom: map.getZoom(),
      width: size.x,
      height: size.y,
      tick: Date.now(),
    });
  }, [map, onViewportChange]);

  useMapEvents({
    move: sync,
    zoom: sync,
    zoomanim: sync,
    resize: sync,
  });

  useEffect(() => {
    sync();
    map.on('move', sync);
    map.on('zoom', sync);
    map.on('resize', sync);
    return () => {
      map.off('move', sync);
      map.off('zoom', sync);
      map.off('resize', sync);
    };
  }, [map, sync]);

  return null;
}

export default function PlotOverlayLayer({
  plots = [],
  selectedPlotId,
  onPlotClick,
}) {
  const map = useMap();
  const [viewport, setViewport] = useState({ zoom: map.getZoom(), width: 0, height: 0, tick: 0 });
  const [overlayPane, setOverlayPane] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    setOverlayPane(map.getPanes().overlayPane);
  }, [map]);

  const plottable = filterPlottablePlots(plots);
  const size = map.getSize();
  const width = size.x || viewport.width;
  const height = size.y || viewport.height;

  if (!overlayPane || !width || !height) {
    return <MapViewportSync onViewportChange={setViewport} />;
  }

  return (
    <>
      <MapViewportSync onViewportChange={setViewport} />
      {createPortal(
        <svg
          className="plot-svg-layer"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden={plottable.length === 0}
        >
          <SvgDefs />
          {plottable.map((plot) => {
            if (isPolygonPlot(plot)) {
              return (
                <PlotPolygon
                  key={plot.id}
                  plot={plot}
                  map={map}
                  selected={plot.id === selectedPlotId}
                  onClick={onPlotClick}
                />
              );
            }

            if (!isRectanglePlot(plot)) return null;

            const point = map.latLngToContainerPoint([
              Number(plot.latitude),
              Number(plot.longitude),
            ]);

            return (
              <PlotRectangle
                key={`${plot.id}-${viewport.tick}`}
                plot={plot}
                point={point}
                zoom={viewport.zoom}
                selected={plot.id === selectedPlotId}
                hovered={plot.id === hoveredId}
                onClick={onPlotClick}
                onHover={setHoveredId}
              />
            );
          })}
        </svg>,
        overlayPane
      )}
    </>
  );
}

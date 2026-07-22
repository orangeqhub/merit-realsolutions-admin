import { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import PlotOverlayLayer from './PlotOverlayLayer';
import { resolveMapCenter } from './utils/coordinateUtils';
import { MAP_TILE_LAYERS, DEFAULT_MAP_ZOOM, MIN_MAP_ZOOM, MAX_MAP_ZOOM } from './utils/mapHelpers';

function MapInteractionBridge({ onMapClick, onMouseMove, onMapReady }) {
  const map = useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mousemove(e) {
      onMouseMove?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);

  return null;
}

export default function OpenStreetMapCanvas({
  venture,
  layout,
  plots = [],
  selectedPlotId,
  mapType = 'roadmap',
  onMapClick,
  onMouseMove,
  onPlotClick,
  onMapReady,
}) {
  const center = resolveMapCenter(venture, layout);
  const tiles = MAP_TILE_LAYERS[mapType] || MAP_TILE_LAYERS.roadmap;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      minZoom={MIN_MAP_ZOOM}
      maxZoom={MAX_MAP_ZOOM}
      className="plot-leaflet-map"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        key={mapType}
        url={tiles.url}
        attribution={tiles.attribution}
        maxZoom={MAX_MAP_ZOOM}
      />
      <MapInteractionBridge
        onMapClick={onMapClick}
        onMouseMove={onMouseMove}
        onMapReady={onMapReady}
      />
      <PlotOverlayLayer
        plots={plots}
        selectedPlotId={selectedPlotId}
        onPlotClick={onPlotClick}
      />
    </MapContainer>
  );
}

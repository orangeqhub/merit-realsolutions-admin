import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import PlotPolygonLayer from './PlotPolygonLayer';
import { MapZoomBridge } from './LayoutMapChrome';
import { resolveMapView } from './utils/coordinateUtils';
import { clampMapZoom, getTileLayerOptions, MIN_MAP_ZOOM, MAX_MAP_ZOOM } from './utils/mapHelpers';
import { getPolygonPositions } from './utils/polygonUtils';

function MapReadyBridge({ onMouseMove, onMapReady }) {
  const map = useMapEvents({
    mousemove(e) {
      onMouseMove?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);

  return null;
}

function MapViewController({ center, zoom, layoutId, mapType, disabled = false }) {
  const map = useMap();

  useEffect(() => {
    if (disabled) return;
    const targetZoom = clampMapZoom(Math.max(zoom, 18), mapType);
    map.setView([center.lat, center.lng], targetZoom, { animate: false });
    window.requestAnimationFrame(() => map.invalidateSize());
  }, [center.lat, center.lng, disabled, layoutId, map, mapType, zoom]);

  return null;
}

function PlotFocusController({ focusPlotId, focusRequest = 0, plots = [] }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPlotId) return;
    const plot = plots.find((item) => item.id === focusPlotId);
    if (!plot) return;

    const positions = getPolygonPositions(plot.polygonPoints);
    if (positions.length < 3) return;

    map.fitBounds(L.latLngBounds(positions), {
      padding: [72, 72],
      maxZoom: 20,
      animate: true,
    });
  }, [focusPlotId, focusRequest, map, plots]);

  return null;
}

function LayoutPinMarker({ center }) {
  if (!center) return null;

  return (
    <CircleMarker
      center={[center.lat, center.lng]}
      radius={11}
      pathOptions={{
        color: '#c2410c',
        fillColor: '#fb923c',
        fillOpacity: 0.9,
        weight: 3,
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="plot-map-layout-pin-tooltip">
        Layout pin (Google Maps)
      </Tooltip>
    </CircleMarker>
  );
}

export default function OpenStreetMapCanvas({
  venture,
  layout,
  plots = [],
  previewPlot = null,
  generatedPreviewPlots = [],
  generatedPreviewRoads = [],
  generatedPreviewAmenities = [],
  generatedBlockLabels = [],
  layoutBoundary = [],
  mapZoom = 18,
  savedLayoutActive = false,
  selectedPlotId,
  hoveredPlotId,
  highlightedPlotIds = [],
  focusPlotId,
  focusRequest = 0,
  allPlots = [],
  mapType = 'satellite',
  onMouseMove,
  onPlotClick,
  onPlotHover,
  onBlockClusterClick,
  onMapReady,
  onZoomChange,
}) {
  const { center, zoom: rawZoom } = resolveMapView(venture, layout);
  const zoom = clampMapZoom(rawZoom, mapType);
  const tiles = getTileLayerOptions(mapType);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
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
        maxZoom={tiles.maxZoom}
        maxNativeZoom={tiles.maxNativeZoom}
      />
      <MapViewController
        center={center}
        zoom={zoom}
        layoutId={layout?.id}
        mapType={mapType}
        disabled={plots.length > 0 || generatedPreviewPlots.length > 0}
      />
      <MapReadyBridge onMouseMove={onMouseMove} onMapReady={onMapReady} />
      <MapZoomBridge onZoomChange={onZoomChange} />
      <LayoutPinMarker center={center} />
      <PlotFocusController focusPlotId={focusPlotId} focusRequest={focusRequest} plots={allPlots} />
      <PlotPolygonLayer
        plots={plots}
        previewPlot={previewPlot}
        generatedPreviewPlots={generatedPreviewPlots}
        generatedPreviewRoads={generatedPreviewRoads}
        generatedPreviewAmenities={generatedPreviewAmenities}
        generatedBlockLabels={generatedBlockLabels}
        layoutBoundary={layoutBoundary}
        layout={layout}
        mapZoom={mapZoom}
        layoutKey={layout?.id}
        savedLayoutActive={savedLayoutActive}
        selectedPlotId={selectedPlotId}
        hoveredPlotId={hoveredPlotId}
        highlightedPlotIds={highlightedPlotIds}
        onPlotClick={onPlotClick}
        onPlotHover={onPlotHover}
        onBlockClusterClick={onBlockClusterClick}
      />
    </MapContainer>
  );
}

import { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import PlotOverlayLayer from './PlotOverlayLayer';
import { resolveMapCenter } from '../utils/coordinates';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const BASE_OPTIONS = {
  disableDefaultUI: true,
  clickableIcons: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
};

export default function GoogleMapCanvas({
  venture,
  layout,
  plots = [],
  selectedPlotId,
  mapType = 'satellite',
  onMapClick,
  onMouseMove,
  onPlotClick,
  onMapReady,
  centerOverride,
  zoomOverride,
}) {
  const mapRef = useRef(null);
  const [zoom, setZoom] = useState(zoomOverride || 18);
  const center = centerOverride || resolveMapCenter(venture, layout);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'merit-plot-map',
  });

  const handleLoad = useCallback(
    (map) => {
      mapRef.current = map;
      onMapReady?.(map);
      map.addListener('mousemove', (e) => {
        onMouseMove?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    },
    [onMapReady, onMouseMove]
  );

  const handleClick = useCallback(
    (e) => {
      onMapClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    },
    [onMapClick]
  );

  if (!apiKey) {
    return (
      <div className="plot-map-fallback">
        <h3>Google Maps API key required</h3>
        <p>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="plot-map-fallback plot-map-fallback--error">
        <h3>Unable to load Google Maps</h3>
        <p>{loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="plot-map-fallback plot-map-fallback--loading">Loading map…</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={zoom}
      onLoad={handleLoad}
      onClick={handleClick}
      onZoomChanged={() => {
        if (mapRef.current) setZoom(mapRef.current.getZoom());
      }}
      options={{
        ...BASE_OPTIONS,
        mapTypeId: mapType,
      }}
    >
      <PlotOverlayLayer
        plots={plots}
        selectedPlotId={selectedPlotId}
        onPlotClick={onPlotClick}
        zoom={zoom}
      />
    </GoogleMap>
  );
}

export function useMapControls(mapRef, center) {
  const zoomIn = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(mapRef.current.getZoom() + 1);
  }, [mapRef]);

  const zoomOut = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(mapRef.current.getZoom() - 1);
  }, [mapRef]);

  const centerMap = useCallback(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.panTo(center);
    mapRef.current.setZoom(18);
  }, [center, mapRef]);

  return { zoomIn, zoomOut, centerMap };
}

import { useCallback } from 'react';
import { resolveMapView } from '../utils/coordinateUtils';
import { clampMapZoom } from '../utils/mapHelpers';

export function useLeafletMap(mapRef, venture, layout, mapType = 'satellite') {
  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, [mapRef]);

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, [mapRef]);

  const centerMap = useCallback(() => {
    if (!mapRef.current) return;
    const { center, zoom } = resolveMapView(venture, layout);
    mapRef.current.setView(
      [center.lat, center.lng],
      clampMapZoom(Math.max(zoom, 18), mapType),
      { animate: true }
    );
  }, [layout, mapRef, mapType, venture]);

  return { zoomIn, zoomOut, centerMap };
}

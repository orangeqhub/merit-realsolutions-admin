import { useCallback } from 'react';

export function useLeafletMap(mapRef, center) {
  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, [mapRef]);

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, [mapRef]);

  const centerMap = useCallback(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.setView([center.lat, center.lng], 18, { animate: true });
  }, [center, mapRef]);

  return { zoomIn, zoomOut, centerMap };
}

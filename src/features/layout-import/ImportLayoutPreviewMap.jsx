import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { collectAllPreviewPositions } from '../../services/layoutGeneration';

const OpenStreetMapCanvas = lazy(() => import('../plot-map/OpenStreetMapCanvas'));

export default function ImportLayoutPreviewMap({
  preview,
  layout,
  venture,
  className = '',
}) {
  const mapRef = useRef(null);

  const mapView = useMemo(() => {
    const lat = Number(preview?.layoutMeta?.centerLatitude);
    const lng = Number(preview?.layoutMeta?.centerLongitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { center: { lat, lng }, zoom: 17 };
    }
    const firstPlot = preview?.plots?.[0];
    if (firstPlot?.latitude != null && firstPlot?.longitude != null) {
      return { center: { lat: firstPlot.latitude, lng: firstPlot.longitude }, zoom: 17 };
    }
    return { center: { lat: 16.55628, lng: 80.38521 }, zoom: 17 };
  }, [preview]);

  const previewLayout = useMemo(() => {
    const lat = Number(mapView.center?.lat);
    const lng = Number(mapView.center?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return layout;
    return { ...layout, centerLat: lat, centerLng: lng };
  }, [layout, mapView.center?.lat, mapView.center?.lng]);

  const plots = preview?.plots || [];
  const roads = preview?.roads || [];
  const amenities = preview?.amenities || [];

  useEffect(() => {
    if (!mapRef.current || !plots.length) return;
    const positions = collectAllPreviewPositions(plots, roads, amenities, []);
    if (positions.length < 3) return;
    mapRef.current.fitBounds(positions, { padding: [56, 56], maxZoom: 19, animate: true });
  }, [plots, roads, amenities]);

  return (
    <div className={`layout-import-preview-map ${className}`.trim()}>
      <Suspense fallback={<div className="layout-import-preview-map__loading">Loading map preview…</div>}>
        <OpenStreetMapCanvas
          layout={previewLayout}
          venture={venture}
          plots={[]}
          generatedPreviewPlots={plots}
          generatedPreviewRoads={roads}
          generatedPreviewAmenities={amenities}
          generatedBlockLabels={[]}
          savedLayoutActive={false}
          layoutBoundary={[]}
          mapType="satellite"
          onMapReady={(map) => {
            mapRef.current = map;
          }}
        />
      </Suspense>
    </div>
  );
}

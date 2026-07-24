import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { getPolygonPositions } from '../../features/plot-map/utils/polygonUtils';
import '../../features/plot-map/styles/plot-map.css';
import './ImportMapPreview.css';

const OpenStreetMapCanvas = lazy(
  () => import('../../features/plot-map/OpenStreetMapCanvas')
);

function MapBoundsFitter({ plots, layout, venture }) {
  const mapRef = useRef(null);

  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !plots?.length) return;

    const allPositions = plots.flatMap((plot) => getPolygonPositions(plot.polygonPoints));
    if (allPositions.length < 3) return;

    map.fitBounds(allPositions, { padding: [48, 48], maxZoom: 17, animate: false });
    window.requestAnimationFrame(() => map.invalidateSize());
  }, [plots]);

  return (
    <OpenStreetMapCanvas
      venture={venture}
      layout={layout}
      plots={plots}
      mapType="satellite"
      onMapReady={handleMapReady}
    />
  );
}

export default function ImportMapPreview({ layout, venture, previewPlots = [] }) {
  const plots = useMemo(
    () =>
      previewPlots.map((plot) => ({
        ...plot,
        status: plot.status || 'Available',
        shapeType: 'POLYGON',
      })),
    [previewPlots]
  );

  if (!plots.length) {
    return (
      <div className="plot-import-map plot-import-map--empty">
        No valid plot polygons to preview.
      </div>
    );
  }

  return (
    <div className="plot-import-map">
      <Suspense fallback={<div className="plot-import-map plot-import-map--loading">Loading map…</div>}>
        <MapBoundsFitter plots={plots} layout={layout} venture={venture} />
      </Suspense>
    </div>
  );
}

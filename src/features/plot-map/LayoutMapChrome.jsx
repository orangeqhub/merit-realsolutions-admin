import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const MIN_LABEL_ZOOM = 17;

export function MapZoomBridge({ onZoomChange }) {
  const map = useMap();

  useMapEvents({
    zoomend() {
      onZoomChange?.(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange?.(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export function useMapLabelVisibility(defaultZoom = 18) {
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const showDetailLabels = mapZoom >= MIN_LABEL_ZOOM;
  return { mapZoom, setMapZoom, showDetailLabels, MIN_LABEL_ZOOM };
}

export default function LayoutMapChrome({ showLegend = true }) {
  return (
    <div className="layout-map-chrome" aria-hidden="true">
      <div className="layout-map-chrome__north" title="North">
        <span className="layout-map-chrome__north-arrow">↑</span>
        <span>N</span>
      </div>
      {showLegend ? (
        <div className="layout-map-chrome__legend">
          <span><i className="layout-map-chrome__swatch layout-map-chrome__swatch--plot" /> Plot</span>
          <span><i className="layout-map-chrome__swatch layout-map-chrome__swatch--main-road" /> Main Road</span>
          <span><i className="layout-map-chrome__swatch layout-map-chrome__swatch--internal-road" /> Internal</span>
          <span><i className="layout-map-chrome__swatch layout-map-chrome__swatch--amenity" /> Amenity</span>
        </div>
      ) : null}
      <div className="layout-map-chrome__scale">
        <span className="layout-map-chrome__scale-bar" />
        <span>~100 ft</span>
      </div>
    </div>
  );
}

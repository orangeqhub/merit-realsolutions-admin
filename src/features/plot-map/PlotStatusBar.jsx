import { MAP_STATUS_COLORS } from './constants/mapStatus';
import { formatCoordinate } from './utils/coordinateUtils';

const SOURCE_LABELS = {
  'layout-map-url': 'Layout Google Maps URL',
  'layout-coordinates': 'Layout coordinates',
  'layout-center': 'Layout center',
  'venture-map-url': 'Venture Google Maps URL',
  'venture-coordinates': 'Venture coordinates',
  'default-fallback': 'Default location',
};

export default function PlotStatusBar({
  layoutName,
  plotCount,
  mappedCount,
  mapTypeLabel,
  mapCenter,
  centerSource,
  generatedPreviewCount = 0,
  generatedRoadCount = 0,
  generatedAmenityCount = 0,
}) {
  return (
    <div className="plot-map-statusbar">
      <span>{layoutName}</span>
      <span className="plot-map-statusbar__dot" />
      <span>{plotCount} plots</span>
      <span className="plot-map-statusbar__dot" />
      <span>{mappedCount} on map</span>
      {generatedPreviewCount > 0 ? (
        <>
          <span className="plot-map-statusbar__dot" />
          <span className="plot-map-statusbar__source">
            {generatedPreviewCount} plot preview
            {generatedRoadCount > 0 ? ` · ${generatedRoadCount} roads` : ''}
            {generatedAmenityCount > 0 ? ` · ${generatedAmenityCount} amenities` : ''}
          </span>
        </>
      ) : null}
      <span className="plot-map-statusbar__dot" />
      <span>{mapTypeLabel}</span>
      {mapCenter ? (
        <>
          <span className="plot-map-statusbar__dot" />
          <span>
            {formatCoordinate(mapCenter.lat)}, {formatCoordinate(mapCenter.lng)}
          </span>
        </>
      ) : null}
      {centerSource ? (
        <span className="plot-map-statusbar__source">
          {SOURCE_LABELS[centerSource] || centerSource}
        </span>
      ) : null}
    </div>
  );
}

export function MapStatus({ status }) {
  const meta = MAP_STATUS_COLORS[status] || MAP_STATUS_COLORS.Available;
  return (
    <span
      className="map-status"
      style={{ background: meta.fill, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  );
}

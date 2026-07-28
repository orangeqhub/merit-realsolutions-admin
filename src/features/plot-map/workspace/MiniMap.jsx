import { memo } from 'react';
import PremiumMiniMap from '@map-rendering/PremiumMiniMap.jsx';
import WorkspaceEmptyState from './WorkspaceEmptyState';

function MiniMap({
  plots = [],
  roads = [],
  amenities = [],
  boundary = [],
  viewport = null,
  center = null,
  onNavigate,
}) {
  return (
    <PremiumMiniMap
      plots={plots}
      roads={roads}
      amenities={amenities}
      boundary={boundary}
      viewport={viewport}
      onNavigate={onNavigate}
      className="ws-minimap"
      headerTitle="Site Overview"
      emptyFallback={(
        <div className="ws-minimap ws-minimap--empty">
          <div className="ws-minimap__header">
            <span>Site Overview</span>
          </div>
          <WorkspaceEmptyState
            icon="map"
            title="Overview unavailable"
            description={center ? `${Number(center.lat).toFixed(5)}, ${Number(center.lng).toFixed(5)}` : 'Add mapped plots to enable navigation.'}
            compact
          />
        </div>
      )}
    />
  );
}

export default memo(MiniMap);

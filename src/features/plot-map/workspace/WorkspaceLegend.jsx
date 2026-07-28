import { memo } from 'react';
import PremiumLegend from '@map-rendering/PremiumLegend.jsx';

function WorkspaceLegend({ plots = [], activeStatuses = [], onToggleStatus, onHoverStatus }) {
  return (
    <PremiumLegend
      plots={plots}
      activeStatuses={activeStatuses}
      className="ws-legend"
      itemClassName="ws-legend__item"
      swatchClassName="ws-legend__swatch"
      labelClassName="ws-legend__label"
      interactive
      onToggleStatus={onToggleStatus}
      onHoverStatus={onHoverStatus}
    />
  );
}

export default memo(WorkspaceLegend);

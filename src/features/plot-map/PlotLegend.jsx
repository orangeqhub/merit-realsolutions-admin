import { useMemo } from 'react';
import { MAP_LEGEND_ITEMS } from './constants/mapStatus';
import { countPlotsByStatus } from './utils/mapHelpers';

export default function PlotLegend({
  plots = [],
  activeStatuses = [],
  onToggleStatus,
}) {
  const counts = useMemo(() => countPlotsByStatus(plots), [plots]);

  return (
    <div className="plot-map-legend">
      <span className="plot-map-legend__title">Legend</span>
      <div className="plot-map-legend__items">
        {MAP_LEGEND_ITEMS.map((item) => {
          const isActive = activeStatuses.includes(item.status);
          const isFiltering = activeStatuses.length > 0;

          return (
            <button
              key={item.status}
              type="button"
              className={[
                'plot-map-legend__item',
                isActive ? 'is-active' : '',
                isFiltering && !isActive ? 'is-dimmed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onToggleStatus?.(item.status)}
              title={`Filter ${item.label} plots`}
            >
              <i style={{ background: item.fill, borderColor: item.border }} />
              <span>{item.label}</span>
              <strong>{counts[item.status] ?? 0}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

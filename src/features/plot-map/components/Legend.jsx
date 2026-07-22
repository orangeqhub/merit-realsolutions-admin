import { MAP_LEGEND_ITEMS } from '../constants/mapStatus';

export default function Legend() {
  return (
    <div className="plot-map-legend">
      <span className="plot-map-legend__title">Legend</span>
      <div className="plot-map-legend__items">
        {MAP_LEGEND_ITEMS.map((item) => (
          <div key={item.status} className="plot-map-legend__item">
            <i style={{ background: item.fill, borderColor: item.border }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

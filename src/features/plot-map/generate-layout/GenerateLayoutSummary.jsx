import {
  FiGrid,
  FiMaximize2,
  FiPercent,
  FiTrendingUp,
  FiTruck,
  FiMap,
  FiDollarSign,
} from 'react-icons/fi';

function formatArea(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toLocaleString('en-IN')} Sq.Yd`;
}

function formatPct(part, total) {
  if (!total || !Number.isFinite(part)) return '—';
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function formatRevenue(value) {
  if (!value || !Number.isFinite(value)) return null;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export default function GenerateLayoutSummary({
  summary,
  roadCounts,
  estimatedRevenue,
  variant = 'full',
}) {
  if (!summary) return null;

  const totalArea = summary.totalLayoutAreaSqYds || 0;
  const saleable = summary.saleableAreaSqYds || 0;
  const openSpace = (summary.roadAreaSqYds || 0) + (summary.amenityAreaSqYds || 0);
  const revenue = formatRevenue(estimatedRevenue);

  if (variant === 'sticky') {
    const chips = [
      { icon: FiGrid, label: 'Plots', value: summary.plots ?? 0 },
      { icon: FiMaximize2, label: 'Area', value: formatArea(saleable) },
      { icon: FiPercent, label: 'Saleable', value: formatPct(saleable, totalArea) },
      { icon: FiTrendingUp, label: 'Open', value: formatPct(openSpace, totalArea) },
      { icon: FiTruck, label: 'Main', value: roadCounts?.main ?? 0 },
      { icon: FiMap, label: 'Internal', value: roadCounts?.horizontalRoads ?? 0 },
      { icon: FiMap, label: 'Service', value: roadCounts?.verticalRoads ?? 0 },
    ];

    return (
      <div className="ui31-gen-sticky-summary" aria-live="polite">
        <div className="ui31-gen-sticky-summary__head">
          <span className="ui31-gen-sticky-summary__title">Live Summary</span>
          {revenue ? (
            <span className="ui31-gen-sticky-summary__revenue">
              <FiDollarSign aria-hidden />
              {revenue}
            </span>
          ) : null}
        </div>
        <div className="ui31-gen-sticky-summary__chips">
          {chips.map(({ icon: Icon, label, value }) => (
            <span key={label} className="ui31-gen-sticky-summary__chip">
              <Icon aria-hidden />
              <span className="ui31-gen-sticky-summary__chip-label">{label}</span>
              <strong>{value}</strong>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: FiGrid, label: 'Estimated Plots', value: summary.plots ?? 0 },
    { icon: FiMaximize2, label: 'Estimated Area', value: formatArea(saleable) },
    { icon: FiPercent, label: 'Saleable %', value: formatPct(saleable, totalArea) },
    { icon: FiTrendingUp, label: 'Open Space %', value: formatPct(openSpace, totalArea) },
    { icon: FiTruck, label: 'Main Roads', value: roadCounts?.main ?? 0 },
    { icon: FiMap, label: 'Internal Roads', value: roadCounts?.horizontalRoads ?? 0 },
    { icon: FiMap, label: 'Service Roads', value: roadCounts?.verticalRoads ?? 0 },
  ];

  return (
    <div className="ui3-gen-summary ui3-gen-summary--analytics" aria-live="polite">
      <div className="ui3-gen-summary__header">
        <span className="ui3-gen-summary__eyebrow">Live Summary</span>
        <p className="ui3-gen-summary__hint">Updates as you plan — no preview required</p>
      </div>
      <div className="ui3-gen-summary__grid">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className="ui3-gen-summary__metric">
            <span className="ui3-gen-summary__metric-icon" aria-hidden>
              <Icon />
            </span>
            <span className="ui3-gen-summary__metric-label">{label}</span>
            <strong className="ui3-gen-summary__metric-value">{value}</strong>
          </div>
        ))}
        {revenue ? (
          <div className="ui3-gen-summary__metric ui3-gen-summary__metric--revenue">
            <span className="ui3-gen-summary__metric-icon" aria-hidden>
              <FiDollarSign />
            </span>
            <span className="ui3-gen-summary__metric-label">Estimated Revenue</span>
            <strong className="ui3-gen-summary__metric-value">{revenue}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}

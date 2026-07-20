import "./charts.css";

export default function DonutChart({
  data = [],
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce((acc, d) => {
    const dash = (d.value / total) * circumference;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ ...d, dash, offset });
    return acc;
  }, []);

  return (
    <div className="erp-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--erp-hover)"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
            >
              <title>{`${seg.label}: ${seg.value}`}</title>
            </circle>
          ))}
        </g>
      </svg>
      {(centerLabel || centerValue) && (
        <div className="erp-donut__center">
          {centerValue != null && (
            <span className="erp-donut__value">{centerValue}</span>
          )}
          {centerLabel && <span className="erp-donut__label">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

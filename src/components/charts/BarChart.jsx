import "./charts.css";

export default function BarChart({
  data = [],
  height = 200,
  color = "var(--erp-accent)",
  valueFormatter = (v) => v,
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / (data.length * 1.6);
  const gap = barWidth * 0.6;

  return (
    <div className="erp-chart">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="erp-chart__svg"
        role="img"
      >
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1="0"
            x2="100"
            y1={height - g * (height - 24)}
            y2={height - g * (height - 24)}
            className="erp-chart__grid"
          />
        ))}
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 24);
          const x = i * (barWidth + gap) + gap;
          return (
            <rect
              key={i}
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx="1.5"
              fill={d.color || color}
              className="erp-chart__bar"
            >
              <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="erp-chart__labels">
        {data.map((d, i) => (
          <span key={i} className="erp-chart__label">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

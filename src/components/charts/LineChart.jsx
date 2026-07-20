import { useId } from "react";
import "./charts.css";

export default function LineChart({
  data = [],
  height = 200,
  color = "var(--erp-accent)",
  area = true,
}) {
  const gradId = useId().replace(/:/g, "");
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const pad = 6;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = pad + (1 - (d.value - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L 100 ${height} L 0 ${height} Z`;

  return (
    <div className="erp-chart">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="erp-chart__svg"
        role="img"
      >
        <defs>
          <linearGradient id={`line-grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={areaPath} fill={`url(#line-grad-${gradId})`} />}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.6" fill={color}>
            <title>{`${data[i].label}: ${data[i].value}`}</title>
          </circle>
        ))}
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

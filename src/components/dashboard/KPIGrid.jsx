import StatsCard from "../cards/StatsCard";
import "./KPIGrid.css";

export default function KPIGrid({
  items,
  columns = "auto",
  minWidth = 220,
  children,
  className = "",
}) {
  const style =
    columns === "auto"
      ? { gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }
      : { gridTemplateColumns: `repeat(${columns}, 1fr)` };

  return (
    <div className={`kpi-grid ${className}`.trim()} style={style}>
      {items
        ? items.map((item, i) => (
            <StatsCard key={item.label || i} delay={i * 0.05} {...item} />
          ))
        : children}
    </div>
  );
}

import "./ChartCard.css";

export default function ChartCard({
  title,
  subtitle,
  actions,
  legend,
  children,
  className = "",
}) {
  return (
    <section className={`chart-card ${className}`.trim()}>
      {(title || actions) && (
        <header className="chart-card__header">
          <div>
            {title && <h3 className="chart-card__title">{title}</h3>}
            {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="chart-card__actions">{actions}</div>}
        </header>
      )}

      <div className="chart-card__body">{children}</div>

      {legend && legend.length > 0 && (
        <footer className="chart-card__legend">
          {legend.map((item) => (
            <span className="chart-card__legend-item" key={item.label}>
              <span
                className="chart-card__legend-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </footer>
      )}
    </section>
  );
}

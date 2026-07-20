import "./InfoCard.css";

export default function InfoCard({
  title,
  icon,
  action,
  items,
  children,
  className = "",
}) {
  return (
    <section className={`info-card ${className}`.trim()}>
      {(title || action) && (
        <header className="info-card__header">
          <h3 className="info-card__title">
            {icon && <span className="info-card__icon">{icon}</span>}
            {title}
          </h3>
          {action && <div className="info-card__action">{action}</div>}
        </header>
      )}

      <div className="info-card__body">
        {items
          ? items.map((item, i) => (
              <div className="info-card__row" key={`${item.label}-${i}`}>
                <span className="info-card__row-label">{item.label}</span>
                <span className="info-card__row-value">{item.value || "—"}</span>
              </div>
            ))
          : children}
      </div>
    </section>
  );
}

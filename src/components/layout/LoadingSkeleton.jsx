import "./LoadingSkeleton.css";

function SkeletonLine({ size = "full" }) {
  return <span className={`erp-skeleton skeleton__line skeleton__line--${size}`} />;
}

export default function LoadingSkeleton({ variant = "text", count = 1, className = "" }) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div className={`skeleton-grid ${className}`.trim()}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-card">
            <span className="erp-skeleton skeleton-card__media" />
            <SkeletonLine size="lg" />
            <SkeletonLine size="sm" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`skeleton-table ${className}`.trim()}>
        {Array.from({ length: count > 1 ? count : 6 }).map((_, i) => (
          <div key={i} className="skeleton-table__row">
            <span className="erp-skeleton skeleton-table__cell skeleton-table__cell--sm" />
            <span className="erp-skeleton skeleton-table__cell skeleton-table__cell--lg" />
            <span className="erp-skeleton skeleton-table__cell skeleton-table__cell--md" />
            <span className="erp-skeleton skeleton-table__cell skeleton-table__cell--xs" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={`skeleton-form ${className}`.trim()}>
        {Array.from({ length: count > 1 ? count : 4 }).map((_, i) => (
          <div key={i} className="skeleton-form__field">
            <SkeletonLine size="sm" />
            <span className="erp-skeleton skeleton-form__control" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`skeleton-text ${className}`.trim()}>
      {items.map((_, i) => (
        <SkeletonLine key={i} size={i === count - 1 ? "md" : "full"} />
      ))}
    </div>
  );
}

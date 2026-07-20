import "./QuickActions.css";

/**
 * Reusable quick-actions side panel used across ERP modules (ventures, layouts, …).
 * Pass `actions` ([{ id, icon, label, tone, onClick? }]) and an `onAction(id)` handler.
 */
export default function QuickActions({
  title = "Quick Actions",
  actions = [],
  onAction,
  className = "",
}) {
  return (
    <aside className={`erp-quick-actions ${className}`.trim()}>
      <h3 className="erp-quick-actions__title">{title}</h3>
      <div className="erp-quick-actions__list">
        {actions.map((action) => (
          <button
            key={action.id || action.label}
            type="button"
            className={`erp-quick-actions__btn erp-quick-actions__btn--${action.tone || "accent"}`}
            onClick={() => (action.onClick ? action.onClick() : onAction?.(action.id))}
          >
            <span className="erp-quick-actions__icon">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

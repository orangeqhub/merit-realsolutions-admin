import Badge from "../ui/badge/Badge";

export default function ReservationRules({ rules = [], onToggle }) {
  if (!rules.length) {
    return <p className="rsv-empty-hint">No reservation rules configured.</p>;
  }

  return (
    <div className="rsv-rules-list">
      {rules.map((rule) => (
        <article key={rule.id} className="rsv-rule">
          <div>
            <div className="rsv-rule__name">{rule.name}</div>
            <div className="rsv-rule__desc">{rule.description}</div>
            <div className="rsv-rule__tags">
              <span className="rsv-rule__tag">{rule.category}</span>
              {rule.configurable && <span className="rsv-rule__tag">Configurable</span>}
              {rule.parameter && <span className="rsv-rule__tag">{rule.parameter}</span>}
            </div>
          </div>
          <div>
            <Badge status={rule.enabled ? "Active" : "Inactive"} size="sm" />
            {onToggle && (
              <button
                type="button"
                className="rsv-rule__toggle"
                onClick={() => onToggle(rule.id, !rule.enabled)}
              >
                {rule.enabled ? "Disable" : "Enable"}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

import "./SideTabs.css";

export default function SideTabs({
  tabs = [],
  active,
  onChange,
  className = "",
}) {
  return (
    <nav className={`side-tabs ${className}`.trim()} role="tablist" aria-orientation="vertical">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`side-tabs__tab ${isActive ? "is-active" : ""}`}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.icon && <span className="side-tabs__icon">{tab.icon}</span>}
            <span className="side-tabs__label">{tab.label}</span>
            {tab.badge != null && <span className="side-tabs__badge">{tab.badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}

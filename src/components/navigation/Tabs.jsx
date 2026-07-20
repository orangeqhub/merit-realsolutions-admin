import { motion } from "framer-motion";
import "./Tabs.css";

export default function Tabs({
  tabs = [],
  active,
  onChange,
  layoutId = "erp-tabs-underline",
  className = "",
}) {
  return (
    <div className={`erp-tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`erp-tabs__tab ${isActive ? "is-active" : ""}`}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.icon && <span className="erp-tabs__icon">{tab.icon}</span>}
            {tab.label}
            {tab.badge != null && <span className="erp-tabs__badge">{tab.badge}</span>}
            {isActive && (
              <motion.span layoutId={layoutId} className="erp-tabs__indicator" />
            )}
          </button>
        );
      })}
    </div>
  );
}

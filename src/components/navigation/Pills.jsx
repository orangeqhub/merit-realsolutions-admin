import { motion } from "framer-motion";
import "./Pills.css";

export default function Pills({
  items = [],
  active,
  onChange,
  layoutId = "erp-pills-bg",
  className = "",
}) {
  return (
    <div className={`erp-pills ${className}`.trim()} role="tablist">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`erp-pills__item ${isActive ? "is-active" : ""}`}
            onClick={() => onChange?.(item.id)}
          >
            {isActive && (
              <motion.span layoutId={layoutId} className="erp-pills__bg" />
            )}
            <span className="erp-pills__label">
              {item.icon && <span className="erp-pills__icon">{item.icon}</span>}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

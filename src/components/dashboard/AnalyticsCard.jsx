import { motion } from "framer-motion";
import "./AnalyticsCard.css";

export default function AnalyticsCard({
  title,
  subtitle,
  value,
  delta,
  icon,
  actions,
  children,
  delay = 0,
  className = "",
}) {
  return (
    <motion.section
      className={`analytics-card ${className}`.trim()}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="analytics-card__header">
        <div className="analytics-card__heading">
          {icon && <span className="analytics-card__icon">{icon}</span>}
          <div>
            {title && <h3 className="analytics-card__title">{title}</h3>}
            {subtitle && <p className="analytics-card__subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="analytics-card__actions">{actions}</div>}
      </header>

      {(value != null || delta) && (
        <div className="analytics-card__metric">
          {value != null && <span className="analytics-card__value">{value}</span>}
          {delta && (
            <span
              className={`analytics-card__delta analytics-card__delta--${
                delta.direction || "up"
              }`}
            >
              {delta.value}
            </span>
          )}
        </div>
      )}

      {children && <div className="analytics-card__body">{children}</div>}
    </motion.section>
  );
}

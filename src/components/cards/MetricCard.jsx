import { motion } from "framer-motion";
import "./MetricCard.css";

export default function MetricCard({
  label,
  value,
  delta,
  icon,
  progress,
  tone = "accent",
  delay = 0,
}) {
  return (
    <motion.div
      className={`metric-card metric-card--${tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="metric-card__head">
        <span className="metric-card__label">{label}</span>
        {icon && <span className="metric-card__icon">{icon}</span>}
      </div>

      <div className="metric-card__value-row">
        <span className="metric-card__value">{value}</span>
        {delta && (
          <span
            className={`metric-card__delta metric-card__delta--${
              delta.direction || "up"
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="metric-card__bar">
          <span
            className="metric-card__bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

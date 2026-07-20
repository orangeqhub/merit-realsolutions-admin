import { motion } from "framer-motion";
import { useCountUp } from "../../hooks/useCountUp";
import "./StatsCard.css";

export default function StatsCard({
  icon,
  label,
  value = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  tone = "accent",
  trend,
  animate = true,
  delay = 0,
}) {
  const count = useCountUp(animate ? value : value, { decimals });
  const display = animate ? count : value;
  const formatted = Number(display).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.article
      className={`stats-card stats-card--${tone}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <div className="stats-card__top">
        <span className="stats-card__icon">{icon}</span>
        {trend && (
          <span
            className={`stats-card__trend stats-card__trend--${
              trend.direction || "up"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="stats-card__value">
        {prefix}
        {formatted}
        {suffix}
      </p>
      <p className="stats-card__label">{label}</p>
    </motion.article>
  );
}

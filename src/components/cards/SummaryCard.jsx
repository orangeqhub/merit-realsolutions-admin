import { motion } from "framer-motion";
import "./SummaryCard.css";

export default function SummaryCard({
  icon,
  label,
  value,
  caption,
  tone = "accent",
  delay = 0,
}) {
  return (
    <motion.div
      className={`summary-card summary-card--${tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      {icon && <span className="summary-card__icon">{icon}</span>}
      <div className="summary-card__text">
        <p className="summary-card__value">{value}</p>
        <p className="summary-card__label">{label}</p>
        {caption && <p className="summary-card__caption">{caption}</p>}
      </div>
    </motion.div>
  );
}

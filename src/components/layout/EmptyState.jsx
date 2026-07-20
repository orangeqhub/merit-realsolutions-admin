import { motion } from "framer-motion";
import { FiInbox, FiSearch, FiFolder } from "react-icons/fi";
import "./EmptyState.css";

const PRESETS = {
  default: { icon: <FiInbox />, title: "Nothing here yet" },
  search: { icon: <FiSearch />, title: "No results found" },
  data: { icon: <FiFolder />, title: "No data available" },
};

export default function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  compact = false,
}) {
  const preset = PRESETS[variant] || PRESETS.default;

  return (
    <motion.div
      className={`empty-state ${compact ? "empty-state--compact" : ""}`.trim()}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="empty-state__icon">{icon || preset.icon}</span>
      <h3 className="empty-state__title">{title || preset.title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </motion.div>
  );
}

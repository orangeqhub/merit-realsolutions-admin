import { motion } from "framer-motion";
import { FiCircle } from "react-icons/fi";
import "./Timeline.css";

export default function Timeline({ items = [], className = "" }) {
  return (
    <ol className={`erp-timeline ${className}`.trim()}>
      {items.map((item, index) => (
        <motion.li
          key={item.id || index}
          className="erp-timeline__item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className={`erp-timeline__marker erp-timeline__marker--${
              item.tone || "accent"
            }`}
          >
            {item.icon || <FiCircle />}
          </span>
          <div className="erp-timeline__content">
            <div className="erp-timeline__head">
              <span className="erp-timeline__title">{item.title}</span>
              {item.time && <span className="erp-timeline__time">{item.time}</span>}
            </div>
            {item.description && (
              <p className="erp-timeline__description">{item.description}</p>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

import { motion } from "framer-motion";
import "./PageContainer.css";

export default function PageContainer({
  children,
  size = "default",
  className = "",
}) {
  return (
    <motion.div
      className={`page-container page-container--${size} ${className}`.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

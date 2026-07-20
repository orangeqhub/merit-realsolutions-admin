import { motion } from "framer-motion";
import Breadcrumb from "./Breadcrumb";
import "./PageHeader.css";

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  eyebrow,
  children,
}) {
  return (
    <motion.header
      className="page-header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="page-header__text">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
        {children}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </motion.header>
  );
}

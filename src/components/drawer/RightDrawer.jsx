import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import "./RightDrawer.css";

export default function RightDrawer({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("drawer-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("drawer-open");
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="right-drawer__root">
          <motion.div
            className="right-drawer__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            className={`right-drawer right-drawer--${size}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="right-drawer__header">
              <div className="right-drawer__heading">
                <h2 className="right-drawer__title">{title}</h2>
                {subtitle && <p className="right-drawer__subtitle">{subtitle}</p>}
              </div>
              <button
                type="button"
                className="right-drawer__close"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <FiX />
              </button>
            </header>

            <div className="right-drawer__body">{children}</div>

            {footer && <footer className="right-drawer__footer">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiInfo,
} from "react-icons/fi";
import Button from "../ui/button/Button";
import "./AlertModal.css";

const PRESET = {
  success: { icon: <FiCheckCircle />, title: "Success" },
  warning: { icon: <FiAlertTriangle />, title: "Warning" },
  error: { icon: <FiXCircle />, title: "Something went wrong" },
  info: { icon: <FiInfo />, title: "Notice" },
};

export default function AlertModal({
  open,
  onClose,
  type = "info",
  title,
  message,
  buttonLabel = "Got it",
}) {
  const preset = PRESET[type] || PRESET.info;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="alert-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="alert-modal"
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`alert-modal__icon alert-modal__icon--${type}`}>
              {preset.icon}
            </span>
            <h2 className="alert-modal__title">{title || preset.title}</h2>
            {message && <p className="alert-modal__message">{message}</p>}
            <Button
              variant={type === "error" ? "danger" : "accent"}
              size="md"
              fullWidth
              onClick={onClose}
            >
              {buttonLabel}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

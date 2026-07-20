import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import Button from "../ui/button/Button";
import "./ConfirmationModal.css";

export default function ConfirmationModal({
  open,
  onClose,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  message,
  highlight,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  variant,
  icon,
  loading = false,
}) {
  const handleClose = onClose || onCancel;
  const resolvedTone = variant || tone;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && handleClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-modal__close"
              onClick={handleClose}
              aria-label="Close"
            >
              <FiX />
            </button>

            <span className={`confirm-modal__icon confirm-modal__icon--${resolvedTone}`}>
              {icon || <FiAlertTriangle />}
            </span>

            <h2 className="confirm-modal__title">{title}</h2>
            {message && <p className="confirm-modal__message">{message}</p>}
            {highlight && <p className="confirm-modal__highlight">{highlight}</p>}

            <div className="confirm-modal__actions">
              <Button variant="ghost" size="md" onClick={handleClose}>
                {cancelLabel}
              </Button>
              <Button
                variant={resolvedTone === "danger" ? "danger" : "accent"}
                size="md"
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

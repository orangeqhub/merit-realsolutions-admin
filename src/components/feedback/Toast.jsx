/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiInfo,
  FiX,
} from "react-icons/fi";
import "./Toast.css";

const ICONS = {
  success: <FiCheckCircle />,
  error: <FiXCircle />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />,
};

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

let idCounter = 0;

export function ToastProvider({ children, duration = 4000 }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast) => {
      const id = ++idCounter;
      const entry = { id, type: "info", ...toast };
      setToasts((prev) => [...prev, entry]);
      if (entry.duration !== 0) {
        setTimeout(() => dismiss(id), entry.duration || duration);
      }
      return id;
    },
    [dismiss, duration]
  );

  const api = {
    notify,
    dismiss,
    success: (message, opts) => notify({ ...opts, type: "success", message }),
    error: (message, opts) => notify({ ...opts, type: "error", message }),
    warning: (message, opts) => notify({ ...opts, type: "warning", message }),
    info: (message, opts) => notify({ ...opts, type: "info", message }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-viewport">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                className={`toast toast--${toast.type}`}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                role="status"
              >
                <span className="toast__icon">{ICONS[toast.type]}</span>
                <div className="toast__body">
                  {toast.title && <p className="toast__title">{toast.title}</p>}
                  {toast.message && <p className="toast__message">{toast.message}</p>}
                </div>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                >
                  <FiX />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

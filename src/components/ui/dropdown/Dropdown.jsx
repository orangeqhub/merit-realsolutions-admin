import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiMoreVertical } from "react-icons/fi";
import "./Dropdown.css";

const MENU_WIDTH = 188;

export default function Dropdown({
  items = [],
  trigger,
  align = "right",
  ariaLabel = "Open menu",
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left =
      align === "right"
        ? Math.max(rect.right - MENU_WIDTH, 12)
        : Math.min(rect.left, window.innerWidth - MENU_WIDTH - 12);
    setCoords({ top: rect.bottom + 8, left });
  }, [align]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        className="erp-dropdown__trigger-wrap"
        onClick={() => setOpen((p) => !p)}
      >
        {trigger || (
          <button
            type="button"
            className={`erp-dropdown__trigger ${open ? "is-open" : ""}`}
            aria-label={ariaLabel}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <FiMoreVertical />
          </button>
        )}
      </span>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div
                className="erp-dropdown__backdrop"
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="erp-dropdown__menu"
                style={{ top: coords.top, left: coords.left }}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                role="menu"
              >
                {items.map((item, i) =>
                  item.divider ? (
                    <span key={`divider-${i}`} className="erp-dropdown__divider" />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      className={`erp-dropdown__item ${
                        item.tone ? `erp-dropdown__item--${item.tone}` : ""
                      }`}
                      onClick={() => {
                        setOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {item.icon && (
                        <span className="erp-dropdown__item-icon">{item.icon}</span>
                      )}
                      {item.label}
                    </button>
                  )
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

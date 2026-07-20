import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiColumns } from "react-icons/fi";
import Checkbox from "../ui/checkbox/Checkbox";
import "./ColumnSelector.css";

export default function ColumnSelector({
  columns = [],
  hiddenColumns = [],
  onToggle,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="column-selector" ref={rootRef}>
      <button
        type="button"
        className={`column-selector__trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FiColumns />
        Columns
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="column-selector__menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="column-selector__heading">Toggle columns</p>
            {columns.map((col) => (
              <div className="column-selector__item" key={col.key}>
                <Checkbox
                  label={
                    typeof col.header === "string" ? col.header : col.key
                  }
                  checked={!hiddenColumns.includes(col.key)}
                  onChange={() => onToggle(col.key)}
                  disabled={col.locked}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

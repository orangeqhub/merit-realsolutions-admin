import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown, FiCheck, FiSearch, FiX } from "react-icons/fi";
import "./Select.css";

function normalizeOptions(options) {
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
}

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  hint,
  error,
  required = false,
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  className = "",
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const items = useMemo(() => normalizeOptions(options), [options]);
  const selectedValues = multiple ? value || [] : value ? [value] : [];

  const filtered = useMemo(() => {
    if (!searchable || !query) return items;
    return items.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query, searchable]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const exists = selectedValues.includes(optionValue);
      onChange(
        exists
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
      );
    } else {
      onChange(optionValue);
      setOpen(false);
      setQuery("");
    }
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    onChange("");
    setOpen(false);
    setQuery("");
  };

  const selectedLabels = items
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  const triggerClass = [
    "erp-control",
    "erp-select__trigger",
    error ? "erp-control--error" : "",
    open ? "erp-select__trigger--open" : "",
    selectedValues.length === 0 ? "erp-select__trigger--placeholder" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`erp-field erp-select ${className}`.trim()} ref={rootRef}>
      {label && (
        <label className="erp-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="erp-field__required">*</span>}
        </label>
      )}

      <button
        id={fieldId}
        type="button"
        className={triggerClass}
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="erp-select__value">
          {selectedLabels.length === 0
            ? placeholder
            : multiple
            ? `${selectedLabels.length} selected`
            : selectedLabels[0]}
        </span>
        <span className="erp-select__actions">
          {clearable && !multiple && selectedValues.length > 0 && !disabled ? (
            <button
              type="button"
              className="erp-select__clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <FiX />
            </button>
          ) : null}
          <FiChevronDown className="erp-select__caret" />
        </span>
      </button>

      {multiple && selectedLabels.length > 0 && (
        <div className="erp-select__chips">
          {items
            .filter((o) => selectedValues.includes(o.value))
            .map((o) => (
              <span key={o.value} className="erp-select__chip">
                {o.label}
                <button
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  aria-label={`Remove ${o.label}`}
                >
                  <FiX />
                </button>
              </span>
            ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="erp-select__menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
          >
            {searchable && (
              <div className="erp-select__search">
                <FiSearch />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                />
              </div>
            )}

            <div className="erp-select__options erp-scroll">
              {clearable && !multiple ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedValues.length === 0}
                  className={`erp-select__option ${selectedValues.length === 0 ? "is-selected" : ""}`}
                  onClick={() => handleSelect("")}
                >
                  <span>-- No Builder --</span>
                  {selectedValues.length === 0 ? <FiCheck /> : null}
                </button>
              ) : null}
              {filtered.length === 0 ? (
                <p className="erp-select__empty">No options found</p>
              ) : (
                filtered.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`erp-select__option ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <FiCheck />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <span className="erp-field__error">{error}</span>
      ) : (
        hint && <span className="erp-field__hint">{hint}</span>
      )}
    </div>
  );
}

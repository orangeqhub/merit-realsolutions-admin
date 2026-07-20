import { useId } from "react";
import "./Textarea.css";

export default function Textarea({
  label,
  value = "",
  onChange,
  name,
  id,
  placeholder,
  hint,
  error,
  rows = 4,
  maxLength,
  required = false,
  disabled = false,
  resizable = true,
  className = "",
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const controlClass = [
    "erp-control",
    "erp-textarea__control",
    error ? "erp-control--error" : "",
    resizable ? "" : "erp-textarea__control--fixed",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`erp-field erp-textarea ${className}`.trim()}>
      {label && (
        <label className="erp-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="erp-field__required">*</span>}
        </label>
      )}

      <textarea
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={controlClass}
        {...rest}
      />

      <div className="erp-textarea__footer">
        {error ? (
          <span className="erp-field__error">{error}</span>
        ) : (
          <span className="erp-field__hint">{hint}</span>
        )}
        {maxLength && (
          <span className="erp-textarea__count">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

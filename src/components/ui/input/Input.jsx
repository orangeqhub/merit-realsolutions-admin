import { useId } from "react";
import "./Input.css";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  name,
  id,
  placeholder,
  hint,
  error,
  success,
  required = false,
  disabled = false,
  icon,
  trailing,
  className = "",
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const controlClass = [
    "erp-control",
    "erp-input__control",
    error ? "erp-control--error" : "",
    success ? "erp-control--success" : "",
    icon ? "erp-input__control--icon" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`erp-field erp-input ${className}`.trim()}>
      {label && (
        <label className="erp-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="erp-field__required">*</span>}
        </label>
      )}

      <div className="erp-input__wrap">
        {icon && <span className="erp-input__icon">{icon}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={controlClass}
          {...rest}
        />
        {trailing && <span className="erp-input__trailing">{trailing}</span>}
      </div>

      {error ? (
        <span className="erp-field__error">{error}</span>
      ) : (
        hint && <span className="erp-field__hint">{hint}</span>
      )}
    </div>
  );
}

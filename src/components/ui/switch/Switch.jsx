import { useId } from "react";
import "./Switch.css";

export default function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  name,
  className = "",
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`erp-switch erp-switch--${size} ${
        disabled ? "is-disabled" : ""
      } ${className}`.trim()}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked, e)}
        disabled={disabled}
      />
      <span className={`erp-switch__track ${checked ? "is-on" : ""}`}>
        <span className="erp-switch__thumb" />
      </span>
      {label && <span className="erp-switch__label">{label}</span>}
    </label>
  );
}

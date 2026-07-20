import { useId } from "react";
import { FiCheck, FiMinus } from "react-icons/fi";
import "./Checkbox.css";

export default function Checkbox({
  label,
  checked = false,
  onChange,
  indeterminate = false,
  disabled = false,
  name,
  className = "",
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`erp-checkbox ${disabled ? "is-disabled" : ""} ${className}`.trim()}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked, e)}
        disabled={disabled}
      />
      <span
        className={`erp-checkbox__box ${
          checked || indeterminate ? "is-checked" : ""
        }`}
      >
        {indeterminate ? <FiMinus /> : checked ? <FiCheck /> : null}
      </span>
      {label && <span className="erp-checkbox__label">{label}</span>}
    </label>
  );
}

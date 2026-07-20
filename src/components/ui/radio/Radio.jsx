import { useId } from "react";
import "./Radio.css";

export function Radio({ label, checked, onChange, name, value, disabled }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`erp-radio ${disabled ? "is-disabled" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange?.(value)}
        disabled={disabled}
      />
      <span className={`erp-radio__dot ${checked ? "is-checked" : ""}`} />
      {label && <span className="erp-radio__label">{label}</span>}
    </label>
  );
}

export default function RadioGroup({
  label,
  name,
  value,
  onChange,
  options = [],
  direction = "vertical",
  className = "",
}) {
  return (
    <div className={`erp-field erp-radio-group ${className}`.trim()}>
      {label && <span className="erp-field__label">{label}</span>}
      <div className={`erp-radio-group__items erp-radio-group__items--${direction}`}>
        {options.map((opt) => {
          const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
          return (
            <Radio
              key={o.value}
              name={name}
              value={o.value}
              label={o.label}
              checked={value === o.value}
              onChange={onChange}
              disabled={o.disabled}
            />
          );
        })}
      </div>
    </div>
  );
}

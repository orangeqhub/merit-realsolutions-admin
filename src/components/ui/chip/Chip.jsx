import { FiX } from "react-icons/fi";
import "./Chip.css";

export default function Chip({
  label,
  children,
  icon,
  tone = "neutral",
  active = false,
  onClick,
  onRemove,
  className = "",
}) {
  const clickable = Boolean(onClick);
  return (
    <span
      className={`erp-chip erp-chip--${tone} ${active ? "is-active" : ""} ${
        clickable ? "is-clickable" : ""
      } ${className}`.trim()}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {icon && <span className="erp-chip__icon">{icon}</span>}
      <span className="erp-chip__label">{children ?? label}</span>
      {onRemove && (
        <button
          type="button"
          className="erp-chip__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <FiX />
        </button>
      )}
    </span>
  );
}

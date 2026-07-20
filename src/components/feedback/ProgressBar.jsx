import "./ProgressBar.css";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  tone = "accent",
  size = "md",
  indeterminate = false,
  className = "",
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`progress-bar ${className}`.trim()}>
      {(label || showValue) && (
        <div className="progress-bar__head">
          {label && <span className="progress-bar__label">{label}</span>}
          {showValue && !indeterminate && (
            <span className="progress-bar__value">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className={`progress-bar__track progress-bar__track--${size}`}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={`progress-bar__fill progress-bar__fill--${tone} ${
            indeterminate ? "is-indeterminate" : ""
          }`}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

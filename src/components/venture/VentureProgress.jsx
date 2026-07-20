import ProgressBar from "../feedback/ProgressBar";
import "./VentureProgress.css";

export default function VentureProgress({ value = 0, label, compact = false }) {
  return (
    <div className={`venture-progress ${compact ? "venture-progress--compact" : ""}`}>
      {!compact && label && <span className="venture-progress__label">{label}</span>}
      <ProgressBar value={value} showValue tone="accent" size="sm" />
      {compact && <span className="venture-progress__value">{value}%</span>}
    </div>
  );
}

import { FiClock, FiAlertTriangle } from "react-icons/fi";
import { formatDate } from "../../utils/format";
import { computeRemainingTime } from "../../services/reservation/reservationRules";

function getTone(remaining, expired) {
  if (expired) return "expired";
  if (remaining.days <= 1) return "danger";
  if (remaining.days <= 5) return "warning";
  return "safe";
}

export default function CountdownBadge({
  expiryDate,
  status,
  size = "md",
  showExpiry = true,
}) {
  if (status && ["Confirmed", "Registered", "Completed", "Cancelled", "Released"].includes(status)) {
    return null;
  }

  const remaining = computeRemainingTime(expiryDate);
  const tone = getTone(remaining, remaining.expired);
  const sizeClass = size === "lg" ? "rsv-countdown--lg" : "";

  if (remaining.expired) {
    return (
      <div className={`rsv-countdown rsv-countdown--expired ${sizeClass}`.trim()}>
        <FiAlertTriangle />
        <span>Expired</span>
        {showExpiry && expiryDate && <span>· {formatDate(expiryDate)}</span>}
      </div>
    );
  }

  return (
    <div className={`rsv-countdown rsv-countdown--${tone} ${sizeClass}`.trim()}>
      <FiClock />
      {size === "lg" ? (
        <>
          <div className="rsv-countdown__block">
            <span className="rsv-countdown__value">{remaining.days}</span>
            <span className="rsv-countdown__label">Days</span>
          </div>
          <div className="rsv-countdown__block">
            <span className="rsv-countdown__value">{remaining.hours}</span>
            <span className="rsv-countdown__label">Hours</span>
          </div>
        </>
      ) : (
        <span>
          {remaining.days}d {remaining.hours}h left
        </span>
      )}
      {showExpiry && expiryDate && <span>· Exp {formatDate(expiryDate)}</span>}
    </div>
  );
}

import { getStatusMeta } from "../../services/reservation/reservationStatus";

export default function ReservationStatus({ status, className = "" }) {
  const meta = getStatusMeta(status);
  const tone = (meta.tone || "muted").toLowerCase();

  return (
    <span className={`rsv-status rsv-status--${tone} ${className}`.trim()}>
      {meta.label}
    </span>
  );
}

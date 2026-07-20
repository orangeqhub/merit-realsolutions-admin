import { Link } from "react-router-dom";
import Button from "../ui/button/Button";
import ReservationStatus from "./ReservationStatus";
import CountdownBadge from "./CountdownBadge";
import { formatINR, formatDate } from "../../utils/format";

export default function ReservationCard({ reservation, onAction }) {
  return (
    <article className="rsv-card">
      <div className="rsv-card__top">
        <div>
          <Link to={`/dashboard/reservations/${reservation.id}`} className="rsv-card__ref">
            {reservation.reference}
          </Link>
          <div className="rsv-card__meta">
            <span>{reservation.customerName}</span>
            <span>{reservation.plotNumber} · {reservation.layoutName}</span>
            <span>{reservation.ventureName}</span>
          </div>
        </div>
        <ReservationStatus status={reservation.status} />
      </div>

      <div className="rsv-card__meta">
        <span>Reserved {formatDate(reservation.reservationDate)}</span>
        {reservation.partnerName && <span>Partner: {reservation.partnerName}</span>}
        <span>Source: {reservation.source}</span>
      </div>

      <div className="rsv-card__amount">{formatINR(reservation.reservationAmount)}</div>

      <CountdownBadge
        expiryDate={reservation.expiryDate}
        status={reservation.status}
      />

      <div className="rsv-card__actions">
        <Button variant="ghost" size="sm" to={`/dashboard/reservations/${reservation.id}`}>
          View Details
        </Button>
        {reservation.status === "Reserved" && onAction && (
          <Button variant="accent" size="sm" onClick={() => onAction("confirm", reservation)}>
            Confirm
          </Button>
        )}
      </div>
    </article>
  );
}

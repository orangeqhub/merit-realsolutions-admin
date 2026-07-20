import { Link } from "react-router-dom";
import ReservationStatus from "./ReservationStatus";
import CountdownBadge from "./CountdownBadge";
import { formatINR, formatDate } from "../../utils/format";
import { useReservationsOptional } from "../../context/ReservationContext";
import "./reservation.css";

export function CustomerReservationsPanel({ customerId }) {
  const ctx = useReservationsOptional();
  if (!ctx) return null;
  const items = ctx.getByCustomer(customerId);

  if (!items.length) {
    return (
      <div className="rsv-panel">
        <h3>Reservations</h3>
        <p className="rsv-empty-hint">No reservations for this customer.</p>
      </div>
    );
  }

  return (
    <div className="rsv-panel">
      <h3>Reservations</h3>
      <div className="rsv-feed">
        {items.map((r) => (
          <div key={r.id} className="rsv-feed__item">
            <div>
              <Link to={`/dashboard/reservations/${r.id}`}><strong>{r.reference}</strong></Link>
              <span>{r.plotNumber} · {r.ventureName}</span>
              <ReservationStatus status={r.status} />
            </div>
            <div>
              <span>{formatINR(r.reservationAmount)}</span>
              <CountdownBadge expiryDate={r.expiryDate} status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlotReservationPanel({ plotId }) {
  const ctx = useReservationsOptional();
  if (!ctx) return null;
  const active = ctx.getActiveForPlot(plotId);
  const history = ctx.getByPlot(plotId);

  if (!active && !history.length) return null;

  return (
    <div className="rsv-panel">
      <h3>Reservation Domain</h3>
      {active ? (
        <>
          <Link to={`/dashboard/reservations/${active.id}`} className="rsv-card__ref">
            {active.reference}
          </Link>
          <div className="rsv-card__meta">
            <span>{active.customerName}</span>
            <span>{formatDate(active.reservationDate)}</span>
          </div>
          <ReservationStatus status={active.status} />
          <CountdownBadge expiryDate={active.expiryDate} status={active.status} size="lg" />
        </>
      ) : (
        <p className="rsv-empty-hint">No active reservation. {history.length} historical record(s).</p>
      )}
    </div>
  );
}

export function PartnerReservationsPanel({ partnerId }) {
  const ctx = useReservationsOptional();
  if (!ctx) return null;
  const items = ctx.getByPartner(partnerId);

  if (!items.length) {
    return (
      <InfoCardPlaceholder title="Reservations" message="No reservations linked to this partner." />
    );
  }

  return (
    <div className="rsv-panel">
      <h3>Reservations ({items.length})</h3>
      <div className="rsv-feed">
        {items.slice(0, 5).map((r) => (
          <div key={r.id} className="rsv-feed__item">
            <div>
              <Link to={`/dashboard/reservations/${r.id}`}><strong>{r.reference}</strong></Link>
              <span>{r.customerName} · {r.plotNumber}</span>
            </div>
            <ReservationStatus status={r.status} />
          </div>
        ))}
      </div>
      {items.length > 5 && (
        <Link to="/dashboard/reservations/list">View all reservations</Link>
      )}
    </div>
  );
}

function InfoCardPlaceholder({ title, message }) {
  return (
    <div className="rsv-panel">
      <h3>{title}</h3>
      <p className="rsv-empty-hint">{message}</p>
    </div>
  );
}

export function VentureReservationsSummary({ ventureId }) {
  const ctx = useReservationsOptional();
  if (!ctx) return null;
  const items = ctx.getByVenture(ventureId);
  const active = items.filter((r) => ctx.isActiveReservation(r.status));

  return (
    <div className="rsv-panel">
      <h3>Reservations</h3>
      <dl className="rsv-summary-list">
        <div><dt>Total</dt><dd>{items.length}</dd></div>
        <div><dt>Active</dt><dd>{active.length}</dd></div>
        <div><dt>Pipeline Value</dt><dd>{formatINR(active.reduce((s, r) => s + r.reservationAmount, 0))}</dd></div>
      </dl>
      <Link to={`/dashboard/reservations/list`}>Open Reservation Registry</Link>
    </div>
  );
}

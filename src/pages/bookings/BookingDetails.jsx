import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import FinancialSummary from "../../components/financial/FinancialSummary.jsx";
import { useToast } from "../../components/feedback/Toast";
import { getBookingDetail } from "../../services/booking/bookingApi.js";
import {
  cancelBooking,
  extendReservation,
  markBookingCompleted,
  markRegistrationPending,
  printPaymentReceipt,
  downloadPaymentReceipt,
} from "../../services/booking/installmentPaymentApi.js";
import { formatINR } from "../../utils/format";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function BookingDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightPaymentId = searchParams.get("highlight");
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getBookingDetail(id)
      .then(setDetail)
      .catch((err) => toast.error(err.message || "Failed to load booking."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const runAction = async (label, action) => {
    setActionLoading(true);
    try {
      await action();
      toast.success(`${label} updated.`);
      load();
    } catch (err) {
      toast.error(err.message || `${label} failed.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="erp-module-page"><p>Loading booking...</p></div>;
  if (!detail) return <div className="erp-module-page"><p>Booking not found.</p></div>;

  const { booking, property, assignee, financialSummary, reservation, payments, receipts, lifecycle } = detail;

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Booking ${booking.bookingNumber}`}
        description={`${property?.title || "Property"} · ${booking.customerName}`}
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/property-bookings">Back</Button>
            <Button variant="ghost" size="md" disabled={actionLoading} onClick={() => runAction("Reservation", () => extendReservation(booking.id, 7))}>Extend reservation</Button>
            <Button variant="ghost" size="md" disabled={actionLoading} onClick={() => runAction("Registration", () => markRegistrationPending(booking.id))}>Registration pending</Button>
            <Button variant="accent" size="md" disabled={actionLoading} onClick={() => runAction("Booking", () => markBookingCompleted(booking.id))}>Mark completed</Button>
          </>
        }
      />

      <section className="property-booking-settings">
        <h3>Customer & Assignment</h3>
        <p><strong>{booking.customerName}</strong> · {booking.mobile} · {booking.email || "—"}</p>
        <p>Sales executive: {assignee?.name || "Unassigned"} {assignee?.employeeCode ? `(${assignee.employeeCode})` : ""}</p>
        <p>Property: {property?.title} ({property?.code}) · Status <Badge>{property?.status}</Badge></p>
      </section>

      <section className="property-booking-settings">
        <h3>Financial Summary</h3>
        <FinancialSummary summary={financialSummary} reservation={reservation} booking={booking} />
      </section>

      <section className="property-booking-settings">
        <h3>Reservation</h3>
        <p>Status: <Badge>{reservation?.status}</Badge></p>
        <p>Reserved: {formatDate(reservation?.reservedDate)} · Expires: {formatDate(reservation?.expiryDate)}</p>
        <p>Days remaining: {reservation?.daysRemaining ?? "—"}</p>
      </section>

      <section className="property-booking-settings">
        <h3>Payment History</h3>
        {payments?.all?.length ? payments.all.map((payment) => (
          <div
            key={payment.id}
            className={`bookings-payments__item${String(highlightPaymentId) === String(payment.id) ? ' bookings-payments__item--highlight' : ''}`}
          >
            <Link to={`/dashboard/payments/${payment.id}`}>
              #{payment.installmentNumber} · {payment.paymentNumber} · {formatINR(payment.amount)} · <Badge>{payment.status}</Badge>
            </Link>
            <span className="payments-table__muted">{formatDate(payment.paidAt || payment.createdAt)}</span>
          </div>
        )) : <p>No payments recorded.</p>}
      </section>

      <section className="property-booking-settings">
        <h3>Receipts</h3>
        {receipts?.length ? receipts.map((receipt) => (
          <div key={receipt.id} className="bookings-payments__item">
            <Link to={`/dashboard/receipts/${receipt.id}`}>{receipt.receiptNumber || receipt.paymentNumber}</Link>
            <div>
              <Button variant="ghost" size="sm" onClick={() => printPaymentReceipt(receipt.id)}>Print</Button>
              <Button variant="ghost" size="sm" onClick={async () => {
                const file = await downloadPaymentReceipt(receipt.id);
                const blob = new Blob([file.text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.filename;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download</Button>
            </div>
          </div>
        )) : <p>No receipts yet.</p>}
      </section>

      {lifecycle?.history?.length > 0 && (
        <section className="property-booking-settings">
          <h3>Lead Lifecycle</h3>
          <ul className="dashboard__activity-list">
            {lifecycle.history.map((entry) => (
              <li key={entry.id} className="dashboard__activity-item">
                <span className="dashboard__activity-text">{entry.newStageLabel || entry.newStage} · {entry.remarks || ""}</span>
                <span className="dashboard__activity-time">{formatDate(entry.changedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="property-booking-settings">
        <Button variant="ghost" size="md" disabled={actionLoading} onClick={() => {
          const reason = window.prompt("Cancellation reason?");
          if (reason === null) return;
          runAction("Cancellation", () => cancelBooking(booking.id, reason));
        }}>Cancel booking</Button>
      </section>
    </motion.div>
  );
}

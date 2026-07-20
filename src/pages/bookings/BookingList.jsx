import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useToast } from "../../components/feedback/Toast";
import { listBookings } from "../../services/booking/bookingApi.js";
import { formatINR } from "../../utils/format";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function BookingList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    setLoading(true);
    listBookings({ pageSize: 100, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((result) => setItems(result?.items || []))
      .catch((err) => {
        toast.error(err.message || "Failed to load bookings.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="All Bookings"
        description="Production booking records with reservation and payment balances."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/bookings">Dashboard</Button>
            <Button variant="ghost" size="md" onClick={load}>Refresh</Button>
          </>
        }
      />

      <div className="property-booking-settings">
        <label>
          Filter by status{" "}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="RESERVED">Reserved</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      {loading && <p>Loading bookings...</p>}
      {!loading && items.length === 0 && <p>No bookings found.</p>}

      <div className="property-enquiry-list">
        {items.map((booking) => (
          <article key={booking.id} className="property-enquiry-card" role="button" tabIndex={0} onClick={() => navigate(`/dashboard/bookings/${booking.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/dashboard/bookings/${booking.id}`)}>
            <div className="property-enquiry-card__main">
              <div className="property-enquiry-card__header">
                <h3>{booking.bookingNumber}</h3>
                <Badge>{booking.status}</Badge>
              </div>
              <p><strong>{booking.customerName}</strong> · {booking.mobile}</p>
              <p>{booking.entity?.title || "Property"} · {booking.entity?.city || "—"}</p>
              <p>Paid {formatINR(booking.totalPaid)} · Remaining {formatINR(booking.remainingBalance)} · Progress {booking.paymentProgress ?? 0}%</p>
              <p>Reserved: {formatDate(booking.createdAt)} · Expires: {formatDate(booking.reservationExpiresAt)}</p>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}

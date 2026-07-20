import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useToast } from "../../components/feedback/Toast";
import { listBookings } from "../../services/booking/bookingApi.js";
import { getAdminDashboard } from "../../services/admin/adminDashboardApi.js";
import { formatINR } from "../../utils/format";

export default function BookingDashboard() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listBookings({ pageSize: 100 }),
      getAdminDashboard(),
    ])
      .then(([bookingResult, dashboard]) => {
        setBookings(bookingResult?.items || []);
        setMetrics(dashboard);
      })
      .catch((err) => toast.error(err.message || "Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const reservationRows = useMemo(
    () => bookings.filter((row) => ["RESERVED", "PARTIALLY_PAID", "BOOKED", "PAYMENT_PENDING"].includes(row.status)).slice(0, 6),
    [bookings]
  );

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Bookings & Reservations"
        description="Live property bookings and reservation status from PostgreSQL."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/bookings/list">View all</Button>
            <Button variant="accent" size="md" to="/dashboard/properties/property-bookings">Manage bookings</Button>
          </>
        }
      />

      {loading ? <p>Loading bookings...</p> : (
        <>
          <div className="dashboard__summary">
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Total Bookings</span><span className="dashboard__summary-value">{metrics?.bookings?.total ?? bookings.length}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Active</span><span className="dashboard__summary-value">{metrics?.bookings?.active ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Reservations</span><span className="dashboard__summary-value">{metrics?.payments?.reservationCount ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Outstanding</span><span className="dashboard__summary-value">{formatINR(metrics?.payments?.outstandingBalance ?? 0)}</span></div>
          </div>

          <section className="property-booking-settings">
            <h3>Active Reservations</h3>
            {reservationRows.length === 0 ? <p>No active reservations.</p> : (
              <ul className="dashboard__activity-list">
                {reservationRows.map((booking) => (
                  <li key={booking.id} className="dashboard__activity-item">
                    <Link to={`/dashboard/bookings/${booking.id}`} className="dashboard__activity-text">
                      {booking.bookingNumber} · {booking.entity?.title || "Property"} · <Badge>{booking.status}</Badge>
                    </Link>
                    <span className="dashboard__activity-time">{formatINR(booking.totalPaid || 0)} paid · {formatINR(booking.remainingBalance || 0)} due</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}

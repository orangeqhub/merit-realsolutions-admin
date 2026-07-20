import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  getBookingSettings,
  listBookings,
  processBookingExpiry,
  updateBookingSettings,
} from "../../services/booking/bookingApi.js";
import {
  cancelBooking,
  extendReservation,
  markBookingCompleted,
  markRegistrationPending,
} from "../../services/booking/installmentPaymentApi.js";
import { useToast } from "../../components/feedback/Toast";
import "./property.css";

const STATUS_TONE = {
  PAYMENT_PENDING: "warning",
  BOOKED: "info",
  RESERVED: "success",
  PARTIALLY_PAID: "warning",
  FULLY_PAID: "success",
  REGISTRATION_PENDING: "info",
  COMPLETED: "success",
  REGISTERED: "success",
  SOLD: "success",
  CANCELLED: "danger",
  EXPIRED: "neutral",
};

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function PropertyBookingList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [settings, setSettings] = useState({
    bookingValidityDays: 15,
    gstPercent: 0,
    bookingAmountPercent: 10,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [result, bookingSettings] = await Promise.all([
        listBookings({ pageSize: 100, ...(statusFilter ? { status: statusFilter } : {}) }),
        getBookingSettings(),
      ]);
      setItems(result.items || []);
      if (bookingSettings) {
        setSettings({
          bookingValidityDays: bookingSettings.bookingValidityDays ?? 15,
          gstPercent: bookingSettings.gstPercent ?? 0,
          bookingAmountPercent: bookingSettings.bookingAmountPercent ?? 10,
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load bookings.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const counts = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const runAction = async (id, action) => {
    setActionLoadingId(id);
    try {
      await action();
      toast.success("Booking updated.");
      load();
    } catch (err) {
      toast.error(err.message || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateBookingSettings(settings);
      toast.success("Booking settings saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const runExpiry = async () => {
    try {
      const result = await processBookingExpiry();
      toast.success(`Expiry processed: ${result.processed || 0} booking(s).`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to process expiry.");
    }
  };

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Property Bookings"
        description="Installment-based bookings with reservation expiry, registration, and completion workflow."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={runExpiry}>Process Expiry</Button>
            <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
          </>
        }
      />

      <section className="property-booking-settings">
        <h3>Booking Validity Settings</h3>
        <div className="property-booking-settings__grid">
          <label>
            Validity (days)
            <input
              type="number"
              min={1}
              max={365}
              value={settings.bookingValidityDays}
              onChange={(e) => setSettings((p) => ({ ...p, bookingValidityDays: Number(e.target.value) }))}
            />
          </label>
          <label>
            Booking Amount %
            <input
              type="number"
              min={1}
              max={100}
              step="0.01"
              value={settings.bookingAmountPercent}
              onChange={(e) => setSettings((p) => ({ ...p, bookingAmountPercent: Number(e.target.value) }))}
            />
          </label>
          <label>
            GST %
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={settings.gstPercent}
              onChange={(e) => setSettings((p) => ({ ...p, gstPercent: Number(e.target.value) }))}
            />
          </label>
          <Button size="sm" onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </div>
        <p className="property-booking-settings__hint">
          Partial payments start a reservation window. Expired reservations can be extended or cancelled to reopen the property.
        </p>
      </section>

      <div className="property-booking-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_TONE).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <p>
          Showing {items.length}
          {" · "}PARTIALLY_PAID {counts.PARTIALLY_PAID || 0}
          {" · "}FULLY_PAID {counts.FULLY_PAID || 0}
          {" · "}EXPIRED {counts.EXPIRED || 0}
        </p>
      </div>

      {loading && <p>Loading bookings...</p>}
      {!loading && items.length === 0 && <p>No bookings yet.</p>}

      <div className="property-enquiry-list">
        {items.map((item) => (
          <article key={item.id} className="property-enquiry-card">
            <div
              className="property-enquiry-card__main"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/dashboard/property-bookings/${item.id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/dashboard/property-bookings/${item.id}`)}
            >
              <div className="property-enquiry-card__header">
                <h3>{item.bookingNumber}</h3>
                <Badge tone={STATUS_TONE[item.status] || "neutral"}>{item.status}</Badge>
              </div>
              <p><strong>{item.customerName}</strong> · {item.mobile} · {item.email || "—"}</p>
              <p>
                Property:{" "}
                {item.entity ? (
                  <Link to={`/dashboard/properties/${item.entity.id}`}>
                    {item.entity.title} ({item.entity.code})
                  </Link>
                ) : (
                  `${item.entityType} #${item.entityId}`
                )}
              </p>
              <p>
                Price: {formatINR(item.propertyPrice || item.totalAmount)}
                {" · "}Paid: {formatINR(item.totalPaid)}
                {" · "}Balance: {formatINR(item.remainingBalance)}
                {item.paymentProgress != null ? ` · Progress: ${item.paymentProgress}%` : ""}
              </p>
              <p>Visit date: {item.visitDate || "—"}</p>
              <p>Reservation expires: {formatDate(item.reservationExpiresAt || item.expiresAt)}</p>
              <p>Assigned To: {item.assignee?.name || "Unassigned"}</p>
              {item.comments ? <p>{item.comments}</p> : null}
            </div>
            <div className="property-enquiry-card__actions">
              <Button size="sm" to={`/dashboard/property-bookings/${item.id}`}>View details</Button>
              {item.status === "EXPIRED" ? (
                <>
                  <Button
                    size="sm"
                    disabled={actionLoadingId === item.id}
                    onClick={() => runAction(item.id, () => extendReservation(item.id, 7))}
                  >
                    Extend 7 Days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoadingId === item.id}
                    onClick={() => runAction(item.id, () => cancelBooking(item.id, "Expired reservation cancelled by admin."))}
                  >
                    Cancel Booking
                  </Button>
                </>
              ) : null}
              {item.status === "FULLY_PAID" ? (
                <Button
                  size="sm"
                  disabled={actionLoadingId === item.id}
                  onClick={() => runAction(item.id, () => markRegistrationPending(item.id))}
                >
                  Enable Registration
                </Button>
              ) : null}
              {item.status === "REGISTRATION_PENDING" ? (
                <Button
                  size="sm"
                  disabled={actionLoadingId === item.id}
                  onClick={() => runAction(item.id, () => markBookingCompleted(item.id))}
                >
                  Mark Completed
                </Button>
              ) : null}
              {["PARTIALLY_PAID", "RESERVED", "PAYMENT_PENDING"].includes(item.status) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={actionLoadingId === item.id}
                  onClick={() => runAction(item.id, () => cancelBooking(item.id, "Cancelled by admin."))}
                >
                  Cancel Booking
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}

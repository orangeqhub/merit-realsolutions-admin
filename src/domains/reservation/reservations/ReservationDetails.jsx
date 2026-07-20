import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiX, FiClock, FiRefreshCw } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/ui/select/Select";
import EmptyState from "../../../components/layout/EmptyState";
import ReservationStatus from "../../../components/reservation/ReservationStatus";
import CountdownBadge from "../../../components/reservation/CountdownBadge";
import ReservationTimeline from "../../../components/reservation/ReservationTimeline";
import Tabs from "../../../components/navigation/Tabs";
import { useReservations } from "../../../context/ReservationContext";
import { useToast } from "../../../components/feedback/Toast";
import { formatINR, formatDate } from "../../../utils/format";
import "../../../components/reservation/reservation.css";

const EXTENSION_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "15", label: "15 Days" },
  { value: "30", label: "30 Days" },
];

export default function ReservationDetails() {
  const { id } = useParams();
  const toast = useToast();
  const {
    getReservation,
    confirmReservation,
    cancelReservation,
    releaseReservation,
    registerReservation,
    completeReservation,
    extendReservation,
    settings,
  } = useReservations();

  const reservation = getReservation(id);
  const [tab, setTab] = useState("summary");
  const [extendDays, setExtendDays] = useState("7");

  const tabs = useMemo(
    () => [
      { id: "summary", label: "Summary" },
      { id: "timeline", label: "Timeline" },
      { id: "activity", label: "Activity" },
      { id: "documents", label: "Documents" },
      { id: "history", label: "History" },
    ],
    []
  );

  if (!reservation) {
    return (
      <EmptyState
        title="Reservation not found"
        description="The reservation you are looking for does not exist or has been removed."
        action={
          <Button variant="accent" to="/dashboard/reservations/list" icon={<FiArrowLeft />}>
            Back to Reservations
          </Button>
        }
      />
    );
  }

  const handleTransition = (fn, label) => {
    const result = fn(reservation.id, { remarks: `${label} by administrator` });
    if (result.ok) toast.success(`Reservation ${label.toLowerCase()}`);
    else toast.error(result.error);
  };

  const handleExtend = () => {
    const result = extendReservation(reservation.id, Number(extendDays));
    if (result.ok) toast.success(`Reservation extended by ${extendDays} days`);
    else toast.error(result.error);
  };

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title={reservation.reference}
        description={`${reservation.customerName} · ${reservation.plotNumber} · ${reservation.ventureName}`}
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Reservations", to: "/dashboard/reservations/list" },
          { label: reservation.reference },
        ]}
        actions={
          <Button variant="ghost" size="md" to="/dashboard/reservations/list" icon={<FiArrowLeft />}>
            Back
          </Button>
        }
      >
        <div className="rsv-quick-actions">
          <ReservationStatus status={reservation.status} />
          <CountdownBadge expiryDate={reservation.expiryDate} status={reservation.status} size="lg" />
        </div>
      </PageHeader>

      <div className="rsv-detail-grid">
        <div className="rsv-panel">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === "summary" && (
            <>
              <h3>Reservation Summary</h3>
              <dl className="rsv-summary-list">
                <div><dt>Reference</dt><dd>{reservation.reference}</dd></div>
                <div><dt>Status</dt><dd><ReservationStatus status={reservation.status} /></dd></div>
                <div><dt>Reservation Date</dt><dd>{formatDate(reservation.reservationDate)}</dd></div>
                <div><dt>Expiry Date</dt><dd>{formatDate(reservation.expiryDate)}</dd></div>
                <div><dt>Reservation Amount</dt><dd>{formatINR(reservation.reservationAmount)}</dd></div>
                <div><dt>Total Value</dt><dd>{formatINR(reservation.totalValue)}</dd></div>
                <div><dt>Source</dt><dd>{reservation.source}</dd></div>
                <div><dt>Extensions</dt><dd>{reservation.extensionsCount} / {reservation.maxExtensions}</dd></div>
              </dl>

              <h3>Customer</h3>
              <dl className="rsv-summary-list">
                <div><dt>Name</dt><dd><Link to={`/dashboard/customers/${reservation.customerId}`}>{reservation.customerName}</Link></dd></div>
                <div><dt>Phone</dt><dd>{reservation.customerPhone}</dd></div>
                <div><dt>Email</dt><dd>{reservation.customerEmail}</dd></div>
              </dl>

              {reservation.partnerName && (
                <>
                  <h3>Sales Team Member</h3>
                  <dl className="rsv-summary-list">
                    <div><dt>Partner</dt><dd><Link to={`/dashboard/partners/profile/${reservation.partnerId}`}>{reservation.partnerName}</Link></dd></div>
                  </dl>
                </>
              )}

              <h3>Inventory</h3>
              <dl className="rsv-summary-list">
                <div><dt>Venture</dt><dd><Link to={`/dashboard/ventures/${reservation.ventureId}`}>{reservation.ventureName}</Link></dd></div>
                <div><dt>Layout</dt><dd><Link to={`/dashboard/layouts/${reservation.layoutId}`}>{reservation.layoutName}</Link></dd></div>
                <div><dt>Plot</dt><dd><Link to={`/dashboard/plots/${reservation.plotId}`}>{reservation.plotNumber}</Link></dd></div>
                <div><dt>Area</dt><dd>{reservation.inventory?.areaSqYards} sq.yd</dd></div>
                <div><dt>Facing</dt><dd>{reservation.inventory?.facing}</dd></div>
              </dl>
            </>
          )}

          {tab === "timeline" && (
            <ReservationTimeline events={reservation.timeline} />
          )}

          {tab === "activity" && (
            <table className="rsv-activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reservation.activityLog || []).map((log) => (
                  <tr key={log.id}>
                    <td>{log.user}</td>
                    <td>{log.role}</td>
                    <td>{log.action}</td>
                    <td>{new Date(log.timestamp).toLocaleString("en-IN")}</td>
                    <td>{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "documents" && (
            <div className="rsv-docs-placeholder">
              Document management will integrate with the Documents domain in a future phase.
            </div>
          )}

          {tab === "history" && (
            <ReservationTimeline events={[...(reservation.timeline || [])].reverse()} />
          )}
        </div>

        <aside className="rsv-panel">
          <h3>Quick Actions</h3>
          <div className="rsv-quick-actions">
            {reservation.status === "Reserved" && (
              <>
                <Button variant="accent" size="sm" icon={<FiCheck />} onClick={() => handleTransition(confirmReservation, "Confirmed")}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" icon={<FiX />} onClick={() => handleTransition(cancelReservation, "Cancelled")}>
                  Cancel
                </Button>
                <Button variant="ghost" size="sm" icon={<FiRefreshCw />} onClick={() => handleTransition(releaseReservation, "Released")}>
                  Release
                </Button>
              </>
            )}
            {reservation.status === "Confirmed" && (
              <Button variant="accent" size="sm" onClick={() => handleTransition(registerReservation, "Registered")}>
                Mark Registered
              </Button>
            )}
            {reservation.status === "Registered" && (
              <Button variant="accent" size="sm" onClick={() => handleTransition(completeReservation, "Completed")}>
                Mark Completed
              </Button>
            )}
          </div>

          {["Reserved", "Confirmed"].includes(reservation.status) && (
            <div className="rsv-drawer-section">
              <h4>Extend Reservation</h4>
              <Select
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                options={[
                  ...EXTENSION_OPTIONS,
                  ...(settings.extensionOptions || []).filter((d) => ![7, 15, 30].includes(d)).map((d) => ({
                    value: String(d),
                    label: `${d} Days (Custom)`,
                  })),
                ]}
              />
              <Button variant="ghost" size="sm" icon={<FiClock />} onClick={handleExtend}>
                Extend
              </Button>
            </div>
          )}

          <h3>Reminder History</h3>
          <div className="rsv-reminder-list">
            {(reservation.reminders || []).length ? (
              reservation.reminders.map((r) => (
                <div key={r.type} className="rsv-reminder">
                  <span>{r.label}</span>
                  <span>{r.sentAt ? formatDate(r.sentAt) : "—"} · {r.channel}</span>
                </div>
              ))
            ) : (
              <p className="rsv-empty-hint">No reminders sent yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

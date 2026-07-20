import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiRefreshCw,
  FiX,
  FiShield,
  FiFileText,
} from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import Tabs from "../../../components/navigation/Tabs";
import EmptyState from "../../../components/layout/EmptyState";
import ReservationStatus from "../../../components/reservation/ReservationStatus";
import CountdownBadge from "../../../components/reservation/CountdownBadge";
import ReservationTimeline from "../../../components/reservation/ReservationTimeline";
import ConfirmationModal from "../../../components/modal/ConfirmationModal";
import Checkbox from "../../../components/ui/checkbox/Checkbox";
import RightDrawer from "../../../components/drawer/RightDrawer";
import Select from "../../../components/ui/select/Select";
import Input from "../../../components/ui/input/Input";
import Textarea from "../../../components/ui/textarea/Textarea";
import { useReservations } from "../../../context/ReservationContext";
import { usePlots } from "../../../shared/hooks/usePlots.js";
import { useToast } from "../../../components/feedback/Toast";
import { formatINR, formatDate } from "../../../utils/format";
import { getPriority } from "../../../services/reservation/reservationService";
import "../../../components/reservation/reservation.css";
import "./reservationProcessing.css";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "verification", label: "Verification" },
  { id: "timeline", label: "Timeline" },
  { id: "activity", label: "Activity" },
  { id: "documents", label: "Documents" },
];

const EXT_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "15", label: "15 Days" },
  { value: "30", label: "30 Days" },
  { value: "custom", label: "Custom" },
];

function PriorityChip({ value }) {
  const tone = (value || "Normal").toLowerCase();
  return <span className={`rsv-proc__chip rsv-proc__chip--${tone}`}>{value}</span>;
}

export default function ReservationProcessingDetails() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const { setStatus } = usePlots();
  const {
    getReservation,
    getPlotState,
    startVerification,
    updateVerificationChecklist,
    completeVerification,
    canConfirmReservation,
    confirmReservation,
    cancelReservation,
    releaseReservation,
    extendReservationWithDetails,
  } = useReservations();

  const reservation = getReservation(id);
  const plotState = reservation ? getPlotState(reservation.plotId) : null;

  const [tab, setTab] = useState("summary");
  const [actionModal, setActionModal] = useState(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendOption, setExtendOption] = useState("7");
  const [customDays, setCustomDays] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const priority = useMemo(() => (reservation ? getPriority(reservation) : "Normal"), [reservation]);

  const checklist = useMemo(() => reservation?.verification?.checklist || {}, [reservation]);
  const checklistDone = useMemo(
    () =>
      ["customerDetails", "identityDocs", "reservationAmount", "channelPartner", "plotAvailability"].every(
        (k) => Boolean(checklist[k])
      ),
    [checklist]
  );

  const confirmEnabled = reservation ? canConfirmReservation(reservation) : false;

  if (!reservation) {
    return (
      <EmptyState
        title="Reservation not found"
        description="This reservation may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/reservations/processing">
            <FiArrowLeft /> Back to Processing
          </Button>
        }
      />
    );
  }

  const syncPlot = (nextStatus) => {
    if (!reservation.plotId) return;
    if (nextStatus === "Confirmed") {
      setStatus(reservation.plotId, "Booked", {
        customer: reservation.customerName,
        customerId: reservation.customerId,
        reservationExpiry: null,
      });
      return;
    }
    if (nextStatus === "Released" || nextStatus === "Cancelled") {
      setStatus(reservation.plotId, "Available");
    }
  };

  const runAction = (type) => {
    if (type === "verify-start") {
      const r = startVerification(reservation.id);
      r.ok ? toast.success("Verification started") : toast.error(r.error);
      return;
    }
    if (type === "verify-complete") {
      const r = completeVerification(reservation.id);
      r.ok ? toast.success("Verification completed") : toast.error(r.error);
      return;
    }
    if (type === "confirm") {
      const r = confirmReservation(reservation.id, { remarks: "Confirmed after verification" });
      if (r.ok) {
        syncPlot("Confirmed");
        toast.success("Reservation confirmed");
      } else toast.error(r.error);
      return;
    }
    if (type === "cancel") {
      const r = cancelReservation(reservation.id, { remarks: "Cancelled by administrator" });
      if (r.ok) {
        syncPlot("Cancelled");
        toast.success("Reservation cancelled");
      } else toast.error(r.error);
      return;
    }
    if (type === "release") {
      const r = releaseReservation(reservation.id, { remarks: "Released manually by administrator" });
      if (r.ok) {
        syncPlot("Released");
        toast.success("Reservation released");
      } else toast.error(r.error);
      return;
    }
  };

  const extensionDays = extendOption === "custom" ? Number(customDays) : Number(extendOption);
  const previewDays = Number.isFinite(extensionDays) && extensionDays > 0 ? extensionDays : 0;

  const handleApplyExtension = () => {
    const r = extendReservationWithDetails(
      reservation.id,
      { days: previewDays || 7, reason, remarks },
      { user: "Administrator", role: "Administrator" }
    );
    if (r.ok) toast.success("Extension applied");
    else toast.error(r.error);
    setExtendOpen(false);
    setReason("");
    setRemarks("");
    setExtendOption("7");
    setCustomDays("");
  };

  return (
    <div className="rsv-proc reservation-domain">
      <PageHeader
        eyebrow="Reservation Processing"
        title={reservation.reference}
        description={`${reservation.customerName} · ${reservation.plotNumber} · ${reservation.ventureName}`}
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Processing Workspace", to: "/dashboard/reservations/processing" },
          { label: reservation.reference },
        ]}
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate("/dashboard/reservations/processing")} icon={<FiArrowLeft />}>
            Back
          </Button>
        }
      >
        <div className="rsv-quick-actions">
          <ReservationStatus status={reservation.status} />
          <PriorityChip value={priority} />
          <CountdownBadge expiryDate={reservation.expiryDate} status={reservation.status} size="lg" />
        </div>
      </PageHeader>

      <div className="rsv-proc__details-grid">
        <div className="rsv-proc__panel">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === "summary" && (
            <>
              <h3>Reservation Summary</h3>
              <dl className="rsv-proc__summary">
                <div><dt>Reservation Number</dt><dd>{reservation.reference}</dd></div>
                <div><dt>Current Status</dt><dd><ReservationStatus status={reservation.status} /></dd></div>
                <div><dt>Reservation Date</dt><dd>{formatDate(reservation.reservationDate)}</dd></div>
                <div><dt>Expiry Date</dt><dd>{formatDate(reservation.expiryDate)}</dd></div>
                <div><dt>Remaining</dt><dd>{reservation.remainingDays}d {reservation.remainingHours}h</dd></div>
                <div><dt>Reservation Value</dt><dd>{formatINR(reservation.reservationAmount)}</dd></div>
              </dl>

              <h3>Customer Details</h3>
              <dl className="rsv-proc__summary">
                <div><dt>Name</dt><dd><Link to={`/dashboard/customers/${reservation.customerId}`}>{reservation.customerName}</Link></dd></div>
                <div><dt>Contact</dt><dd>{reservation.customerPhone}</dd></div>
                <div><dt>Address</dt><dd>—</dd></div>
                <div><dt>Lead Source</dt><dd>{reservation.source}</dd></div>
              </dl>

              <h3>Property Details</h3>
              <dl className="rsv-proc__summary">
                <div><dt>Venture</dt><dd><Link to={`/dashboard/ventures/${reservation.ventureId}`}>{reservation.ventureName}</Link></dd></div>
                <div><dt>Layout</dt><dd><Link to={`/dashboard/layouts/${reservation.layoutId}`}>{reservation.layoutName}</Link></dd></div>
                <div><dt>Plot</dt><dd><Link to={`/dashboard/plots/${reservation.plotId}`}>{reservation.plotNumber}</Link></dd></div>
                <div><dt>Facing</dt><dd>{reservation.inventory?.facing || "—"}</dd></div>
                <div><dt>Area</dt><dd>{reservation.inventory?.areaSqYards || "—"} sq.yd</dd></div>
                <div><dt>Dimensions</dt><dd>{reservation.inventory?.dimensions || "—"}</dd></div>
              </dl>

              <h3>Sales Team Member</h3>
              <dl className="rsv-proc__summary">
                <div><dt>Partner</dt><dd>{reservation.partnerId ? <Link to={`/dashboard/partners/profile/${reservation.partnerId}`}>{reservation.partnerName}</Link> : "—"}</dd></div>
                <div><dt>Performance</dt><dd>Badge (placeholder)</dd></div>
              </dl>
            </>
          )}

          {tab === "verification" && (
            <>
              <h3>Reservation Verification</h3>
              <div className="rsv-proc__kv">
                <span>Plot Availability (live from inventory)</span>
                <strong>{plotState?.status || "—"}</strong>
              </div>

              <ul className="rsv-proc__checklist">
                <li>
                  <Checkbox
                    label="Customer Details Verified"
                    checked={Boolean(checklist.customerDetails)}
                    onChange={(checked) => updateVerificationChecklist(reservation.id, "customerDetails", checked)}
                  />
                </li>
                <li>
                  <Checkbox
                    label="Identity Documents (Placeholder)"
                    checked={Boolean(checklist.identityDocs)}
                    onChange={(checked) => updateVerificationChecklist(reservation.id, "identityDocs", checked)}
                  />
                </li>
                <li>
                  <Checkbox
                    label="Reservation Amount Verified"
                    checked={Boolean(checklist.reservationAmount)}
                    onChange={(checked) => updateVerificationChecklist(reservation.id, "reservationAmount", checked)}
                  />
                </li>
                <li>
                  <Checkbox
                    label="Sales Team Member Verified"
                    checked={Boolean(checklist.channelPartner)}
                    onChange={(checked) => updateVerificationChecklist(reservation.id, "channelPartner", checked)}
                  />
                </li>
                <li>
                  <Checkbox
                    label="Plot Availability Verified"
                    checked={Boolean(checklist.plotAvailability)}
                    onChange={(checked) => updateVerificationChecklist(reservation.id, "plotAvailability", checked)}
                  />
                </li>
              </ul>

              <div className="rsv-proc__actions rsv-proc__actions--spaced">
                <Button variant="ghost" size="sm" icon={<FiShield />} onClick={() => setActionModal("verify-start")}>
                  Verify Reservation
                </Button>
                <Button variant="ghost" size="sm" icon={<FiCheck />} onClick={() => setActionModal("verify-complete")} disabled={!checklistDone}>
                  Complete Verification
                </Button>
              </div>

              {!checklistDone && (
                <p className="rsv-empty-hint">Complete all checklist items to enable confirmation.</p>
              )}
            </>
          )}

          {tab === "timeline" && <ReservationTimeline events={reservation.timeline} />}

          {tab === "activity" && (
            <table className="rsv-activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Previous</th>
                  <th>New</th>
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
                    <td>{log.previousStatus || "—"}</td>
                    <td>{log.newStatus || "—"}</td>
                    <td>{new Date(log.timestamp).toLocaleString("en-IN")}</td>
                    <td>{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "documents" && (
            <div className="rsv-docs-placeholder">
              <FiFileText style={{ marginRight: "0.5rem" }} />
              Documents will integrate with the Documents domain in a future phase.
            </div>
          )}
        </div>

        <aside className="rsv-proc__panel">
          <h3>Approval Actions</h3>
          <div className="rsv-quick-actions">
            <Button
              variant="accent"
              size="sm"
              icon={<FiCheck />}
              disabled={!confirmEnabled}
              onClick={() => setActionModal("confirm")}
            >
              Confirm Reservation
            </Button>
            <Button variant="ghost" size="sm" icon={<FiClock />} onClick={() => setExtendOpen(true)}>
              Extend Reservation
            </Button>
            <Button variant="danger" size="sm" icon={<FiX />} onClick={() => setActionModal("cancel")}>
              Cancel Reservation
            </Button>
            <Button variant="ghost" size="sm" icon={<FiRefreshCw />} onClick={() => setActionModal("release")}>
              Release Plot
            </Button>
          </div>

          {!confirmEnabled && reservation.status === "Reserved" && (
            <p className="rsv-empty-hint">
              Confirm is enabled only after verification is completed.
            </p>
          )}

          <h3 style={{ marginTop: "1.25rem" }}>Reminder History</h3>
          <div className="rsv-reminder-list">
            {(reservation.reminders || []).length ? (
              reservation.reminders.map((r) => (
                <div key={`${r.type}-${r.sentAt}`} className="rsv-reminder">
                  <span>{r.label}</span>
                  <span>{r.sentAt ? formatDate(r.sentAt) : "—"} · {r.channel}</span>
                </div>
              ))
            ) : (
              <p className="rsv-empty-hint">No reminders recorded yet.</p>
            )}
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title="Confirm action?"
        message="This operation will create immutable timeline + activity log entries and synchronize inventory status."
        confirmLabel="Proceed"
        tone={actionModal === "cancel" || actionModal === "release" ? "danger" : "accent"}
        onConfirm={() => {
          const type = actionModal;
          setActionModal(null);
          runAction(type);
        }}
      />

      <RightDrawer
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend Reservation"
        subtitle={`${reservation.reference} · Current expiry: ${formatDate(reservation.expiryDate)}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="md"
              onClick={handleApplyExtension}
              disabled={!previewDays}
            >
              Apply Extension
            </Button>
          </>
        }
      >
        <div className="rsv-drawer-section">
          <h4>Extension Options</h4>
          <Select
            label="Extension"
            value={extendOption}
            onChange={(e) => setExtendOption(e.target.value)}
            options={EXT_OPTIONS}
          />
          {extendOption === "custom" && (
            <Input
              label="Custom Days"
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Enter days"
            />
          )}
        </div>

        <div className="rsv-drawer-section">
          <h4>Preview</h4>
          <div className="rsv-drawer-grid">
            <div className="rsv-drawer-field">
              <span>Current Expiry</span>
              <strong>{formatDate(reservation.expiryDate)}</strong>
            </div>
            <div className="rsv-drawer-field">
              <span>New Expiry</span>
              <strong>
                {previewDays
                  ? formatDate(
                      new Date(
                        new Date(`${reservation.expiryDate}T00:00:00`).getTime() + previewDays * 86400000
                      ).toISOString().split("T")[0]
                    )
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        <div className="rsv-drawer-section">
          <h4>Reason & Remarks</h4>
          <Textarea
            label="Reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Textarea
            label="Remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="rsv-drawer-section">
          <h4>History</h4>
          {(reservation.extensions || []).length ? (
            <table className="rsv-activity-table">
              <thead>
                <tr>
                  <th>Extended On</th>
                  <th>By</th>
                  <th>Days</th>
                  <th>Previous Expiry</th>
                  <th>New Expiry</th>
                </tr>
              </thead>
              <tbody>
                {reservation.extensions.slice().reverse().map((x, idx) => (
                  <tr key={`${x.extendedAt}-${idx}`}>
                    <td>{new Date(x.extendedAt).toLocaleString("en-IN")}</td>
                    <td>{x.by}</td>
                    <td>{x.days}</td>
                    <td>{formatDate(x.previousExpiry)}</td>
                    <td>{formatDate(x.newExpiry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rsv-empty-hint">No extensions applied.</p>
          )}
        </div>
      </RightDrawer>
    </div>
  );
}


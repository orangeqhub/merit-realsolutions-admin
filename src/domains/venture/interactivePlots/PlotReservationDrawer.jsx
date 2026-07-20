import { useMemo, useState } from "react";
import { FiClock, FiRefreshCw, FiUserPlus } from "react-icons/fi";
import RightDrawer from "../../../components/drawer/RightDrawer";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/ui/select/Select";
import Input from "../../../components/ui/input/Input";
import Textarea from "../../../components/ui/textarea/Textarea";
import ConfirmationModal from "../../../components/modal/ConfirmationModal";
import ReservationStatus from "../../../components/reservation/ReservationStatus";
import CountdownBadge from "../../../components/reservation/CountdownBadge";
import ReservationTimeline from "../../../components/reservation/ReservationTimeline";
import PlotTimeline from "../../../components/plots/PlotTimeline";
import { useReservations } from "../../../context/ReservationContext";
import { usePlots } from "../../../shared/hooks/usePlots.js";
import { useToast } from "../../../components/feedback/Toast";
import { formatINR, formatDate } from "../../../utils/format";
import "../../../components/reservation/reservation.css";

const EXT_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "15", label: "15 Days" },
  { value: "30", label: "30 Days" },
  { value: "custom", label: "Custom" },
];

export default function PlotReservationDrawer({
  open,
  onClose,
  venture,
  layout,
  plot,
}) {
  const toast = useToast();
  const { reservePlot, setStatus } = usePlots();
  const {
    customers,
    partners,
    getActiveForPlot,
    computeMinimumAmount,
    createReservation,
    confirmReservation,
    cancelReservation,
    releaseReservation,
    extendReservationWithDetails,
    assignPartnerToReservation,
  } = useReservations();

  const reservation = plot ? getActiveForPlot(plot.id) : null;
  const effectiveStatus = reservation?.status || plot?.status || "Available";

  const customerOptions = useMemo(
    () => [{ value: "", label: "Select customer" }, ...customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` }))],
    [customers]
  );

  const partnerOptions = useMemo(() => {
    const approved = partners || [];
    return [{ value: "", label: "None (Optional)" }, ...approved.map((p) => {
      const name = p.personal ? `${p.personal.firstName} ${p.personal.lastName}` : p.companyName || p.id;
      return { value: p.id, label: `${name} · ${p.partnerCode || "—"}` };
    })];
  }, [partners]);

  const [customerId, setCustomerId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendOption, setExtendOption] = useState("7");
  const [customDays, setCustomDays] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const minAmount = plot ? computeMinimumAmount(plot.finalPrice || plot.totalPrice) : 0;
  const amountToUse = Number(amount) || minAmount;

  const closeAndReset = () => {
    setCustomerId("");
    setPartnerId("");
    setAmount("");
    setConfirmAction(null);
    setExtendOpen(false);
    setExtendOption("7");
    setCustomDays("");
    setReason("");
    setRemarks("");
    onClose?.();
  };

  const handleReserve = () => {
    if (!plot) return;
    const result = createReservation({
      plotId: plot.id,
      layoutId: plot.layoutId,
      ventureId: plot.ventureId,
      customerId,
      partnerId: partnerId || null,
      reservationAmount: amountToUse,
      source: "ERP",
      createdBy: "Administrator",
      createdByRole: "Administrator",
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    reservePlot(plot.id, {
      customer: result.reservation.customerName,
      customerId: result.reservation.customerId,
      reservationExpiry: result.reservation.expiryDate,
    });
    toast.success(`Reservation ${result.reservation.reference} created. Inventory locked.`);
  };

  const handleConfirm = () => {
    if (!reservation) return;
    const result = confirmReservation(reservation.id, { remarks: "Confirmed from venture workspace" });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStatus(plot.id, "Booked", {
      customer: reservation.customerName,
      customerId: reservation.customerId,
      reservationExpiry: null,
    });
    toast.success("Reservation confirmed");
  };

  const handleCancel = () => {
    if (!reservation) return;
    const result = cancelReservation(reservation.id, { remarks: "Cancelled from venture workspace" });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStatus(plot.id, "Available");
    toast.success("Reservation cancelled");
  };

  const handleRelease = () => {
    if (!reservation) return;
    const result = releaseReservation(reservation.id, { remarks: "Released from venture workspace" });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStatus(plot.id, "Available");
    toast.success("Plot released");
  };

  const extensionDays = extendOption === "custom" ? Number(customDays) : Number(extendOption);

  const handleExtend = () => {
    if (!reservation) return;
    const days = Number.isFinite(extensionDays) && extensionDays > 0 ? extensionDays : 7;
    const result = extendReservationWithDetails(reservation.id, { days, reason, remarks });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Reservation extended");
    setExtendOpen(false);
    setReason("");
    setRemarks("");
    setExtendOption("7");
    setCustomDays("");
  };

  const handlePartnerAssign = () => {
    if (!reservation) return;
    const result = assignPartnerToReservation(reservation.id, partnerId || null);
    result.ok ? toast.success("Partner assignment updated") : toast.error(result.error);
  };

  if (!plot) return null;

  const showReserveForm = effectiveStatus === "Available" && !reservation;

  return (
    <>
      <RightDrawer
        open={open}
        onClose={closeAndReset}
        title={`Plot ${plot.plotNumber}`}
        subtitle={`${layout?.name || plot.layoutName} · ${venture?.name || plot.ventureName}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={closeAndReset}>
              Close
            </Button>
            {showReserveForm && (
              <Button variant="accent" size="md" onClick={() => setConfirmAction("reserve")} disabled={!customerId}>
                Reserve Plot
              </Button>
            )}
          </>
        }
      >
        <div className="rsv-drawer-section">
          <h4>Plot Information</h4>
          <div className="rsv-drawer-grid">
            <div className="rsv-drawer-field"><span>Area</span><strong>{plot.areaSqYards} sq.yd</strong></div>
            <div className="rsv-drawer-field"><span>Dimensions</span><strong>{plot.dimensions}</strong></div>
            <div className="rsv-drawer-field"><span>Facing</span><strong>{plot.facing}</strong></div>
            <div className="rsv-drawer-field"><span>Price</span><strong>{formatINR(plot.finalPrice || plot.totalPrice)}</strong></div>
            <div className="rsv-drawer-field"><span>Current Status</span><ReservationStatus status={effectiveStatus} /></div>
            <div className="rsv-drawer-field"><span>Reservation Expiry</span><strong>{plot.reservationExpiry ? formatDate(plot.reservationExpiry) : "—"}</strong></div>
          </div>
        </div>

        {(reservation?.expiryDate || plot.reservationExpiry) && (
          <div className="rsv-drawer-section">
            <CountdownBadge expiryDate={reservation?.expiryDate || plot.reservationExpiry} status={reservation?.status || "Reserved"} size="lg" />
          </div>
        )}

        <div className="rsv-drawer-section">
          <h4>Customer</h4>
          {reservation ? (
            <div className="rsv-drawer-grid">
              <div className="rsv-drawer-field"><span>Name</span><strong>{reservation.customerName}</strong></div>
              <div className="rsv-drawer-field"><span>Phone</span><strong>{reservation.customerPhone}</strong></div>
              <div className="rsv-drawer-field"><span>Email</span><strong>{reservation.customerEmail}</strong></div>
              <div className="rsv-drawer-field"><span>Booking History</span><strong>Placeholder</strong></div>
            </div>
          ) : (
            <>
              <Select
                label="Existing Customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={customerOptions}
              />
              <Button variant="ghost" size="sm" icon={<FiUserPlus />} to="/dashboard/customers/new">
                New Customer
              </Button>
            </>
          )}
        </div>

        <div className="rsv-drawer-section">
          <h4>Sales Team Member</h4>
          <Select
            label={reservation ? "Assigned Partner" : "Assign Partner (Optional)"}
            value={partnerId || reservation?.partnerId || ""}
            onChange={(e) => setPartnerId(e.target.value)}
            options={partnerOptions}
          />
          {reservation && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction("partner")}>
              Assign Partner
            </Button>
          )}
        </div>

        <div className="rsv-drawer-section">
          <h4>Reservation</h4>
          {reservation ? (
            <>
              <div className="rsv-drawer-grid">
                <div className="rsv-drawer-field"><span>Reservation ID</span><strong>{reservation.reference}</strong></div>
                <div className="rsv-drawer-field"><span>Reserved On</span><strong>{formatDate(reservation.reservationDate)}</strong></div>
                <div className="rsv-drawer-field"><span>Expiry</span><strong>{formatDate(reservation.expiryDate)}</strong></div>
                <div className="rsv-drawer-field"><span>Reservation Amount</span><strong>{formatINR(reservation.reservationAmount)}</strong></div>
                <div className="rsv-drawer-field"><span>Current Status</span><ReservationStatus status={reservation.status} /></div>
              </div>
              <h4 style={{ marginTop: "0.85rem" }}>Timeline</h4>
              <ReservationTimeline events={reservation.timeline || []} compact />
            </>
          ) : (
            <Input
              label="Reservation Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(minAmount)}
              hint={`Minimum required: ${formatINR(minAmount)}`}
            />
          )}
        </div>

        <div className="rsv-drawer-section">
          <h4>Quick Actions</h4>
          <div className="rsv-quick-actions">
            {showReserveForm && (
              <Button variant="accent" size="sm" onClick={() => setConfirmAction("reserve")} disabled={!customerId}>
                Reserve Plot
              </Button>
            )}
            {reservation?.status === "Reserved" && (
              <>
                <Button variant="accent" size="sm" onClick={() => setConfirmAction("confirm")}>
                  Confirm Reservation
                </Button>
                <Button variant="ghost" size="sm" icon={<FiClock />} onClick={() => setExtendOpen(true)}>
                  Extend Reservation
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmAction("cancel")}>
                  Cancel Reservation
                </Button>
                <Button variant="ghost" size="sm" icon={<FiRefreshCw />} onClick={() => setConfirmAction("release")}>
                  Release Plot
                </Button>
              </>
            )}
            {reservation?.status === "Confirmed" && (
              <>
                <Button variant="accent" size="sm" to="/dashboard/bookings/new">
                  Open Booking
                </Button>
                <Button variant="ghost" size="sm" to="/dashboard/documents/registrations">
                  Start Registration
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rsv-drawer-section">
          <h4>Plot History</h4>
          <PlotTimeline plot={plot} />
        </div>
      </RightDrawer>

      <ConfirmationModal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title="Confirm action?"
        message="This action will create immutable activity records and update plot availability across the ERP."
        confirmLabel="Proceed"
        tone={["cancel", "release"].includes(confirmAction) ? "danger" : "accent"}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "reserve") handleReserve();
          if (action === "confirm") handleConfirm();
          if (action === "cancel") handleCancel();
          if (action === "release") handleRelease();
          if (action === "partner") handlePartnerAssign();
        }}
      />

      <RightDrawer
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Reservation Extension"
        subtitle={reservation ? `${reservation.reference} · Current expiry: ${formatDate(reservation.expiryDate)}` : "—"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" onClick={handleExtend}>
              Apply Extension
            </Button>
          </>
        }
      >
        <div className="rsv-drawer-section">
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
          <Textarea label="Reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Textarea label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <div className="rsv-drawer-section">
          <h4>History</h4>
          {(reservation?.extensions || []).length ? (
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
    </>
  );
}


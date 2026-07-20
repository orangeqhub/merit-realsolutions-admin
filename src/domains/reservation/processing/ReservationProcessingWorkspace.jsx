import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/ui/select/Select";
import StatsCard from "../../../components/cards/StatsCard";
import TableToolbar from "../../../components/table/TableToolbar";
import DataTable from "../../../components/table/DataTable";
import Checkbox from "../../../components/ui/checkbox/Checkbox";
import ConfirmationModal from "../../../components/modal/ConfirmationModal";
import CountdownBadge from "../../../components/reservation/CountdownBadge";
import ReservationStatus from "../../../components/reservation/ReservationStatus";
import { useReservations } from "../../../context/ReservationContext";
import { usePlots } from "../../../shared/hooks/usePlots.js";
import { useToast } from "../../../components/feedback/Toast";
import { formatINR, formatDate } from "../../../utils/format";
import { getPriority, getProcessingKpis } from "../../../services/reservation/reservationService";
import "../../../components/reservation/reservation.css";
import "./reservationProcessing.css";

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "Reserved", label: "Reserved" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Registered", label: "Registered" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Released", label: "Released" },
];

const PRIORITY_FILTERS = [
  { value: "", label: "All Priorities" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Normal", label: "Normal" },
];

function PriorityChip({ value }) {
  const tone = (value || "Normal").toLowerCase();
  return <span className={`rsv-proc__chip rsv-proc__chip--${tone}`}>{value}</span>;
}

export default function ReservationProcessingWorkspace() {
  const toast = useToast();
  const navigate = useNavigate();
  usePlots();
  const {
    reservations,
    ventures,
    settings,
    runReminderSweep,
    runAutoRelease,
  } = useReservations();

  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("");
  const [ventureId, setVentureId] = useState("");
  const [priority, setPriority] = useState("");
  const [verification, setVerification] = useState("");

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  const [confirmOpen, setConfirmOpen] = useState(null);

  const kpis = useMemo(() => getProcessingKpis(reservations, settings), [reservations, settings]);

  const ventureOptions = useMemo(
    () => [{ value: "", label: "All Ventures" }, ...ventures.map((v) => ({ value: v.id, label: v.name }))],
    [ventures]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations
      .map((r) => ({ ...r, priority: getPriority(r) }))
      .filter((r) => (status ? r.status === status : true))
      .filter((r) => (ventureId ? r.ventureId === ventureId : true))
      .filter((r) => (priority ? r.priority === priority : true))
      .filter((r) => {
        if (!verification) return true;
        const pending = !r.verification?.completed && r.status === "Reserved";
        return verification === "pending" ? pending : !pending;
      })
      .filter((r) => {
        if (!q) return true;
        return [
          r.reference,
          r.customerName,
          r.customerPhone,
          r.plotNumber,
          r.ventureName,
          r.layoutName,
          r.partnerName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [reservations, search, status, ventureId, priority, verification]);

  const isAllSelected = filtered.length > 0 && filtered.every((r) => selected[r.id]);
  const isSomeSelected = filtered.some((r) => selected[r.id]);

  const toggleAll = useCallback((checked) => {
    if (!checked) {
      setSelected({});
      return;
    }
    const next = {};
    filtered.forEach((r) => {
      next[r.id] = true;
    });
    setSelected(next);
  }, [filtered]);

  const bulkAction = (action) => {
    if (!selectedIds.length) return;
    setConfirmOpen({ action, ids: selectedIds });
  };

  const handleModalConfirm = () => {
    if (!confirmOpen) return;
    const { action, ids } = confirmOpen;
    setConfirmOpen(null);

    if (action === "reminders") {
      const count = runReminderSweep();
      toast.info(count ? `Created ${count} reminder record(s)` : "No reminders due right now");
      return;
    }

    if (action === "auto-release") {
      const count = runAutoRelease();
      toast.info(count ? `Auto-released ${count} reservation(s)` : "No expired reservations to release");
      return;
    }

    toast.info(`Bulk ${action} applied to ${ids.length} reservation(s)`);
  };

  const columns = useMemo(
    () => [
      {
        key: "__select__",
        header: (
          <Checkbox
            checked={isAllSelected}
            indeterminate={!isAllSelected && isSomeSelected}
            onChange={(checked) => toggleAll(checked)}
          />
        ),
        className: "data-table__td--tight",
        render: (row) => (
          <Checkbox
            checked={Boolean(selected[row.id])}
            onChange={(checked) => setSelected((p) => ({ ...p, [row.id]: checked }))}
          />
        ),
      },
      {
        key: "reference",
        header: "Reservation ID",
        sortable: true,
        render: (row) => (
          <Link to={`/dashboard/reservations/processing/${row.id}`} className="rsv-card__ref">
            {row.reference}
          </Link>
        ),
      },
      { key: "customerName", header: "Customer", sortable: true },
      { key: "customerPhone", header: "Mobile", sortable: true },
      { key: "ventureName", header: "Venture", sortable: true },
      { key: "layoutName", header: "Layout", sortable: true },
      { key: "plotNumber", header: "Plot Number", sortable: true },
      { key: "partnerName", header: "Sales Team Member", sortable: true, render: (row) => row.partnerName || "—" },
      {
        key: "reservationAmount",
        header: "Reservation Amount",
        sortable: true,
        align: "right",
        sortAccessor: (row) => Number(row.reservationAmount) || 0,
        render: (row) => formatINR(row.reservationAmount),
      },
      { key: "reservationDate", header: "Reservation Date", sortable: true, render: (row) => formatDate(row.reservationDate) },
      { key: "expiryDate", header: "Expiry Date", sortable: true, render: (row) => formatDate(row.expiryDate) },
      {
        key: "remainingDays",
        header: "Remaining",
        sortable: true,
        sortAccessor: (row) => Number(row.remainingDays) || 0,
        render: (row) => <CountdownBadge expiryDate={row.expiryDate} status={row.status} />,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <ReservationStatus status={row.status} />,
      },
      {
        key: "priority",
        header: "Priority",
        sortable: true,
        render: (row) => <PriorityChip value={row.priority} />,
      },
      {
        key: "__actions__",
        header: "Actions",
        render: (row) => (
          <div className="rsv-proc__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/reservations/processing/${row.id}`);
              }}
            >
              Open
            </Button>
          </div>
        ),
      },
    ],
    [isAllSelected, isSomeSelected, selected, navigate, toggleAll]
  );

  const verificationFilters = [
    { value: "", label: "All Verification" },
    { value: "pending", label: "Pending Verification" },
    { value: "done", label: "Verified" },
  ];

  const rulesPanel = (
    <div className="rsv-proc__panel">
      <h3>Rules Panel</h3>
      <div className="rsv-proc__rule-kv">
        <div className="rsv-proc__kv">
          <span>Reservation validity period</span>
          <strong>{settings.validityDays} working day(s)</strong>
        </div>
        <div className="rsv-proc__kv">
          <span>Auto release enabled</span>
          <strong>{settings.autoReleaseEnabled ? "Yes" : "No"}</strong>
        </div>
        <div className="rsv-proc__kv">
          <span>Maximum extensions</span>
          <strong>{settings.maxExtensions}</strong>
        </div>
        <div className="rsv-proc__kv">
          <span>Grace period</span>
          <strong>{settings.gracePeriodDays} day(s)</strong>
        </div>
        <div className="rsv-proc__kv">
          <span>Reminder intervals</span>
          <strong>{(settings.reminderFrequencyDays || []).join(", ")} days</strong>
        </div>
        <div className="rsv-proc__kv">
          <span>Minimum reservation amount</span>
          <strong>
            {settings.minimumReservationPercent}% or {formatINR(settings.minimumReservationFlat)}
          </strong>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rsv-proc reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Reservation Processing Workspace"
        description="Daily operational workspace to verify, approve, extend, cancel, or release reservations — with complete traceability."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Processing Workspace" },
        ]}
        actions={
          <>
            <Button
              variant="ghost"
              size="md"
              icon={<FiShield />}
              to="/dashboard/reservations/rules"
            >
              Rules
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={<FiActivity />}
              to="/dashboard/reservations/activity"
            >
              Activity
            </Button>
          </>
        }
      />

      <div className="rsv-proc__kpis">
        <StatsCard
          icon={<FiClock />}
          label="Total Active Reservations"
          value={kpis.totalActive}
          tone="accent"
          trend={kpis.trends.totalActive}
          delay={0}
        />
        <StatsCard
          icon={<FiShield />}
          label="Pending Verification"
          value={kpis.pendingVerification}
          tone="warning"
          trend={kpis.trends.pendingVerification}
          delay={0.04}
        />
        <StatsCard
          icon={<FiClock />}
          label="Expiring Today"
          value={kpis.expiringToday}
          tone="danger"
          delay={0.08}
        />
        <StatsCard
          icon={<FiClock />}
          label="Expiring This Week"
          value={kpis.expiringThisWeek}
          tone="warning"
          delay={0.12}
        />
        <StatsCard
          icon={<FiCheckCircle />}
          label="Confirmed Today"
          value={kpis.confirmedToday}
          tone="success"
          delay={0.16}
        />
        <StatsCard
          icon={<FiRefreshCw />}
          label="Released Reservations"
          value={kpis.releasedReservations}
          tone="muted"
          delay={0.2}
        />
        <StatsCard
          icon={<FiActivity />}
          label="Cancelled Reservations"
          value={kpis.cancelledReservations}
          tone="danger"
          delay={0.24}
        />
        <StatsCard
          icon={<FiCheckCircle />}
          label="Reservation Value"
          value={Math.round(kpis.reservationValue / 100000)}
          prefix="₹"
          suffix=" L"
          tone="success"
          trend={kpis.trends.reservationValue}
          delay={0.28}
        />
        <StatsCard
          icon={<FiClock />}
          label="Average Reservation Age"
          value={kpis.averageReservationAge}
          suffix=" days"
          tone="violet"
          delay={0.32}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="rsv-proc__bulkbar">
          <div>
            <strong>{selectedIds.length} selected</strong>
            <div className="rsv-timeline__meta">Bulk actions apply to the current filtered queue.</div>
          </div>
          <div className="rsv-proc__actions">
            <Button variant="ghost" size="sm" onClick={() => bulkAction("release")}>
              Release Selected
            </Button>
            <Button variant="danger" size="sm" onClick={() => bulkAction("cancel")}>
              Cancel Selected
            </Button>
          </div>
        </div>
      )}

      <div className="rsv-proc__row">
        <div className="rsv-proc__panel">
          <h3>Reservation Queue</h3>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by reservation ID, customer, mobile, plot, venture..."
            filters={
              <>
                <Select value={status} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_FILTERS} />
                <Select value={ventureId} onChange={(e) => setVentureId(e.target.value)} options={ventureOptions} />
                <Select value={priority} onChange={(e) => setPriority(e.target.value)} options={PRIORITY_FILTERS} />
                <Select
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  options={verificationFilters}
                />
              </>
            }
            actions={
              <>
                <Button variant="ghost" size="sm" icon={<FiClock />} onClick={() => setConfirmOpen({ action: "reminders" })}>
                  Run Reminder Sweep
                </Button>
                <Button variant="ghost" size="sm" icon={<FiRefreshCw />} onClick={() => setConfirmOpen({ action: "auto-release" })}>
                  Run Auto Release
                </Button>
                <Button variant="ghost" size="sm" to="/dashboard/reservations/monitor">
                  Auto Release Monitor
                </Button>
              </>
            }
          />

          <DataTable
            columns={columns}
            data={filtered}
            rowKey="id"
            onRowClick={(row) => navigate(`/dashboard/reservations/processing/${row.id}`)}
          />
        </div>

        {rulesPanel}
      </div>

      <ConfirmationModal
        open={Boolean(confirmOpen)}
        onClose={() => setConfirmOpen(null)}
        title="Confirm bulk operation?"
        message={
          confirmOpen?.action === "reminders"
            ? "Generate reminder records for all due reservations. This will create immutable timeline and activity entries."
            : confirmOpen?.action === "auto-release"
              ? "Run the auto-release service now. Expired Reserved reservations will be released and inventory updated."
              : "This action will create immutable activity logs and update inventory status across the ERP."
        }
        confirmLabel="Proceed"
        tone={confirmOpen?.action === "cancel" ? "danger" : "accent"}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}


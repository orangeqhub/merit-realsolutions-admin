import { useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Tabs from "../../../components/navigation/Tabs";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/table/DataTable";
import { useReservations } from "../../../context/ReservationContext";
import { useToast } from "../../../components/feedback/Toast";
import { formatDate } from "../../../utils/format";
import "../../../components/reservation/reservation.css";
import "./reservationProcessing.css";

const TABS = [
  { id: "expired", label: "Expired Reservations" },
  { id: "releasing", label: "Releasing Today" },
  { id: "released", label: "Released" },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AutoReleaseMonitor() {
  const toast = useToast();
  const { reservations, runAutoRelease } = useReservations();
  const [tab, setTab] = useState("expired");

  const t = today();

  const expired = useMemo(
    () => reservations.filter((r) => r.status === "Reserved" && r.isExpired),
    [reservations]
  );

  const releasingToday = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === "Reserved" && !r.isExpired && r.expiryDate === t
      ),
    [reservations, t]
  );

  const released = useMemo(
    () => reservations.filter((r) => r.status === "Released"),
    [reservations]
  );

  const data = tab === "expired" ? expired : tab === "releasing" ? releasingToday : released;

  const columns = useMemo(
    () => [
      { key: "reference", header: "Reservation", sortable: true },
      { key: "customerName", header: "Customer", sortable: true },
      { key: "plotNumber", header: "Plot", sortable: true },
      { key: "ventureName", header: "Venture", sortable: true },
      { key: "expiryDate", header: "Expiry", sortable: true, render: (r) => formatDate(r.expiryDate) },
      {
        key: "reason",
        header: "Reason",
        render: (r) =>
          r.status === "Released"
            ? "Released"
            : r.isExpired
              ? "Expiry passed"
              : "Expiring today",
      },
      {
        key: "releasedOn",
        header: "Released On",
        render: (r) => {
          const rel = (r.timeline || []).find((x) => x.type === "released");
          return rel ? formatDate(rel.date) : "—";
        },
      },
      {
        key: "releasedBy",
        header: "Released By",
        render: (r) => {
          const rel = (r.timeline || []).find((x) => x.type === "released");
          return rel ? rel.actor : "—";
        },
      },
      {
        key: "mode",
        header: "Automatic / Manual",
        render: (r) => {
          const rel = (r.timeline || []).find((x) => x.type === "released");
          if (!rel) return "—";
          return rel.actor === "Auto Release Service" ? "Automatic" : "Manual";
        },
      },
    ],
    []
  );

  return (
    <div className="rsv-proc reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Auto Release Monitor"
        description="Operational monitor for expired reservations and release executions."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Auto Release Monitor" },
        ]}
        actions={
          <Button
            variant="ghost"
            size="md"
            icon={<FiRefreshCw />}
            onClick={() => {
              const count = runAutoRelease();
              toast.info(count ? `Auto-released ${count} reservation(s)` : "No expired reservations to release");
            }}
          >
            Run Auto Release Now
          </Button>
        }
      />

      <div className="rsv-proc__panel">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <DataTable columns={columns} data={data} rowKey="id" />
        {!data.length && (
          <p className="rsv-empty-hint">
            {tab === "expired"
              ? "No expired reservations right now."
              : tab === "releasing"
                ? "No reservations expiring today."
                : "No released reservations."}
          </p>
        )}
      </div>
    </div>
  );
}


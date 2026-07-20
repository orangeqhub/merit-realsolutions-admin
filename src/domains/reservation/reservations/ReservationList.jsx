import { useMemo, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import ReservationCard from "../../../components/reservation/ReservationCard";
import { useReservations } from "../../../context/ReservationContext";
import { useToast } from "../../../components/feedback/Toast";
import { RESERVATION_STATUSES } from "../../../services/reservation/reservationStatus";
import "../../../components/reservation/reservation.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...RESERVATION_STATUSES.map((s) => ({ value: s, label: s })),
];

export default function ReservationList() {
  const toast = useToast();
  const { reservations, ventures, filterReservations, confirmReservation } = useReservations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ventureId, setVentureId] = useState("");

  const filtered = useMemo(
    () => filterReservations({ search, status: status === "all" ? "" : status, ventureId }),
    [filterReservations, search, status, ventureId]
  );

  const ventureOptions = [
    { value: "", label: "All Ventures" },
    ...ventures.map((v) => ({ value: v.id, label: v.name })),
  ];

  const handleAction = (action, reservation) => {
    if (action === "confirm") {
      const result = confirmReservation(reservation.id, {
        remarks: "Payment verified by administrator",
      });
      if (result.ok) toast.success(`Reservation ${reservation.reference} confirmed`);
      else toast.error(result.error);
    }
  };

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Reservations"
        description="Complete reservation registry — single source of truth for all inventory holds across ERP, website, and channel partners."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Reservations" },
        ]}
        actions={
          <Button variant="accent" size="md" to="/dashboard/reservations/interactive" icon={<FiPlus />}>
            New Reservation
          </Button>
        }
      />

      <div className="rsv-list-toolbar">
        <div className="rsv-list-filters">
          <Input
            placeholder="Search reservations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<FiSearch />}
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
          <Select value={ventureId} onChange={(e) => setVentureId(e.target.value)} options={ventureOptions} />
        </div>
        <span className="rsv-feed__item span">{filtered.length} of {reservations.length}</span>
      </div>

      <div className="rsv-grid-3">
        {filtered.map((r) => (
          <ReservationCard key={r.id} reservation={r} onAction={handleAction} />
        ))}
      </div>

      {!filtered.length && (
        <p className="rsv-empty-hint">No reservations match your filters.</p>
      )}
    </div>
  );
}

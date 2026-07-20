import PageHeader from "../../../components/layout/PageHeader";
import ReservationRules from "../../../components/reservation/ReservationRules";
import { useReservations } from "../../../context/ReservationContext";
import { useToast } from "../../../components/feedback/Toast";
import "../../../components/reservation/reservation.css";

export default function ReservationRulesPage() {
  const toast = useToast();
  const { rules, updateRule, settings } = useReservations();

  const handleToggle = (ruleId, enabled) => {
    updateRule(ruleId, { enabled });
    toast.success(`Rule ${enabled ? "enabled" : "disabled"}`);
  };

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Reservation Rules Engine"
        description="Configurable business rules governing reservation lifecycle, inventory locking, expiry, and audit compliance."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Rules" },
        ]}
      />

      <section className="rsv-panel">
        <header className="rsv-panel__head">
          <div>
            <h3>Active Rules</h3>
            <p>
              Rules are enforced by the reservation domain. Current validity: {settings.validityDays} days ·
              Auto-release: {settings.autoReleaseEnabled ? "On" : "Off"} ·
              Min amount: {settings.minimumReservationPercent}%
            </p>
          </div>
        </header>
        <ReservationRules rules={rules} onToggle={handleToggle} />
      </section>
    </div>
  );
}

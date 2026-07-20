import { useState } from "react";
import { FiSave, FiRefreshCw } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import FormSection from "../../../components/forms/FormSection";
import { useReservations } from "../../../context/ReservationContext";
import { useToast } from "../../../components/feedback/Toast";
import { formatDate } from "../../../utils/format";
import "../../../components/reservation/reservation.css";

export default function ReservationSettings() {
  const toast = useToast();
  const { settings, updateSettings, lastAutoReleaseRun, autoReleaseSchedule, runAutoRelease } = useReservations();
  const [form, setForm] = useState({ ...settings });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateSettings(form);
    toast.success("Reservation settings updated");
  };

  const handleAutoRelease = () => {
    const count = runAutoRelease();
    toast.info(count ? `Auto-released ${count} expired reservation(s)` : "No expired reservations to release");
  };

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Reservation Settings"
        description="Administrator-configurable reservation policies. Nothing is hardcoded — all business rules derive from these settings."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Settings" },
        ]}
        actions={
          <Button variant="accent" size="md" icon={<FiSave />} onClick={handleSave}>
            Save Settings
          </Button>
        }
      />

      <section className="rsv-panel">
        <FormSection title="Reservation Validity">
          <div className="rsv-settings-form">
            <Input
              label="Validity (Days)"
              type="number"
              value={form.validityDays}
              onChange={(e) => setField("validityDays", Number(e.target.value))}
            />
            <Input
              label="Grace Period (Days)"
              type="number"
              value={form.gracePeriodDays}
              onChange={(e) => setField("gracePeriodDays", Number(e.target.value))}
            />
          </div>
        </FormSection>

        <FormSection title="Minimum Reservation Amount">
          <div className="rsv-settings-form">
            <Input
              label="Minimum Percent (%)"
              type="number"
              value={form.minimumReservationPercent}
              onChange={(e) => setField("minimumReservationPercent", Number(e.target.value))}
            />
            <Input
              label="Minimum Flat Amount (₹)"
              type="number"
              value={form.minimumReservationFlat}
              onChange={(e) => setField("minimumReservationFlat", Number(e.target.value))}
            />
          </div>
        </FormSection>

        <FormSection title="Auto Release & Reminders">
          <div className="rsv-settings-form">
            <Input
              label="Auto Release Enabled"
              value={form.autoReleaseEnabled ? "Yes" : "No"}
              onChange={(e) => setField("autoReleaseEnabled", e.target.value === "Yes")}
              hint="Set via toggle in production; type Yes/No for demo"
            />
            <Input
              label="Reminder Frequency (days, comma-separated)"
              value={(form.reminderFrequencyDays || []).join(", ")}
              onChange={(e) =>
                setField(
                  "reminderFrequencyDays",
                  e.target.value.split(",").map((v) => Number(v.trim())).filter(Boolean)
                )
              }
            />
            <Input
              label="Maximum Extensions"
              type="number"
              value={form.maxExtensions}
              onChange={(e) => setField("maxExtensions", Number(e.target.value))}
            />
            <Input
              label="Extension Options (days, comma-separated)"
              value={(form.extensionOptions || []).join(", ")}
              onChange={(e) =>
                setField(
                  "extensionOptions",
                  e.target.value.split(",").map((v) => Number(v.trim())).filter(Boolean)
                )
              }
            />
          </div>
        </FormSection>

        <FormSection title="Working Days">
          <div className="rsv-settings-form">
            <Input
              label="Working Days Only"
              value={form.workingDaysOnly ? "Yes" : "No"}
              onChange={(e) => setField("workingDaysOnly", e.target.value === "Yes")}
            />
            <Input
              label="Working Days (0=Sun … 6=Sat, comma-separated)"
              value={(form.workingDays || []).join(", ")}
              onChange={(e) =>
                setField(
                  "workingDays",
                  e.target.value.split(",").map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n))
                )
              }
            />
          </div>
        </FormSection>
      </section>

      <section className="rsv-panel">
        <header className="rsv-panel__head">
          <div>
            <h3>Auto Release Service</h3>
            <p>Scheduled architecture for automatic expiry handling — no manual intervention required.</p>
          </div>
        </header>
        <div className="rsv-auto-release-banner">
          <div>
            <strong>Schedule:</strong> {autoReleaseSchedule || "0 */6 * * *"}
            <br />
            <strong>Last Run:</strong> {lastAutoReleaseRun ? formatDate(lastAutoReleaseRun.split("T")[0]) : "Never"}
          </div>
          <Button variant="ghost" size="sm" icon={<FiRefreshCw />} onClick={handleAutoRelease}>
            Run Auto Release Now
          </Button>
        </div>
        <p className="rsv-feed__item span">
          Last updated by {settings.updatedBy} on {formatDate(settings.updatedAt)}
        </p>
      </section>
    </div>
  );
}

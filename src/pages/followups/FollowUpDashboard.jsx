import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiList, FiCalendar, FiClock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import KPIGrid from "../../components/dashboard/KPIGrid";
import Badge from "../../components/ui/badge/Badge";
import { useFollowUps } from "../../context/FollowUpsContext";
import {
  FOLLOWUP_STATUS_META,
  resolveStatus,
  formatDate,
} from "./constants";
import "./followups.css";

export default function FollowUpDashboard() {
  const { followUps } = useFollowUps();

  const enriched = useMemo(
    () => followUps.map((f) => ({ ...f, displayStatus: resolveStatus(f) })),
    [followUps]
  );

  const stats = useMemo(
    () => ({
      today: enriched.filter((f) => f.displayStatus === "Today").length,
      upcoming: enriched.filter((f) => f.displayStatus === "Upcoming").length,
      overdue: enriched.filter((f) => f.displayStatus === "Overdue").length,
      completed: enriched.filter((f) => f.displayStatus === "Completed").length,
    }),
    [enriched]
  );

  const upcoming = useMemo(
    () =>
      [...enriched]
        .filter((f) => f.displayStatus !== "Completed")
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
        .slice(0, 6),
    [enriched]
  );

  return (
    <motion.div
      className="erp-module-page followups-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Follow-ups Dashboard"
        description="Track scheduled calls, meetings and site visits across leads and customers."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/follow-ups/list">
              <FiList /> All Follow-ups
            </Button>
            <Button variant="accent" size="md" to="/dashboard/follow-ups/new">
              <FiPlus /> New Follow-up
            </Button>
          </>
        }
      />

      <KPIGrid
        items={[
          { icon: <FiCalendar />, label: "Today", value: stats.today, tone: "warning" },
          { icon: <FiClock />, label: "Upcoming", value: stats.upcoming, tone: "info" },
          { icon: <FiAlertCircle />, label: "Overdue", value: stats.overdue, tone: "danger" },
          { icon: <FiCheckCircle />, label: "Completed", value: stats.completed, tone: "success" },
        ]}
      />

      <section>
        <h2 className="erp-section-title">Up Next</h2>
        <div className="followups-recent__list">
          {upcoming.length === 0 ? (
            <p className="followups-table__muted">No pending follow-ups scheduled.</p>
          ) : (
            upcoming.map((f) => (
              <div key={f.id} className="followups-recent__item">
                <div>
                  <strong className="followups-table__name">{f.leadName || f.customerName || "—"}</strong>
                  <span className="followups-table__muted">
                    {f.type} · {f.assignedTo || "Unassigned"}
                  </span>
                </div>
                <Badge tone={FOLLOWUP_STATUS_META[f.displayStatus]?.tone}>{f.displayStatus}</Badge>
                <span className="followups-table__muted">
                  {formatDate(f.scheduledDate)} {f.scheduledTime}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: "var(--erp-gap-lg)" }}>
        <Link to="/dashboard/follow-ups/list" className="followups-table__muted">
          View full list with calendar →
        </Link>
      </section>
    </motion.div>
  );
}

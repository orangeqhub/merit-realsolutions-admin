import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiList, FiTarget, FiTrendingUp, FiCheckCircle, FiXCircle } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import KPIGrid from "../../components/dashboard/KPIGrid";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import Badge from "../../components/ui/badge/Badge";
import { useLeads } from "../../context/LeadsContext";
import { LEAD_STATUSES, LEAD_STATUS_META, formatINR, formatDate } from "./constants";
import "./leads.css";

export default function LeadDashboard() {
  const { leads } = useLeads();

  const stats = useMemo(() => {
    const open = leads.filter((l) => !["Won", "Lost"].includes(l.status)).length;
    const won = leads.filter((l) => l.status === "Won").length;
    const lost = leads.filter((l) => l.status === "Lost").length;
    const pipelineValue = leads
      .filter((l) => !["Won", "Lost"].includes(l.status))
      .reduce((s, l) => s + (Number(l.budget) || 0), 0);
    return { total: leads.length, open, won, lost, pipelineValue };
  }, [leads]);

  const bySource = useMemo(() => {
    const map = {};
    leads.forEach((l) => {
      const src = l.source || "Unknown";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [leads]);

  const recent = useMemo(
    () =>
      [...leads]
        .sort((a, b) => new Date(b.lastUpdated || b.createdDate) - new Date(a.lastUpdated || a.createdDate))
        .slice(0, 6),
    [leads]
  );

  return (
    <motion.div
      className="erp-module-page leads-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Leads Dashboard"
        description="Track sales pipeline, lead sources and conversion across Merit Real Solutions ventures."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/leads/list">
              <FiList /> All Leads
            </Button>
            <Button variant="ghost" size="md" to="/dashboard/leads/pipeline">
              <FiTarget /> Pipeline
            </Button>
          </>
        }
      />

      <KPIGrid
        items={[
          { icon: <FiTarget />, label: "Total Leads", value: stats.total, tone: "accent" },
          { icon: <FiTrendingUp />, label: "Open Pipeline", value: stats.open, tone: "info" },
          { icon: <FiCheckCircle />, label: "Won", value: stats.won, tone: "success" },
          { icon: <FiXCircle />, label: "Lost", value: stats.lost, tone: "danger" },
          { icon: <FiTrendingUp />, label: "Pipeline Value", value: stats.pipelineValue, prefix: "₹", tone: "warning" },
        ]}
      />

      <div className="erp-dashboard__charts">
        <AnalyticsCard title="Leads by Source" subtitle="Acquisition channels" delay={0.1}>
          <ChartCard title="">
            <BarChart data={bySource.length ? bySource : [{ label: "—", value: 0 }]} />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard title="Status Mix" subtitle="By lead count" delay={0.15}>
          <div className="leads-dashboard__status-list">
            {LEAD_STATUSES.map((status) => {
              const count = leads.filter((l) => l.status === status).length;
              const meta = LEAD_STATUS_META[status];
              return (
                <div key={status} className="leads-dashboard__status-row">
                  <Badge tone={meta.tone}>{status}</Badge>
                  <span className="leads-table__muted">{count}</span>
                </div>
              );
            })}
          </div>
        </AnalyticsCard>
      </div>

      <section>
        <h2 className="erp-section-title">Recently Updated</h2>
        <div className="leads-recent__list">
          {recent.map((l) => (
            <Link key={l.id} to={`/dashboard/leads/${l.id}`} className="leads-recent__item">
              <div>
                <strong>{l.name}</strong>
                <span>
                  {l.interestedProperty} · {l.assignedExecutive || "Unassigned"}
                </span>
              </div>
              <Badge status={l.status} size="sm" />
              <span className="leads-table__muted">{formatINR(l.budget)}</span>
              <span className="leads-table__muted">{formatDate(l.lastUpdated)}</span>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

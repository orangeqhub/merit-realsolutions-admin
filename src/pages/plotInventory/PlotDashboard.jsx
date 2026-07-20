import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiList, FiUploadCloud, FiUser } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import PlotStatistics from "../../components/plots/PlotStatistics";
import PlotStatusBadge from "../../components/plots/PlotStatusBadge";
import { usePlots } from "../../context/PlotsContext";
import { PLOT_STATUS_META, formatINR } from "./constants";
import "./plotInventory.css";

export default function PlotDashboard() {
  const { plots } = usePlots();

  const statusDistribution = useMemo(() => {
    return Object.keys(PLOT_STATUS_META).map((status) => ({
      label: status,
      value: plots.filter((p) => p.status === status).length,
      color: PLOT_STATUS_META[status].color,
    }));
  }, [plots]);

  const byLayout = useMemo(() => {
    const map = {};
    plots.forEach((p) => {
      map[p.layoutName] = (map[p.layoutName] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label: label.replace(/—.*/, "").trim(), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [plots]);

  const recent = useMemo(
    () =>
      [...plots]
        .filter((p) => ["Booked", "Reserved", "Sold"].includes(p.status))
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 6),
    [plots]
  );

  const totalPlots = plots.length;

  return (
    <motion.div
      className="plot-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Plot Inventory Dashboard"
        description="Real-time overview of plot inventory, availability and revenue across all ventures and layouts."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/plots/import">
              <FiUploadCloud /> Bulk Import
            </Button>
            <Button variant="ghost" size="md" to="/dashboard/plots/list">
              <FiList /> Browse Plots
            </Button>
            <Button variant="accent" size="md" to="/dashboard/plots/new">
              <FiPlus /> Add Plot
            </Button>
          </>
        }
      />

      <PlotStatistics plots={plots} />

      <div className="plot-dashboard__charts">
        <AnalyticsCard title="Plots by Layout" subtitle="Inventory volume per layout" delay={0.1}>
          <ChartCard title="">
            <BarChart data={byLayout.length ? byLayout : [{ label: "—", value: 0 }]} />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard title="Status Distribution" subtitle="Across all plots" delay={0.15}>
          <div className="plot-dashboard__donut">
            <DonutChart data={statusDistribution} centerValue={totalPlots} centerLabel="Total Plots" />
          </div>
        </AnalyticsCard>
      </div>

      <section className="plot-dashboard__recent">
        <h2 className="plot-section-title">Recent Activity</h2>
        <div className="plot-dashboard__recent-list">
          {recent.map((p) => (
            <Link key={p.id} to={`/dashboard/plots/${p.id}`} className="plot-dashboard__recent-item">
              <span className="plot-dashboard__recent-no">{p.plotNumber}</span>
              <div className="plot-dashboard__recent-info">
                <strong>{p.layoutName}</strong>
                <span>
                  {p.customer ? (
                    <>
                      <FiUser /> {p.customer}
                    </>
                  ) : (
                    p.ventureName
                  )}
                </span>
              </div>
              <span className="plot-dashboard__recent-price">{formatINR(p.finalPrice)}</span>
              <PlotStatusBadge status={p.status} size="sm" withTooltip={false} />
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

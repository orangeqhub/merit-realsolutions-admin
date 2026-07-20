import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiList, FiMaximize } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LayoutStatistics from "../../components/layouts/LayoutStatistics";
import { useLayouts } from "../../context/LayoutsContext";
import { formatArea, formatCr } from "./constants";
import "./layout.css";

export default function LayoutDashboard() {
  const { layouts } = useLayouts();

  const ventureBreakdown = useMemo(() => {
    const map = {};
    layouts.forEach((l) => {
      map[l.ventureName] = (map[l.ventureName] || 0) + (l.plots?.total || 0);
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [layouts]);

  const statusTotals = useMemo(() => {
    const t = { available: 0, booked: 0, reserved: 0, sold: 0 };
    layouts.forEach((l) => {
      t.available += l.plots?.available || 0;
      t.booked += l.plots?.booked || 0;
      t.reserved += l.plots?.reserved || 0;
      t.sold += l.plots?.sold || 0;
    });
    return [
      { label: "Available", value: t.available, color: "#059669" },
      { label: "Booked", value: t.booked, color: "#d97706" },
      { label: "Reserved", value: t.reserved, color: "#7c3aed" },
      { label: "Sold", value: t.sold, color: "#2563eb" },
    ];
  }, [layouts]);

  const totalPlots = statusTotals.reduce((s, d) => s + d.value, 0);

  const topLayouts = [...layouts]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5);

  return (
    <motion.div
      className="layout-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Layout Dashboard"
        description="Overview of all layouts, plot inventory and development progress across ventures."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/layouts/list">
              <FiList /> Browse Layouts
            </Button>
            <Button variant="accent" size="md" to="/dashboard/layouts/new">
              <FiPlus /> Add Layout
            </Button>
          </>
        }
      />

      <LayoutStatistics layouts={layouts} />

      <div className="layout-dashboard__charts">
        <AnalyticsCard
          title="Plots by Venture"
          subtitle="Total plots grouped by venture"
          delay={0.1}
        >
          <ChartCard title="">
            <BarChart
              data={ventureBreakdown.length ? ventureBreakdown : [{ label: "—", value: 0 }]}
            />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard
          title="Plot Inventory"
          subtitle="Available, booked, reserved & sold"
          delay={0.15}
        >
          <div className="layout-dashboard__donut">
            <DonutChart data={statusTotals} centerValue={totalPlots} centerLabel="Total Plots" />
          </div>
        </AnalyticsCard>
      </div>

      <section className="layout-dashboard__top">
        <h2 className="layout-section-title">Top Performing Layouts</h2>
        <div className="layout-dashboard__top-list">
          {topLayouts.map((l, i) => (
            <Link key={l.id} to={`/dashboard/layouts/${l.id}`} className="layout-dashboard__top-item">
              <span className="layout-dashboard__rank">{i + 1}</span>
              <img src={l.thumbnail} alt="" />
              <div className="layout-dashboard__top-info">
                <strong>{l.name}</strong>
                <span>
                  {l.ventureName} · <FiMaximize /> {formatArea(l.totalArea)}
                </span>
              </div>
              <span className="layout-dashboard__revenue">{formatCr(l.revenue)}</span>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

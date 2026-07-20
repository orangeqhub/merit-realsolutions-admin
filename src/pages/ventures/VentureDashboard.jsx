import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiList } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import VentureStats from "../../components/venture/VentureStats";
import { useVentures } from "../../context/VenturesContext";
import { useCollection } from "../../shared/hooks/useDataStore.js";
import { getPlotInventoryStatistics } from "../../shared/services/statisticsService.js";
import "./venture.css";

export default function VentureDashboard() {
  const { ventures } = useVentures();
  const plots = useCollection("plots");
  const bookings = useCollection("bookings");

  const plotTotals = useMemo(() => {
    const stats = getPlotInventoryStatistics(plots);
    return [
      { label: "Available", value: stats.available, color: "#059669" },
      { label: "Reserved", value: stats.reserved, color: "#7c3aed" },
      { label: "Booked", value: stats.booked, color: "#d97706" },
      { label: "Sold", value: stats.sold, color: "#2563eb" },
    ].filter((d) => d.value > 0);
  }, [plots]);

  const monthlyBookings = useMemo(() => {
    const months = {};
    bookings
      .filter((b) => b.status !== "Cancelled")
      .forEach((b) => {
        const d = new Date(b.bookingDate || b.createdDate);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        months[key] = (months[key] || 0) + 1;
      });
    return Object.entries(months)
      .slice(-6)
      .map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const topVentures = useMemo(() => {
    return [...ventures]
      .map((v) => {
        const venturePlots = plots.filter((p) => p.ventureId === v.id);
        const sold = venturePlots.filter((p) => p.status === "Sold").length;
        const revenue = bookings
          .filter((b) => b.ventureId === v.id && b.status !== "Cancelled")
          .reduce((s, b) => s + (Number(b.advancePaid) || 0), 0);
        return { ...v, sold, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [ventures, plots, bookings]);

  return (
    <motion.div
      className="venture-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Venture Dashboard"
        description="Real-time overview of all real estate ventures, plot inventory, and revenue performance."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/ventures/list">
              <FiList /> Browse Ventures
            </Button>
            <Button variant="accent" size="md" to="/dashboard/ventures/new">
              <FiPlus /> Add Venture
            </Button>
          </>
        }
      />

      <VentureStats ventures={ventures} />

      <div className="venture-dashboard__charts">
        <AnalyticsCard
          title="Monthly Bookings"
          subtitle="Confirmed bookings across ventures"
          delay={0.1}
        >
          <ChartCard title="">
            <BarChart data={monthlyBookings.length ? monthlyBookings : [{ label: "—", value: 0 }]} />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard
          title="Plot Inventory"
          subtitle="Live status from plot records"
          delay={0.15}
        >
          <div className="venture-dashboard__donut">
            <DonutChart
              data={plotTotals.length ? plotTotals : [{ label: "No plots", value: 1, color: "#94a3b8" }]}
              centerValue={plots.length}
              centerLabel="Total Plots"
            />
          </div>
        </AnalyticsCard>
      </div>

      <section className="venture-dashboard__top">
        <h2 className="venture-section-title">Top Performing Ventures</h2>
        <div className="venture-dashboard__top-list">
          {topVentures.map((v, i) => (
            <Link key={v.id} to={`/dashboard/ventures/${v.id}`} className="venture-dashboard__top-item">
              <span className="venture-dashboard__rank">{i + 1}</span>
              <img src={v.logo} alt="" />
              <div className="venture-dashboard__top-info">
                <strong>{v.name}</strong>
                <span>{v.city}, {v.district}</span>
              </div>
              <span className="venture-dashboard__revenue">
                ₹{(v.revenue / 10000000).toFixed(1)} Cr
              </span>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

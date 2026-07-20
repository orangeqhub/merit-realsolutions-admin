import { FiGrid, FiCheckCircle, FiClock, FiFlag, FiLayers, FiMap, FiDollarSign, FiBookmark, FiTag } from "react-icons/fi";
import KPIGrid from "../dashboard/KPIGrid";
import { getVenturesAggregateStatistics } from "../../shared/services/statisticsService.js";
import "./VentureStats.css";

export default function VentureStats({ ventures = [], compact = false }) {
  const stats = getVenturesAggregateStatistics(ventures);
  const active = ventures.filter((v) => v.status === "Active").length;
  const upcoming = ventures.filter((v) => v.status === "Upcoming").length;
  const completed = ventures.filter((v) => v.status === "Completed").length;

  const items = compact
    ? [
        { icon: <FiGrid />, label: "Total Ventures", value: stats.total, tone: "accent" },
        { icon: <FiCheckCircle />, label: "Active", value: active, tone: "success" },
        { icon: <FiClock />, label: "Upcoming", value: upcoming, tone: "info" },
        { icon: <FiFlag />, label: "Completed", value: completed, tone: "primary" },
      ]
    : [
        { icon: <FiGrid />, label: "Total Ventures", value: stats.total, tone: "accent" },
        { icon: <FiCheckCircle />, label: "Active Ventures", value: active, tone: "success" },
        { icon: <FiClock />, label: "Upcoming", value: upcoming, tone: "info" },
        { icon: <FiFlag />, label: "Completed", value: completed, tone: "primary" },
        { icon: <FiLayers />, label: "Total Layouts", value: stats.totalLayouts, tone: "accent" },
        { icon: <FiMap />, label: "Total Plots", value: stats.totalPlots, tone: "violet" },
        { icon: <FiCheckCircle />, label: "Available", value: stats.availablePlots, tone: "success" },
        { icon: <FiBookmark />, label: "Reserved", value: stats.reservedPlots, tone: "violet" },
        { icon: <FiTag />, label: "Confirmed", value: stats.confirmedPlots, tone: "warning" },
        { icon: <FiFlag />, label: "Registered", value: stats.registeredPlots, tone: "info" },
        { icon: <FiFlag />, label: "Sold", value: stats.soldPlots, tone: "danger" },
        {
          icon: <FiDollarSign />,
          label: "Inventory Value",
          value: Math.round(stats.inventoryValue / 10000000),
          suffix: " Cr",
          decimals: 1,
          tone: "success",
        },
      ];

  return (
    <div className={`venture-stats ${compact ? "venture-stats--compact" : ""}`}>
      <KPIGrid items={items} minWidth={compact ? 200 : 220} />
    </div>
  );
}

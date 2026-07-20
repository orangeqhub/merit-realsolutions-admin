import {
  FiGrid,
  FiMaximize,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiBookmark,
  FiTag,
  FiDollarSign,
  FiFlag,
} from "react-icons/fi";
import KPIGrid from "../dashboard/KPIGrid";
import { getLayoutsAggregateStatistics } from "../../shared/services/statisticsService.js";

export default function LayoutStatistics({ layouts = [], compact = false }) {
  const stats = getLayoutsAggregateStatistics(layouts);

  const items = compact
    ? [
        { icon: <FiLayers />, label: "Total Layouts", value: stats.total, tone: "accent" },
        { icon: <FiGrid />, label: "Total Plots", value: stats.totalPlots, tone: "violet" },
        { icon: <FiCheckCircle />, label: "Available", value: stats.available, tone: "success" },
        { icon: <FiTag />, label: "Sold", value: stats.sold, tone: "info" },
      ]
    : [
        { icon: <FiLayers />, label: "Total Layouts", value: stats.total, tone: "accent" },
        { icon: <FiMaximize />, label: "Total Area", value: stats.totalArea, suffix: " ac", decimals: 1, tone: "primary" },
        { icon: <FiGrid />, label: "Total Plots", value: stats.totalPlots, tone: "violet" },
        { icon: <FiCheckCircle />, label: "Available", value: stats.available, tone: "success" },
        { icon: <FiBookmark />, label: "Reserved", value: stats.reserved, tone: "violet" },
        { icon: <FiClock />, label: "Confirmed", value: stats.confirmed, tone: "warning" },
        { icon: <FiFlag />, label: "Registered", value: stats.registered, tone: "info" },
        { icon: <FiTag />, label: "Sold", value: stats.sold, tone: "danger" },
        { icon: <FiDollarSign />, label: "Total Value", value: Math.round(stats.totalValue / 10000000), suffix: " Cr", decimals: 1, tone: "success" },
      ];

  return <KPIGrid items={items} minWidth={compact ? 200 : 220} />;
}

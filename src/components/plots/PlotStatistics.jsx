import {
  FiGrid,
  FiCheckCircle,
  FiClock,
  FiBookmark,
  FiTag,
  FiLock,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import KPIGrid from "../dashboard/KPIGrid";
import { derivePricing } from "../../pages/plotInventory/constants";

export default function PlotStatistics({ plots = [], compact = false }) {
  const countBy = (status) => plots.filter((p) => p.status === status).length;

  const available = countBy("Available");
  const reserved = countBy("Reserved");
  const booked = countBy("Booked");
  const sold = countBy("Sold");
  const blocked = countBy("Blocked");

  const totalRevenue = plots
    .filter((p) => p.status === "Sold")
    .reduce((s, p) => s + derivePricing(p).finalPrice, 0);

  const expectedRevenue = plots
    .filter((p) => ["Available", "Reserved", "Booked"].includes(p.status))
    .reduce((s, p) => s + derivePricing(p).finalPrice, 0);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toISOString().split("T")[0];
  const todaysBookings = plots.filter(
    (p) => ["Booked", "Reserved"].includes(p.status) && p.lastUpdated === todayStr
  ).length;
  const monthlySales = plots.filter(
    (p) => p.status === "Sold" && (p.lastUpdated || "").startsWith(thisMonth)
  ).length;

  const compactItems = [
    { icon: <FiGrid />, label: "Total Plots", value: plots.length, tone: "accent" },
    { icon: <FiCheckCircle />, label: "Available", value: available, tone: "success" },
    { icon: <FiClock />, label: "Booked", value: booked, tone: "warning" },
    { icon: <FiTag />, label: "Sold", value: sold, tone: "info" },
  ];

  const fullItems = [
    { icon: <FiGrid />, label: "Total Plots", value: plots.length, tone: "accent" },
    { icon: <FiCheckCircle />, label: "Available", value: available, tone: "success" },
    { icon: <FiClock />, label: "Booked", value: booked, tone: "warning" },
    { icon: <FiBookmark />, label: "Reserved", value: reserved, tone: "violet" },
    { icon: <FiTag />, label: "Sold", value: sold, tone: "info" },
    { icon: <FiLock />, label: "Blocked", value: blocked, tone: "danger" },
    { icon: <FiDollarSign />, label: "Total Revenue", value: totalRevenue / 10000000, prefix: "₹", suffix: " Cr", decimals: 2, tone: "success" },
    { icon: <FiTrendingUp />, label: "Expected Revenue", value: expectedRevenue / 10000000, prefix: "₹", suffix: " Cr", decimals: 2, tone: "primary" },
    { icon: <FiCalendar />, label: "Today's Bookings", value: todaysBookings, tone: "warning" },
    { icon: <FiActivity />, label: "Monthly Sales", value: monthlySales, tone: "accent" },
  ];

  return <KPIGrid items={compact ? compactItems : fullItems} minWidth={compact ? 200 : 215} />;
}

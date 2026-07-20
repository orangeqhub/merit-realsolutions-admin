import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiTrendingUp, FiGrid, FiDollarSign, FiArrowRight } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import "./reports.css";

const CATEGORIES = [
  {
    id: "sales",
    title: "Sales Reports",
    description: "Booking statistics, monthly sales, revenue trends and sales executive performance.",
    icon: <FiTrendingUp />,
    path: "/dashboard/reports/sales",
    metrics: ["Booking Statistics", "Monthly Sales", "Revenue", "Performance"],
  },
  {
    id: "inventory",
    title: "Inventory Reports",
    description: "Plot availability, reserved, booked and sold status by property and layout.",
    icon: <FiGrid />,
    path: "/dashboard/reports/inventory",
    metrics: ["Available", "Reserved", "Booked", "Sold"],
  },
  {
    id: "finance",
    title: "Finance Reports",
    description: "Collections, pending dues, payment summary, installments and revenue trends.",
    icon: <FiDollarSign />,
    path: "/dashboard/reports/finance",
    metrics: ["Collections", "Pending Dues", "Installments", "Revenue"],
  },
];

export default function ReportsDashboard() {
  return (
    <motion.div
      className="erp-module-page reports-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Reports"
        description="Professional reporting across sales, inventory and finance — export-ready when backend connects."
      />

      <div className="erp-reports__grid">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            className="reports-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="reports-card__icon">{cat.icon}</div>
            <h3>{cat.title}</h3>
            <p>{cat.description}</p>
            <ul className="reports-card__metrics">
              {cat.metrics.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <Link to={cat.path} className="reports-card__link">
              View Report <FiArrowRight />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

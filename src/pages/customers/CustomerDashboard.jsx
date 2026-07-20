import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlus, FiList, FiUsers, FiCheckCircle, FiAlertCircle, FiDollarSign } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import KPIGrid from "../../components/dashboard/KPIGrid";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import Badge from "../../components/ui/badge/Badge";
import { useCustomers } from "../../context/CustomersContext";
import { KYC_STATUSES, KYC_STATUS_META, formatDate } from "./constants";
import "./customer.css";

export default function CustomerDashboard() {
  const { customers } = useCustomers();

  const stats = useMemo(() => {
    const active = customers.filter((c) => c.status === "Active").length;
    const kycVerified = customers.filter((c) => c.kycStatus === "Verified").length;
    const outstanding = customers.reduce((s, c) => s + (Number(c.outstanding) || 0), 0);
    const totalPaid = customers.reduce((s, c) => s + (Number(c.totalPaid) || 0), 0);
    return { total: customers.length, active, kycVerified, outstanding, totalPaid };
  }, [customers]);

  const byCity = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      const city = c.city || "Unknown";
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [customers]);

  const recent = useMemo(
    () =>
      [...customers]
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 6),
    [customers]
  );

  return (
    <motion.div
      className="erp-module-page customers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Customer Dashboard"
        description="Overview of customer directory, KYC status, payments and engagement across Merit Real Solutions."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/customers/list">
              <FiList /> Directory
            </Button>
            <Button variant="accent" size="md" to="/dashboard/customers/new">
              <FiPlus /> Add Customer
            </Button>
          </>
        }
      />

      <KPIGrid
        items={[
          { icon: <FiUsers />, label: "Total Customers", value: stats.total, tone: "accent" },
          { icon: <FiCheckCircle />, label: "Active", value: stats.active, tone: "info" },
          { icon: <FiAlertCircle />, label: "KYC Verified", value: stats.kycVerified, tone: "success" },
          { icon: <FiDollarSign />, label: "Total Paid", value: stats.totalPaid, prefix: "₹", tone: "warning" },
          { icon: <FiDollarSign />, label: "Outstanding", value: stats.outstanding, prefix: "₹", tone: "danger" },
        ]}
      />

      <div className="erp-dashboard__charts customers-dashboard__charts">
        <AnalyticsCard title="Customers by City" subtitle="Geographic distribution" delay={0.1}>
          <ChartCard title="">
            <BarChart data={byCity.length ? byCity : [{ label: "—", value: 0 }]} />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard title="KYC Status" subtitle="Verification breakdown" delay={0.15}>
          <div className="customers-dashboard__kyc-list">
            {KYC_STATUSES.map((status) => {
              const count = customers.filter((c) => c.kycStatus === status).length;
              const meta = KYC_STATUS_META[status];
              return (
                <div key={status} className="customers-dashboard__kyc-row">
                  <Badge tone={meta.tone}>{status}</Badge>
                  <span className="customers-table__muted">{count}</span>
                </div>
              );
            })}
          </div>
        </AnalyticsCard>
      </div>

      <section>
        <h2 className="erp-section-title">Recent Customers</h2>
        <div className="customers-recent__list">
          {recent.map((c) => (
            <Link
              key={c.id}
              to={`/dashboard/customers/${c.id}`}
              className="customers-recent__item"
            >
              <span className="customers-recent__id">{c.id}</span>
              <div>
                <strong>{c.name}</strong>
                <span>
                  {c.city}, {c.state} · {c.assignedAgent || "Unassigned"}
                </span>
              </div>
              <Badge status={c.kycStatus} size="sm" />
              <span className="customers-table__muted">{formatDate(c.createdDate)}</span>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

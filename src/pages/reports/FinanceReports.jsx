import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import KPIGrid from "../../components/dashboard/KPIGrid";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DataTable from "../../components/table/DataTable";
import { getFinancialReports } from "../../services/admin/financialReportsApi.js";
import { listBookings } from "../../services/booking/bookingApi.js";
import { fetchRevenueReport } from "../../services/sales/salesCrmApi.js";
import { formatINR, formatDate } from "../../utils/format";
import "./reports.css";

export default function FinanceReports() {
  const [reports, setReports] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getFinancialReports(),
      listBookings({ page: 1, pageSize: 100 }),
      fetchRevenueReport().catch(() => null),
    ])
      .then(([financial, bookingResult, revenue]) => {
        setReports(financial);
        setBookings(bookingResult?.items || []);
        setRevenueReport(revenue);
      })
      .catch((err) => setError(err.message || "Failed to load finance reports."))
      .finally(() => setLoading(false));
  }, []);

  const summary = reports?.summary;
  const paymentMethods = reports?.paymentMethods || [];

  const outstandingRows = useMemo(
    () => bookings
      .filter((b) => Number(b.remainingBalance || 0) > 0 && !["CANCELLED", "EXPIRED"].includes(b.status))
      .slice(0, 12),
    [bookings]
  );

  const columns = [
    { key: "bookingNumber", header: "Booking" },
    { key: "customerName", header: "Customer" },
    {
      key: "remainingBalance",
      header: "Outstanding",
      align: "right",
      render: (r) => formatINR(r.remainingBalance),
    },
    {
      key: "totalPaid",
      header: "Paid",
      align: "right",
      render: (r) => formatINR(r.totalPaid),
    },
    { key: "status", header: "Status" },
    {
      key: "reservationExpiresAt",
      header: "Reservation Expiry",
      render: (r) => formatDate(r.reservationExpiresAt),
    },
  ];

  if (loading) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Finance Reports" description="Loading finance data..." />
        <p>Loading reports...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Finance Reports" description="Collections and payment summary." />
        <p className="reports-error">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Finance Reports"
        description="Production revenue, collections, outstanding balances, and payment methods."
        actions={
          <Button variant="ghost" size="md" to="/dashboard/reports">
            <FiArrowLeft /> All Reports
          </Button>
        }
      />

      <KPIGrid
        items={[
          { label: "Collected Revenue", value: formatINR(summary?.revenue ?? 0), tone: "success" },
          { label: "Today's Collections", value: formatINR(summary?.todaysCollections ?? 0), tone: "primary" },
          { label: "Monthly Collections", value: formatINR(summary?.monthlyCollections ?? 0), tone: "primary" },
          { label: "Outstanding", value: formatINR(summary?.outstandingBalance ?? 0), tone: "warning" },
          { label: "Pending Approvals", value: String(summary?.pendingPayments ?? 0), tone: "warning" },
          { label: "Commission", value: formatINR(revenueReport?.totals?.commission || 0), tone: "info" },
        ]}
      />

      <div className="erp-dashboard__charts">
        <AnalyticsCard title="Payment Methods" subtitle="Approved payment totals">
          <ChartCard title="">
            <BarChart
              data={paymentMethods.length
                ? paymentMethods.map((row) => ({ label: row.method, value: Math.max(1, Math.round(row.total / 1000)) }))
                : [{ label: "—", value: 0 }]}
            />
          </ChartCard>
        </AnalyticsCard>
        <AnalyticsCard title="Booking Snapshot" subtitle="Live booking counts">
          <ChartCard title="">
            <BarChart
              data={[
                { label: "Total", value: summary?.bookings?.total ?? 0 },
                { label: "Active", value: summary?.bookings?.active ?? 0 },
                { label: "Cancelled", value: summary?.bookings?.cancelled ?? 0 },
                { label: "Expired", value: summary?.bookings?.expired ?? 0 },
              ]}
            />
          </ChartCard>
        </AnalyticsCard>
      </div>

      <div className="reports-table-wrap">
        <AnalyticsCard title="Outstanding Balances" subtitle="Active bookings with remaining dues">
          <DataTable columns={columns} data={outstandingRows} rowKey="id" />
        </AnalyticsCard>
      </div>
    </motion.div>
  );
}

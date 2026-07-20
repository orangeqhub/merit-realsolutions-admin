import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Select from "../../components/ui/select/Select";
import KPIGrid from "../../components/dashboard/KPIGrid";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import DataTable from "../../components/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { listBookings } from "../../services/booking/bookingApi.js";
import { fetchAllPages } from "../../utils/fetchAllPages.js";
import { formatINR, formatDate } from "../../utils/format";
import "./reports.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bookingDateOf(row) {
  const raw = row.paidAt || row.createdAt || row.visitDate;
  return raw ? String(raw).slice(0, 10) : null;
}

function bookingAmountOf(row) {
  return Number(row.totalAmount || row.amount || 0);
}

function propertyLabel(row) {
  return row.entity?.propertyTitle || row.entity?.title || `${row.entityType || "Property"} #${row.entityId || "—"}`;
}

export default function SalesReports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    fetchAllPages(listBookings)
      .then(setBookings)
      .catch((err) => setError(err.message || "Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const set = new Set(bookings.map((b) => bookingDateOf(b)?.slice(0, 4)).filter(Boolean));
    return ["all", ...[...set].sort().reverse()];
  }, [bookings]);

  const filtered = useMemo(() => {
    if (yearFilter === "all") return bookings;
    return bookings.filter((b) => bookingDateOf(b)?.startsWith(yearFilter));
  }, [bookings, yearFilter]);

  const stats = useMemo(() => {
    const active = filtered.filter((b) => ["BOOKED", "RESERVED", "PAYMENT_PENDING"].includes(b.status)).length;
    const completed = filtered.filter((b) => ["REGISTERED", "SOLD"].includes(b.status)).length;
    const cancelled = filtered.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED").length;
    const revenue = filtered
      .filter((b) => !["CANCELLED", "EXPIRED", "PAYMENT_PENDING"].includes(b.status))
      .reduce((s, b) => s + bookingAmountOf(b), 0);
    return { total: filtered.length, active, completed, cancelled, revenue };
  }, [filtered]);

  const monthlySales = useMemo(() => {
    const map = {};
    filtered.forEach((b) => {
      const date = bookingDateOf(b);
      if (!date || ["CANCELLED", "EXPIRED", "PAYMENT_PENDING"].includes(b.status)) return;
      const d = new Date(date);
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      map[label] = (map[label] || 0) + bookingAmountOf(b);
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value: Math.round(value / 100000) }))
      .slice(-12);
  }, [filtered]);

  const statusChart = useMemo(() => {
    const map = {};
    filtered.forEach((b) => {
      map[b.status] = (map[b.status] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const propertyPerformance = useMemo(() => {
    const map = {};
    filtered
      .filter((b) => !["CANCELLED", "EXPIRED", "PAYMENT_PENDING"].includes(b.status))
      .forEach((b) => {
        const label = propertyLabel(b);
        map[label] = (map[label] || 0) + bookingAmountOf(b);
      });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value: Math.round(value / 100000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const tableData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(bookingDateOf(b) || 0) - new Date(bookingDateOf(a) || 0))
        .slice(0, 15),
    [filtered]
  );

  const columns = [
    { key: "bookingNumber", header: "Booking No." },
    { key: "customerName", header: "Customer" },
    {
      key: "property",
      header: "Property",
      render: (r) => propertyLabel(r),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => formatINR(bookingAmountOf(r)),
    },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} size="sm" /> },
    {
      key: "bookingDate",
      header: "Date",
      render: (r) => formatDate(bookingDateOf(r)),
    },
  ];

  if (loading) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Sales Reports" description="Loading booking analytics..." />
        <p>Loading reports...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Sales Reports" description="Booking statistics and revenue performance." />
        <p className="reports-error">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="erp-module-page reports-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Sales Reports"
        description="Booking statistics, monthly sales, revenue and property-wise performance from live property bookings."
        actions={
          <Button variant="ghost" size="md" to="/dashboard/reports">
            <FiArrowLeft /> All Reports
          </Button>
        }
      />

      <div className="erp-toolbar reports-filters">
        <div className="erp-toolbar__filters">
          <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            {years.map((y) => (
              <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="reports-empty">No bookings available for the selected period.</p>
      ) : (
        <>
          <KPIGrid
            items={[
              { label: "Total Bookings", value: stats.total },
              { label: "Active", value: stats.active, tone: "accent" },
              { label: "Completed", value: stats.completed, tone: "success" },
              { label: "Revenue (₹ L)", value: Math.round(stats.revenue / 100000), tone: "primary" },
            ]}
          />

          <div className="erp-dashboard__charts">
            <AnalyticsCard title="Monthly Sales" subtitle="Revenue in Lakhs (₹)">
              <ChartCard title="">
                <BarChart data={monthlySales.length ? monthlySales : [{ label: "—", value: 0 }]} />
              </ChartCard>
            </AnalyticsCard>
            <AnalyticsCard title="Booking Status" subtitle="Distribution by status">
              <ChartCard title="">
                <div className="erp-dashboard__donut">
                  <DonutChart data={statusChart.length ? statusChart : [{ label: "—", value: 1 }]} />
                </div>
              </ChartCard>
            </AnalyticsCard>
          </div>

          <AnalyticsCard title="Sales Performance by Property" subtitle="Revenue in Lakhs (₹)">
            <ChartCard title="">
              <LineChart data={propertyPerformance.length ? propertyPerformance : [{ label: "—", value: 0 }]} />
            </ChartCard>
          </AnalyticsCard>

          <div className="reports-table-wrap">
            <AnalyticsCard title="Recent Bookings" subtitle="Latest booking records">
              <DataTable columns={columns} data={tableData} rowKey="id" />
            </AnalyticsCard>
          </div>
        </>
      )}
    </motion.div>
  );
}

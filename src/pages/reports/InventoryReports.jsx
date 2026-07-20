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
import DataTable from "../../components/table/DataTable";
import { listProperties } from "../../services/property/propertyApi.js";
import { fetchAllPages } from "../../utils/fetchAllPages.js";
import "./reports.css";

export default function InventoryReports() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchAllPages(listProperties)
      .then(setProperties)
      .catch((err) => setError(err.message || "Failed to load inventory."))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(
    () => [...new Set(properties.map((p) => p.propertyType?.name || p.propertyType).filter(Boolean))].sort(),
    [properties]
  );

  const statuses = useMemo(
    () => [...new Set(properties.map((p) => p.status).filter(Boolean))].sort(),
    [properties]
  );

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const typeName = p.propertyType?.name || p.propertyType || "";
      if (typeFilter && typeName !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [properties, typeFilter, statusFilter]);

  const statusStats = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      map[p.status] = (map[p.status] || 0) + 1;
    });
    return map;
  }, [filtered]);

  const statusChart = useMemo(
    () => Object.entries(statusStats).map(([label, value]) => ({ label, value })),
    [statusStats]
  );

  const byType = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      const key = p.propertyType?.name || p.propertyType || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const cityTable = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      const city = p.city || p.location?.city || "Unknown";
      if (!map[city]) {
        map[city] = { city, total: 0, published: 0, draft: 0 };
      }
      map[city].total += 1;
      if (p.status === "PUBLISHED" || p.status === "Published") map[city].published += 1;
      if (p.status === "DRAFT" || p.status === "Draft") map[city].draft += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [filtered]);

  const columns = [
    { key: "city", header: "City" },
    { key: "total", header: "Total", align: "right" },
    { key: "published", header: "Published", align: "right" },
    { key: "draft", header: "Draft", align: "right" },
  ];

  if (loading) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Inventory Reports" description="Loading property inventory..." />
        <p>Loading reports...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="erp-module-page reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title="Inventory Reports" description="Property inventory analytics." />
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
        title="Inventory Reports"
        description="Property inventory status, type distribution, and city-wise breakdown from live listings."
        actions={
          <Button variant="ghost" size="md" to="/dashboard/reports">
            <FiArrowLeft /> All Reports
          </Button>
        }
      />

      <div className="erp-toolbar reports-filters">
        <div className="erp-toolbar__filters">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Property Types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="reports-empty">No properties found in inventory.</p>
      ) : (
        <>
          <KPIGrid
            items={[
              { label: "Total Properties", value: filtered.length },
              { label: "Published", value: statusStats.PUBLISHED || statusStats.Published || 0, tone: "success" },
              { label: "Draft", value: statusStats.DRAFT || statusStats.Draft || 0, tone: "warning" },
              { label: "Types", value: types.length, tone: "primary" },
            ]}
          />

          <div className="erp-dashboard__charts">
            <AnalyticsCard title="Status Distribution">
              <ChartCard title="">
                <div className="erp-dashboard__donut">
                  <DonutChart data={statusChart.length ? statusChart : [{ label: "—", value: 1 }]} />
                </div>
              </ChartCard>
            </AnalyticsCard>
            <AnalyticsCard title="Properties by Type">
              <ChartCard title="">
                <BarChart data={byType.length ? byType : [{ label: "—", value: 0 }]} />
              </ChartCard>
            </AnalyticsCard>
          </div>

          <div className="reports-table-wrap">
            <AnalyticsCard title="City-wise Inventory" subtitle="Breakdown by city">
              <DataTable columns={columns} data={cityTable} rowKey="city" />
            </AnalyticsCard>
          </div>
        </>
      )}
    </motion.div>
  );
}

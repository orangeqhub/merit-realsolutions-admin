import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiList,
  FiHome,
  FiCheckCircle,
  FiBookmark,
  FiTag,
  FiDollarSign,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import KPIGrid from "../../components/dashboard/KPIGrid";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import Badge from "../../components/ui/badge/Badge";
import EmptyState from "../../components/layout/EmptyState";
import { useProperties } from "../../context/PropertiesContext";
import {
  PROPERTY_STATUS_META,
  formatINR,
  formatDate,
} from "./constants";
import "./property.css";

export default function PropertyDashboard() {
  const { properties } = useProperties();

  const stats = useMemo(() => {
    const available = properties.filter((p) => p.status === "Available").length;
    const booked = properties.filter((p) => p.status === "Booked").length;
    const sold = properties.filter((p) => p.status === "Sold").length;
    const reserved = properties.filter((p) => p.status === "Reserved").length;
    const portfolioValue = properties.reduce(
      (sum, p) => sum + (Number(p.finalPrice) || 0),
      0
    );
    return { total: properties.length, available, booked, sold, reserved, portfolioValue };
  }, [properties]);

  const statusDistribution = useMemo(
    () =>
      Object.keys(PROPERTY_STATUS_META).map((status) => ({
        label: status,
        value: properties.filter((p) => p.status === status).length,
        color: PROPERTY_STATUS_META[status].color,
      })),
    [properties]
  );

  const byType = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      const label = p.propertyTypeName || p.propertyCategory || "Other";
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  const byCity = useMemo(() => {
    const map = {};
    properties.forEach((p) => {
      if (!p.city) return;
      map[p.city] = (map[p.city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [properties]);

  const recent = useMemo(
    () =>
      [...properties]
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 6),
    [properties]
  );

  return (
    <motion.div
      className="erp-module-page property-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Property Dashboard"
        description="Real-time overview of standalone property inventory, availability and portfolio value."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/properties/list">
              <FiList /> Browse Properties
            </Button>
            <Button variant="accent" size="md" to="/dashboard/properties/new">
              <FiPlus /> Add Property
            </Button>
          </>
        }
      />

      <KPIGrid
        items={[
          { icon: <FiHome />, label: "Total Properties", value: stats.total, tone: "accent" },
          { icon: <FiCheckCircle />, label: "Available", value: stats.available, tone: "success" },
          { icon: <FiBookmark />, label: "Reserved", value: stats.reserved, tone: "violet" },
          { icon: <FiTag />, label: "Sold", value: stats.sold, tone: "info" },
          { icon: <FiDollarSign />, label: "Portfolio Value", value: stats.portfolioValue, prefix: "₹", tone: "warning" },
        ]}
      />

      <div className="erp-dashboard__charts">
        <AnalyticsCard title="Properties by City" subtitle="Inventory count per city" delay={0.1}>
          <ChartCard title="">
            <BarChart
              data={byCity.length ? byCity : [{ label: "—", value: 0 }]}
            />
          </ChartCard>
        </AnalyticsCard>

        <AnalyticsCard title="Status Distribution" subtitle="Across all properties" delay={0.15}>
          <div className="erp-dashboard__donut">
            <DonutChart
              data={statusDistribution}
              centerValue={stats.total}
              centerLabel="Properties"
            />
          </div>
        </AnalyticsCard>
      </div>

      {byType.length > 0 && (
        <AnalyticsCard title="Property Types" subtitle="Breakdown by type" delay={0.2}>
          <ChartCard title="">
            <BarChart data={byType} color="var(--erp-violet)" />
          </ChartCard>
        </AnalyticsCard>
      )}

      <section className="property-dashboard__recent">
        <h2 className="erp-section-title">Recently Updated</h2>
        {recent.length > 0 ? (
          <div className="property-dashboard__recent-list">
            {recent.map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/properties/${p.id}`}
                className="property-dashboard__recent-item"
              >
                <img src={p.thumbnail} alt="" />
                <div className="property-dashboard__recent-info">
                  <strong>{p.name}</strong>
                  <span>
                    {p.propertyTypeName || p.propertyCategory} · {p.city} · {formatDate(p.lastUpdated)}
                  </span>
                </div>
                <span className="property-dashboard__recent-price">{formatINR(p.finalPrice)}</span>
                <Badge status={p.status} size="sm" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No properties yet"
            description="Add your first property to see recent activity here."
            action={
              <Button variant="accent" size="md" to="/dashboard/properties/new">
                <FiPlus /> Add Property
              </Button>
            }
          />
        )}
      </section>
    </motion.div>
  );
}

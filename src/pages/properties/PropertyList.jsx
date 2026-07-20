import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBarChart2,
  FiGrid,
  FiList,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiHome,
  FiCheckCircle,
  FiBookmark,
  FiTag,
  FiDollarSign,
  FiMapPin,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/input/Input";
import Button from "../../components/ui/button/Button";
import Select from "../../components/ui/select/Select";
import Pills from "../../components/navigation/Pills";
import Badge from "../../components/ui/badge/Badge";
import Dropdown from "../../components/ui/dropdown/Dropdown";
import DataTable from "../../components/table/DataTable";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import KPIGrid from "../../components/dashboard/KPIGrid";
import { useProperties } from "../../context/PropertiesContext";
import { useToast } from "../../components/feedback/Toast";
import {
  PROPERTY_STATUS,
  formatINR,
  formatArea,
  formatDate,
  formatListedByListValue,
} from "./constants";
import "./property.css";

const EMPTY_FILTERS = {
  search: "",
  status: "",
  type: "",
  category: "",
  city: "",
  sort: "updated",
};

function PropertyCard({ property, onView, onEdit, onDelete }) {
  return (
    <article className="property-card">
      <div className="property-card__media">
        <img src={property.thumbnail || property.banner} alt={property.name} loading="lazy" />
        <div className="property-card__badges">
          <Badge status={property.status} size="sm" />
          <span className="property-card__type-label">{property.propertyTypeName || property.propertyCategory}</span>
        </div>
      </div>
      <div className="property-card__body">
        <h3>{property.name}</h3>
        <p className="property-card__meta">
          <FiMapPin /> {property.city}, {property.district}
        </p>
        <p className="property-card__meta">{property.propertyCategory || "—"}</p>
        <p className="property-card__price">{formatINR(property.finalPrice)}</p>
      </div>
      <footer className="property-card__footer">
        <span className="property-table__muted">{property.code}</span>
        <Dropdown
          items={[
            { label: "View", icon: <FiEye />, onClick: () => onView(property) },
            { label: "Edit", icon: <FiEdit2 />, onClick: () => onEdit(property) },
            { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => onDelete(property) },
          ]}
        />
      </footer>
    </article>
  );
}

export default function PropertyList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { properties, removeProperty, publishProperty, unpublishProperty } = useProperties();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState("table");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categoryGroups = useMemo(
    () => [...new Set(properties.map((p) => p.propertyCategory).filter(Boolean))].sort(),
    [properties]
  );

  const categories = useMemo(
    () => [...new Set(properties.map((p) => p.propertyTypeName).filter(Boolean))].sort(),
    [properties]
  );

  const cities = useMemo(
    () => [...new Set(properties.map((p) => p.city).filter(Boolean))].sort(),
    [properties]
  );

  const stats = useMemo(() => {
    const available = properties.filter((p) => p.status === "Available").length;
    const booked = properties.filter((p) => p.status === "Booked").length;
    const sold = properties.filter((p) => p.status === "Sold").length;
    const value = properties.reduce((sum, p) => sum + (Number(p.finalPrice) || 0), 0);
    return { total: properties.length, available, booked, sold, value };
  }, [properties]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let result = properties.filter((p) => {
      const matchSearch =
        !q ||
        [p.name, p.code, p.propertyTypeName, p.propertyCategory, p.city, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchStatus = !filters.status || p.status === filters.status;
      const matchType = !filters.type || p.propertyCategory === filters.type;
      const matchCategory = !filters.category || p.propertyTypeName === filters.category;
      const matchCity = !filters.city || p.city === filters.city;
      return matchSearch && matchStatus && matchType && matchCategory && matchCity;
    });

    result = [...result].sort((a, b) => {
      switch (filters.sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "priceLow":
          return (Number(a.finalPrice) || 0) - (Number(b.finalPrice) || 0);
        case "priceHigh":
          return (Number(b.finalPrice) || 0) - (Number(a.finalPrice) || 0);
        case "oldest":
          return new Date(a.createdDate) - new Date(b.createdDate);
        default:
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
    });
    return result;
  }, [properties, filters]);

  const hasFilters =
    filters.search || filters.status || filters.type || filters.category || filters.city;

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const buildMenu = (row) => [
    { label: "View", icon: <FiEye />, onClick: () => navigate(`/dashboard/properties/${row.id}`) },
    { label: "Edit", icon: <FiEdit2 />, onClick: () => navigate(`/dashboard/properties/${row.id}/edit`) },
    row.isPublished
      ? { label: "Unpublish", icon: <FiRotateCcw />, onClick: () => handleUnpublish(row) }
      : { label: "Publish", icon: <FiCheckCircle />, onClick: () => handlePublish(row) },
    { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => setDeleteTarget(row) },
  ];

  const handlePublish = async (row) => {
    try {
      await publishProperty(row.id);
      toast.success(`${row.name} published to website.`);
    } catch (err) {
      toast.error(err.message || "Failed to publish property.");
    }
  };

  const handleUnpublish = async (row) => {
    try {
      await unpublishProperty(row.id);
      toast.success(`${row.name} removed from website.`);
    } catch (err) {
      toast.error(err.message || "Failed to unpublish property.");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Property",
      sortable: true,
      render: (row) => (
        <div className="property-table__name">
          <img src={row.thumbnail} alt="" />
          <div>
            <strong>{row.name}</strong>
            <span>{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: "propertyTypeName",
      header: "Type",
      render: (row) => <Badge tone="info" label={row.propertyTypeName || "—"} size="sm" />,
    },
    { key: "propertyCategory", header: "Category", render: (row) => <span className="property-table__muted">{row.propertyCategory || "—"}</span> },
    {
      key: "listedBy",
      header: "Listed By",
      render: (row) => (
        <span className="property-table__muted">{formatListedByListValue(row) || "—"}</span>
      ),
    },
    { key: "city", header: "City", sortable: true },
    { key: "area", header: "Area", align: "right", sortable: true, render: (row) => formatArea(row.area) },
    {
      key: "finalPrice",
      header: "Price",
      align: "right",
      sortable: true,
      render: (row) => <strong>{formatINR(row.finalPrice)}</strong>,
    },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} dot size="sm" /> },
    {
      key: "isPublished",
      header: "Website",
      render: (row) => (
        <Badge
          tone={row.isPublished ? "success" : "neutral"}
          label={row.isPublished ? "Published" : "Draft"}
          size="sm"
        />
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.owner?.name || <span className="property-table__dash">—</span>,
    },
    {
      key: "lastUpdated",
      header: "Updated",
      sortable: true,
      render: (row) => <span className="property-table__muted">{formatDate(row.lastUpdated)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown items={buildMenu(row)} />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="erp-module-page property-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Property Inventory"
        description="Manage standalone properties — availability, pricing, specifications and documentation."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/properties">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="accent" size="md" to="/dashboard/properties/new">
              <FiPlus /> Add Property
            </Button>
          </>
        }
      />

      <KPIGrid
        minWidth={200}
        items={[
          { icon: <FiHome />, label: "Total", value: stats.total, tone: "accent" },
          { icon: <FiCheckCircle />, label: "Available", value: stats.available, tone: "success" },
          { icon: <FiBookmark />, label: "Booked", value: stats.booked, tone: "warning" },
          { icon: <FiTag />, label: "Sold", value: stats.sold, tone: "info" },
          { icon: <FiDollarSign />, label: "Portfolio", value: stats.value, prefix: "₹", tone: "violet" },
        ]}
      />

      <motion.div
        className="erp-toolbar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="erp-toolbar__search">
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search property, code, city..."
          />
        </div>

        <div className="erp-toolbar__filters">
          <Select
            value={filters.status}
            onChange={(v) => setFilter("status", v)}
            options={[{ value: "", label: "All Status" }, ...PROPERTY_STATUS.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={filters.type}
            onChange={(v) => setFilter("type", v)}
            options={[{ value: "", label: "All Categories" }, ...categoryGroups.map((t) => ({ value: t, label: t }))]}
            placeholder="Category"
          />
          <Select
            value={filters.category}
            onChange={(v) => setFilter("category", v)}
            options={[{ value: "", label: "All Types" }, ...categories.map((v) => ({ value: v, label: v }))]}
            placeholder="Property Type"
            searchable
          />
          <Select
            value={filters.city}
            onChange={(v) => setFilter("city", v)}
            options={[{ value: "", label: "All Cities" }, ...cities.map((c) => ({ value: c, label: c }))]}
            placeholder="City"
            searchable
          />
          <Select
            value={filters.sort}
            onChange={(v) => setFilter("sort", v)}
            options={[
              { value: "updated", label: "Sort: Updated" },
              { value: "oldest", label: "Sort: Oldest" },
              { value: "name", label: "Sort: Name" },
              { value: "priceHigh", label: "Sort: Price ↓" },
              { value: "priceLow", label: "Sort: Price ↑" },
            ]}
            placeholder="Sort"
          />
          <button
            type="button"
            className="erp-toolbar__reset"
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            <FiRotateCcw /> Reset
          </button>
        </div>
      </motion.div>

      <div className="property-list__viewbar">
        <Pills
          items={[
            { id: "table", label: "Table", icon: <FiList /> },
            { id: "grid", label: "Grid", icon: <FiGrid /> },
          ]}
          active={view}
          onChange={setView}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="No properties found"
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first property to get started."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" to="/dashboard/properties/new">
                <FiPlus /> Add Property
              </Button>
            )
          }
        />
      ) : view === "table" ? (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          defaultPageSize={25}
          pageSizeOptions={[25, 50, 100]}
          onRowClick={(row) => navigate(`/dashboard/properties/${row.id}`)}
        />
      ) : (
        <div className="erp-card-grid">
          {filtered.slice(0, 60).map((property, i) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
            >
              <PropertyCard
                property={property}
                onView={(p) => navigate(`/dashboard/properties/${p.id}`)}
                onEdit={(p) => navigate(`/dashboard/properties/${p.id}/edit`)}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await removeProperty(deleteTarget.id);
            toast.success(`${deleteTarget.name} removed`);
            setDeleteTarget(null);
          } catch (err) {
            toast.error(err.message || "Failed to delete property.");
          }
        }}
        title="Delete Property?"
        message="This action cannot be undone. The property will be permanently removed from inventory."
        highlight={deleteTarget?.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

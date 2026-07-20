import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBarChart2,
  FiRotateCcw,
  FiGrid,
  FiList,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/input/Input";
import Button from "../../components/ui/button/Button";
import Pills from "../../components/navigation/Pills";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import VentureStats from "../../components/venture/VentureStats";
import VentureCard from "../../components/venture/VentureCard";
import Select from "../../components/ui/select/Select";
import { useVentures } from "../../context/VenturesContext";
import { useToast } from "../../components/feedback/Toast";
import { PROPERTY_TYPES, VENTURE_STATUS, APPROVAL_TYPES } from "./constants";
import "./venture.css";

export default function VentureList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { ventures, removeVenture } = useVentures();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState("list");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const districts = useMemo(
    () => [...new Set(ventures.map((v) => v.district).filter(Boolean))].sort(),
    [ventures]
  );
  const cities = useMemo(
    () => [...new Set(ventures.map((v) => v.city).filter(Boolean))].sort(),
    [ventures]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = ventures.filter((v) => {
      const matchSearch =
        !q ||
        [v.name, v.developer, v.city, v.district, v.code, v.id]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchType = !typeFilter || v.propertyType === typeFilter;
      const matchDistrict = !districtFilter || v.district === districtFilter;
      const matchCity = !cityFilter || v.city === cityFilter;
      const matchApproval = !approvalFilter || v.approval === approvalFilter;
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchType && matchDistrict && matchCity && matchApproval && matchStatus;
    });

    result = [...result].sort((a, b) => {
      if (sort === "revenue") return (b.revenue || 0) - (a.revenue || 0);
      if (sort === "progress") return (b.progress || 0) - (a.progress || 0);
      if (sort === "plots") return (b.plots?.total || 0) - (a.plots?.total || 0);
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [ventures, search, typeFilter, districtFilter, cityFilter, approvalFilter, statusFilter, sort]);

  const hasFilters =
    search || typeFilter || districtFilter || cityFilter || approvalFilter || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setDistrictFilter("");
    setCityFilter("");
    setApprovalFilter("");
    setStatusFilter("");
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeVenture(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    }
  };

  return (
    <motion.div
      className="venture-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Ventures"
        description="Manage all real estate projects — open plots, farm lands, villas, apartments and commercial ventures."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/ventures">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="accent" size="md" to="/dashboard/ventures/new">
              <FiPlus /> Add Venture
            </Button>
          </>
        }
      />

      <VentureStats ventures={ventures} compact />

      <motion.div
        className="venture-toolbar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="venture-toolbar__search">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venture, developer, location..."
          />
        </div>

        <div className="venture-toolbar__filters">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "", label: "All Types" }, ...PROPERTY_TYPES.map((t) => ({ value: t, label: t }))]}
            placeholder="Property Type"
          />
          <Select
            value={districtFilter}
            onChange={setDistrictFilter}
            options={[{ value: "", label: "All Districts" }, ...districts.map((d) => ({ value: d, label: d }))]}
            placeholder="District"
            searchable
          />
          <Select
            value={cityFilter}
            onChange={setCityFilter}
            options={[{ value: "", label: "All Cities" }, ...cities.map((c) => ({ value: c, label: c }))]}
            placeholder="City"
            searchable
          />
          <Select
            value={approvalFilter}
            onChange={setApprovalFilter}
            options={[{ value: "", label: "All Approvals" }, ...APPROVAL_TYPES.map((a) => ({ value: a, label: a }))]}
            placeholder="Approval"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "", label: "All Status" }, ...VENTURE_STATUS.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: "name", label: "Sort: Name" },
              { value: "revenue", label: "Sort: Revenue" },
              { value: "progress", label: "Sort: Progress" },
              { value: "plots", label: "Sort: Plots" },
            ]}
            placeholder="Sort"
          />
          <button
            type="button"
            className="venture-toolbar__reset"
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            <FiRotateCcw /> Reset
          </button>
        </div>

        <Pills
          items={[
            { id: "list", label: "List", icon: <FiList /> },
            { id: "grid", label: "Grid", icon: <FiGrid /> },
          ]}
          active={view}
          onChange={setView}
        />
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="No ventures found"
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Get started by adding your first venture."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" to="/dashboard/ventures/new">
                <FiPlus /> Add Venture
              </Button>
            )
          }
        />
      ) : (
        <div className={`venture-list venture-list--${view}`}>
          {filtered.map((venture, i) => (
            <motion.div
              key={venture.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <VentureCard
                venture={venture}
                onEdit={(v) => navigate(`/dashboard/ventures/${v.id}/edit`)}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Venture?"
        message="This action cannot be undone. All venture data will be permanently removed."
        highlight={deleteTarget?.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

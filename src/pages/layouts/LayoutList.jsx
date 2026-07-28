import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBarChart2,
  FiRotateCcw,
  FiGrid,
  FiList,
  FiEye,
  FiEdit2,
  FiMap,
  FiTrash2,
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
import LayoutStatistics from "../../components/layouts/LayoutStatistics";
import LayoutCard from "../../components/layouts/LayoutCard";
import { useLayouts } from "../../context/LayoutsContext";
import { useToast } from "../../components/feedback/Toast";
import { LAYOUT_STATUS, APPROVAL_TYPES, formatArea } from "./constants";
import "./layout.css";

export default function LayoutList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { layouts, removeLayout } = useLayouts();

  const [search, setSearch] = useState("");
  const [ventureFilter, setVentureFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState("grid");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // `layouts` from context are Venture-merged read models (resolveLayoutView).
  const ventures = useMemo(
    () => [...new Set(layouts.map((l) => l.ventureName).filter(Boolean))].sort(),
    [layouts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = layouts.filter((l) => {
      const matchSearch =
        !q ||
        [l.name, l.code, l.ventureName, l.city, l.district, l.id]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchVenture = !ventureFilter || l.ventureName === ventureFilter;
      const matchApproval = !approvalFilter || l.approval === approvalFilter;
      const matchStatus = !statusFilter || l.status === statusFilter;
      return matchSearch && matchVenture && matchApproval && matchStatus;
    });

    result = [...result].sort((a, b) => {
      if (sort === "revenue") return (b.revenue || 0) - (a.revenue || 0);
      if (sort === "area") return (b.totalArea || 0) - (a.totalArea || 0);
      if (sort === "plots") return (b.plots?.total || 0) - (a.plots?.total || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });
    return result;
  }, [layouts, search, ventureFilter, approvalFilter, statusFilter, sort]);

  const hasFilters = search || ventureFilter || approvalFilter || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setVentureFilter("");
    setApprovalFilter("");
    setStatusFilter("");
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeLayout(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Layout",
      sortable: true,
      render: (row) => (
        <div className="layout-table__name">
          <img src={row.thumbnail} alt="" />
          <div>
            <strong>{row.name}</strong>
            <span>{row.code}</span>
          </div>
        </div>
      ),
    },
    { key: "ventureName", header: "Venture", sortable: true },
    { key: "approval", header: "Approval", render: (row) => <Badge tone="info" label={row.approval} size="sm" /> },
    {
      key: "totalArea",
      header: "Area",
      align: "right",
      sortable: true,
      render: (row) => formatArea(row.totalArea),
    },
    {
      key: "plots",
      header: "Plots",
      align: "right",
      sortable: true,
      sortAccessor: (row) => row.plots?.total || 0,
      render: (row) => row.plots?.total || 0,
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (row) => <span className="layout-table__avail">{row.plots?.available || 0}</span>,
    },
    {
      key: "sold",
      header: "Sold",
      align: "right",
      render: (row) => <span className="layout-table__sold">{row.plots?.sold || 0}</span>,
    },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} dot size="sm" /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            items={[
              { label: "Open Workspace", icon: <FiMap />, onClick: () => navigate(`/dashboard/layouts/${row.id}/workspace`) },
              { label: "View", icon: <FiEye />, onClick: () => navigate(`/dashboard/layouts/${row.id}`) },
              { label: "Edit", icon: <FiEdit2 />, onClick: () => navigate(`/dashboard/layouts/${row.id}/edit`) },
              { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="layout-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Layouts"
        description="Manage all layouts across your ventures — the bridge between ventures and plot inventory."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/layouts">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="accent" size="md" to="/dashboard/layouts/new">
              <FiPlus /> Add Layout
            </Button>
          </>
        }
      />

      <LayoutStatistics layouts={layouts} compact />

      <motion.div
        className="layout-toolbar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="layout-toolbar__search">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layout, venture, location..."
          />
        </div>

        <div className="layout-toolbar__filters">
          <Select
            value={ventureFilter}
            onChange={setVentureFilter}
            options={[{ value: "", label: "All Ventures" }, ...ventures.map((v) => ({ value: v, label: v }))]}
            placeholder="Venture"
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
            options={[{ value: "", label: "All Status" }, ...LAYOUT_STATUS.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: "updated", label: "Sort: Updated" },
              { value: "name", label: "Sort: Name" },
              { value: "revenue", label: "Sort: Revenue" },
              { value: "area", label: "Sort: Area" },
              { value: "plots", label: "Sort: Plots" },
            ]}
            placeholder="Sort"
          />
          <button
            type="button"
            className="layout-toolbar__reset"
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            <FiRotateCcw /> Reset
          </button>
        </div>

        <Pills
          items={[
            { id: "grid", label: "Grid", icon: <FiGrid /> },
            { id: "table", label: "Table", icon: <FiList /> },
          ]}
          active={view}
          onChange={setView}
        />
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="No layouts found"
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Get started by adding your first layout."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" to="/dashboard/layouts/new">
                <FiPlus /> Add Layout
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="layout-grid">
          {filtered.map((layout, i) => (
            <motion.div
              key={layout.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
            >
              <LayoutCard
                layout={layout}
                onEdit={(l) => navigate(`/dashboard/layouts/${l.id}/edit`)}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          onRowClick={(row) => navigate(`/dashboard/layouts/${row.id}`)}
        />
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Layout?"
        message="This action cannot be undone. All layout data will be permanently removed."
        highlight={deleteTarget?.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

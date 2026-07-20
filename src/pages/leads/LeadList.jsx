import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiTarget,
  FiEye,
  FiRotateCcw,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Select from "../../components/ui/select/Select";
import DataTable from "../../components/table/DataTable";
import EmptyState from "../../components/layout/EmptyState";
import Badge from "../../components/ui/badge/Badge";
import KPIGrid from "../../components/dashboard/KPIGrid";
import { useLeads } from "../../context/LeadsContext";
import {
  LEAD_STATUSES,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  PRIORITY_META,
  formatINR,
  formatDate,
} from "./constants";
import "./leads.css";

const EMPTY_FILTERS = { search: "", status: "", priority: "", source: "", executive: "" };

export default function LeadList() {
  const navigate = useNavigate();
  const { leads } = useLeads();

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const executives = useMemo(
    () => [...new Set(leads.map((l) => l.assignedExecutive).filter(Boolean))].sort(),
    [leads]
  );

  const stats = useMemo(
    () => ({
      total: leads.length,
      open: leads.filter((l) => !["Won", "Lost"].includes(l.status)).length,
      high: leads.filter((l) => l.priority === "High").length,
    }),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return [...leads]
      .filter((l) => {
        const matchSearch =
          !q ||
          [l.id, l.name, l.email, l.phone, l.interestedProperty, l.ventureName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchStatus = !filters.status || l.status === filters.status;
        const matchPriority = !filters.priority || l.priority === filters.priority;
        const matchSource = !filters.source || l.source === filters.source;
        const matchExec = !filters.executive || l.assignedExecutive === filters.executive;
        return matchSearch && matchStatus && matchPriority && matchSource && matchExec;
      })
      .sort((a, b) => new Date(b.lastUpdated || b.createdDate) - new Date(a.lastUpdated || a.createdDate));
  }, [leads, filters]);

  const hasFilters =
    filters.search || filters.status || filters.priority || filters.source || filters.executive;

  const columns = [
    {
      key: "name",
      header: "Lead",
      sortable: true,
      render: (row) => <span className="leads-table__name">{row.name}</span>,
    },
    { key: "phone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <Badge tone={PRIORITY_META[row.priority]?.tone}>{row.priority}</Badge>,
    },
    { key: "source", header: "Source" },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      sortable: true,
      render: (row) => <strong>{formatINR(row.budget)}</strong>,
    },
    {
      key: "interestedProperty",
      header: "Property",
      render: (row) => <span className="leads-table__muted">{row.interestedProperty}</span>,
    },
    { key: "assignedExecutive", header: "Executive", render: (row) => row.assignedExecutive || <span className="leads-table__dash">—</span> },
    {
      key: "expectedCloseDate",
      header: "Expected Close",
      render: (row) => <span className="leads-table__muted">{formatDate(row.expectedCloseDate)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/leads/${row.id}`); }}>
          <FiEye /> View
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      className="erp-module-page leads-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Leads"
        description="Browse and filter all sales leads — status, priority, source and assigned executive."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/leads">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="ghost" size="md" to="/dashboard/leads/pipeline">
              <FiTarget /> Pipeline
            </Button>
          </>
        }
      />

      <KPIGrid
        minWidth={200}
        items={[
          { label: "Total", value: stats.total, tone: "accent" },
          { label: "Open", value: stats.open, tone: "info" },
          { label: "High Priority", value: stats.high, tone: "danger" },
        ]}
      />

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            placeholder="Search leads..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[{ value: "", label: "All Status" }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={filters.priority}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
            options={[{ value: "", label: "All Priority" }, ...LEAD_PRIORITIES.map((p) => ({ value: p, label: p }))]}
            placeholder="Priority"
          />
          <Select
            value={filters.source}
            onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
            options={[{ value: "", label: "All Sources" }, ...LEAD_SOURCES.map((s) => ({ value: s, label: s }))]}
            placeholder="Source"
          />
          <Select
            value={filters.executive}
            onChange={(v) => setFilters((f) => ({ ...f, executive: v }))}
            options={[{ value: "", label: "All Executives" }, ...executives.map((e) => ({ value: e, label: e }))]}
            placeholder="Executive"
          />
        </div>
        <button
          type="button"
          className="erp-toolbar__reset"
          onClick={() => setFilters(EMPTY_FILTERS)}
          disabled={!hasFilters}
        >
          <FiRotateCcw /> Reset
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="No leads found"
          description={hasFilters ? "Try adjusting your filters." : "Leads will appear here as they are captured."}
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={() => setFilters(EMPTY_FILTERS)}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          defaultPageSize={25}
          onRowClick={(row) => navigate(`/dashboard/leads/${row.id}`)}
        />
      )}
    </motion.div>
  );
}

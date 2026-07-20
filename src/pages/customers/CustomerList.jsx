import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBarChart2,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Select from "../../components/ui/select/Select";
import DataTable from "../../components/table/DataTable";
import EmptyState from "../../components/layout/EmptyState";
import Dropdown from "../../components/ui/dropdown/Dropdown";
import Badge from "../../components/ui/badge/Badge";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import KPIGrid from "../../components/dashboard/KPIGrid";
import { useCustomers } from "../../context/CustomersContext";
import { useToast } from "../../components/feedback/Toast";
import {
  CUSTOMER_STATUSES,
  KYC_STATUSES,
  CUSTOMER_SOURCES,
  formatINR,
  formatDate,
} from "./constants";
import "./customer.css";

const EMPTY_FILTERS = { search: "", status: "", kycStatus: "", source: "", agent: "" };

export default function CustomerList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { customers, removeCustomer } = useCustomers();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const agents = useMemo(
    () => [...new Set(customers.map((c) => c.assignedAgent).filter(Boolean))].sort(),
    [customers]
  );

  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((c) => c.status === "Active").length,
      verified: customers.filter((c) => c.kycStatus === "Verified").length,
    }),
    [customers]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return [...customers]
      .filter((c) => {
        const matchSearch =
          !q ||
          [c.id, c.name, c.email, c.phone, c.city, c.pan, c.aadhar]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchStatus = !filters.status || c.status === filters.status;
        const matchKyc = !filters.kycStatus || c.kycStatus === filters.kycStatus;
        const matchSource = !filters.source || c.source === filters.source;
        const matchAgent = !filters.agent || c.assignedAgent === filters.agent;
        return matchSearch && matchStatus && matchKyc && matchSource && matchAgent;
      })
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }, [customers, filters]);

  const hasFilters =
    filters.search || filters.status || filters.kycStatus || filters.source || filters.agent;

  const buildMenu = (row) => [
    { label: "View", icon: <FiEye />, onClick: () => navigate(`/dashboard/customers/${row.id}`) },
    { label: "Edit", icon: <FiEdit2 />, onClick: () => navigate(`/dashboard/customers/${row.id}/edit`) },
    { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => setDeleteTarget(row) },
  ];

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (row) => <span className="customers-table__muted">{row.id}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => <span className="customers-table__name">{row.name}</span>,
    },
    { key: "email", header: "Email", render: (row) => <span className="customers-table__muted">{row.email}</span> },
    { key: "phone", header: "Phone" },
    { key: "city", header: "City" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      key: "kycStatus",
      header: "KYC",
      render: (row) => <Badge status={row.kycStatus} size="sm" />,
    },
    { key: "source", header: "Source", render: (row) => row.source || <span className="customers-table__dash">—</span> },
    { key: "assignedAgent", header: "Agent", render: (row) => row.assignedAgent || <span className="customers-table__dash">—</span> },
    {
      key: "totalPaid",
      header: "Paid",
      align: "right",
      render: (row) => formatINR(row.totalPaid),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      render: (row) => <strong>{formatINR(row.outstanding)}</strong>,
    },
    {
      key: "createdDate",
      header: "Joined",
      sortable: true,
      render: (row) => <span className="customers-table__muted">{formatDate(row.createdDate)}</span>,
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
      className="erp-module-page customers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Customer Directory"
        description="Search and manage all customers — profiles, KYC, bookings and payment history."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/customers">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="accent" size="md" to="/dashboard/customers/new">
              <FiPlus /> Add Customer
            </Button>
          </>
        }
      />

      <KPIGrid
        minWidth={200}
        items={[
          { label: "Total", value: stats.total, tone: "accent" },
          { label: "Active", value: stats.active, tone: "info" },
          { label: "KYC Verified", value: stats.verified, tone: "success" },
        ]}
      />

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            placeholder="Search customers..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[{ value: "", label: "All Status" }, ...CUSTOMER_STATUSES.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={filters.kycStatus}
            onChange={(v) => setFilters((f) => ({ ...f, kycStatus: v }))}
            options={[{ value: "", label: "All KYC" }, ...KYC_STATUSES.map((s) => ({ value: s, label: s }))]}
            placeholder="KYC"
          />
          <Select
            value={filters.source}
            onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
            options={[{ value: "", label: "All Sources" }, ...CUSTOMER_SOURCES.map((s) => ({ value: s, label: s }))]}
            placeholder="Source"
          />
          <Select
            value={filters.agent}
            onChange={(v) => setFilters((f) => ({ ...f, agent: v }))}
            options={[{ value: "", label: "All Agents" }, ...agents.map((a) => ({ value: a, label: a }))]}
            placeholder="Agent"
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
          title="No customers found"
          description={hasFilters ? "Try adjusting your filters." : "Add your first customer to get started."}
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={() => setFilters(EMPTY_FILTERS)}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" to="/dashboard/customers/new">
                <FiPlus /> Add Customer
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          defaultPageSize={25}
          onRowClick={(row) => navigate(`/dashboard/customers/${row.id}`)}
        />
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          removeCustomer(deleteTarget.id);
          toast.success(`${deleteTarget.name} removed`);
          setDeleteTarget(null);
        }}
        title="Delete Customer?"
        message="This action cannot be undone."
        highlight={deleteTarget?.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

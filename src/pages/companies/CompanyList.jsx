import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiDownload,
  FiFileText,
  FiGrid,
  FiCheckCircle,
  FiSlash,
  FiLayers,
  FiSearch,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/input/Input";
import StatsCard from "../../components/cards/StatsCard";
import Badge from "../../components/ui/badge/Badge";
import EmptyState from "../../components/layout/EmptyState";
import Dropdown from "../../components/ui/dropdown/Dropdown";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import DataTable from "../../components/table/DataTable";
import RightDrawer from "../../components/drawer/RightDrawer";
import Button from "../../components/ui/button/Button";
import { useCompanies } from "../../context/CompaniesContext";
import { useCollection } from "../../shared/hooks/useDataStore.js";
import { COMPANY_TYPES, STATUS_OPTIONS } from "./constants";
import CompanyForm from "./CompanyForm";
import "./company.css";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CompanyList() {
  const navigate = useNavigate();
  const { companies, addCompany, updateCompany, removeCompany } = useCompanies();
  const ventures = useCollection("ventures");

  const ventureCountByCompany = useMemo(() => {
    const map = {};
    ventures.forEach((v) => {
      if (v.developerId) map[v.developerId] = (map[v.developerId] || 0) + 1;
    });
    return map;
  }, [ventures]);

  const companiesWithStats = useMemo(
    () =>
      companies.map((c) => ({
        ...c,
        ventures: ventureCountByCompany[c.id] || 0,
      })),
    [companies, ventureCountByCompany]
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const stats = useMemo(() => {
    const active = companiesWithStats.filter((c) => c.status === "Active").length;
    return {
      total: companiesWithStats.length,
      active,
      inactive: companiesWithStats.length - active,
      ventures: companiesWithStats.reduce((sum, c) => sum + c.ventures, 0),
    };
  }, [companiesWithStats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companiesWithStats.filter((c) => {
      const matchesSearch =
        !q ||
        [c.name, c.contactPerson, c.email, c.city, c.id]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesType = !typeFilter || c.type === typeFilter;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [companiesWithStats, search, typeFilter, statusFilter]);

  const hasFilters = search || typeFilter || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
  };

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (company) => {
    setEditing(company);
    setDrawerOpen(true);
  };

  const handleSubmit = (values) => {
    if (editing) updateCompany(editing.id, values);
    else addCompany(values);
    setDrawerOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) removeCompany(deleteTarget.id);
    setDeleteTarget(null);
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Type",
      "Contact Person",
      "Phone",
      "Email",
      "State",
      "Ventures",
      "Status",
      "Created",
    ];
    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.type,
      c.contactPerson,
      c.mobile,
      c.email,
      c.state,
      c.ventures,
      c.status,
      c.createdDate,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "companies.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "logo",
      header: "Logo",
      className: "company-col-logo",
      render: (row) => (
        <img className="company-cell__logo" src={row.logo} alt={row.name} loading="lazy" />
      ),
    },
    {
      key: "name",
      header: "Company Name",
      render: (row) => (
        <div className="company-cell__name">
          <span className="company-cell__title">{row.name}</span>
          <span className="company-cell__sub">{row.id}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="company-cell__type">{row.type}</span>,
    },
    {
      key: "contactPerson",
      header: "Contact Person",
      render: (row) => (
        <div className="company-cell__name">
          <span className="company-cell__title">{row.contactPerson}</span>
          <span className="company-cell__sub">{row.designation}</span>
        </div>
      ),
    },
    { key: "mobile", header: "Phone" },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="company-cell__muted">{row.email}</span>,
    },
    { key: "state", header: "State" },
    {
      key: "ventures",
      header: "Ventures",
      align: "center",
      render: (row) => <span className="company-cell__count">{row.ventures}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge status={row.status} dot />,
    },
    {
      key: "createdDate",
      header: "Created Date",
      render: (row) => (
        <span className="company-cell__muted">{formatDate(row.createdDate)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "company-col-actions",
      render: (row) => (
        <span
          className="company-cell__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            items={[
              {
                label: "View",
                icon: <FiEye />,
                onClick: () => navigate(`/dashboard/companies/${row.id}`),
              },
              {
                label: "Edit",
                icon: <FiEdit2 />,
                onClick: () => openEdit(row),
              },
              {
                label: "Delete",
                icon: <FiTrash2 />,
                tone: "danger",
                onClick: () => setDeleteTarget(row),
              },
            ]}
          />
        </span>
      ),
    },
  ];

  return (
    <motion.div
      className="company-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Companies"
        description="Manage all builder companies, construction partners, developers and organizations."
        actions={
          <Button variant="accent" size="md" onClick={openAdd}>
            <FiPlus />
            Add Company
          </Button>
        }
      />

      <div className="company-stats">
        <StatsCard
          icon={<FiGrid />}
          label="Total Companies"
          value={stats.total}
          tone="accent"
          delay={0}
        />
        <StatsCard
          icon={<FiCheckCircle />}
          label="Active Companies"
          value={stats.active}
          tone="success"
          delay={0.08}
        />
        <StatsCard
          icon={<FiSlash />}
          label="Inactive Companies"
          value={stats.inactive}
          tone="danger"
          delay={0.16}
        />
        <StatsCard
          icon={<FiLayers />}
          label="Total Ventures"
          value={stats.ventures}
          tone="primary"
          delay={0.24}
        />
      </div>

      <motion.div
        className="company-toolbar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="company-toolbar__search">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, email..."
            icon={<FiSearch />}
          />
        </div>

        <div className="company-toolbar__filters">
          <select
            className="company-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by company type"
          >
            <option value="">All Types</option>
            {COMPANY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            className="company-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="company-icon-btn"
            onClick={resetFilters}
            disabled={!hasFilters}
            title="Reset filters"
          >
            <FiRotateCcw />
            <span>Reset</span>
          </button>

          <button type="button" className="company-icon-btn" onClick={exportCSV} title="Export Excel">
            <FiDownload />
            <span>Excel</span>
          </button>

          <button
            type="button"
            className="company-icon-btn"
            onClick={() => window.print()}
            title="Export PDF"
          >
            <FiFileText />
            <span>PDF</span>
          </button>
        </div>
      </motion.div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey="id"
        onRowClick={(row) => navigate(`/dashboard/companies/${row.id}`)}
        emptyState={
          <EmptyState
            title="No companies found"
            description={
              hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by adding your first company to the ERP."
            }
            action={
              hasFilters ? (
                <Button variant="ghost" size="md" onClick={resetFilters}>
                  <FiRotateCcw />
                  Reset Filters
                </Button>
              ) : (
                <Button variant="accent" size="md" onClick={openAdd}>
                  <FiPlus />
                  Add Company
                </Button>
              )
            }
          />
        }
      />

      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Company" : "Add Company"}
        subtitle={
          editing
            ? "Update the company details below."
            : "Fill in the details to onboard a new company."
        }
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" type="submit" form="company-form">
              {editing ? "Save Changes" : "Save Company"}
            </Button>
          </>
        }
      >
        <CompanyForm
          key={editing ? editing.id : "new"}
          initialValues={editing}
          onSubmit={handleSubmit}
        />
      </RightDrawer>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Company?"
        message="This action cannot be undone."
        highlight={deleteTarget?.name}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
      />
    </motion.div>
  );
}

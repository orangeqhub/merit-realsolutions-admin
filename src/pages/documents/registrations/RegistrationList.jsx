import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiDownload,
  FiRotateCcw,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import StatsCard from "../../../components/cards/StatsCard";
import DataTable from "../../../components/table/DataTable";
import EmptyState from "../../../components/layout/EmptyState";
import Dropdown from "../../../components/ui/dropdown/Dropdown";
import { useRegistrations } from "../../../context/RegistrationsContext";
import {
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_META,
  formatDate,
} from "./constants";
import "../../../styles/module.css";
import "./registrations.css";

export default function RegistrationList() {
  const navigate = useNavigate();
  const { registrations } = useRegistrations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const stats = useMemo(() => ({
    total: registrations.length,
    completed: registrations.filter((r) => r.status === "Completed").length,
    inProgress: registrations.filter((r) => r.status === "In Progress").length,
    pending: registrations.filter((r) => r.status === "Pending").length,
  }), [registrations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((r) => {
      const matchSearch =
        !q ||
        [
          r.registrationNumber,
          r.customerName,
          r.propertyName,
          r.plotNumber,
          r.bookingId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [registrations, search, statusFilter]);

  const hasFilters = search || statusFilter;

  const columns = [
    {
      key: "registrationNumber",
      header: "Registration No.",
      sortable: true,
      render: (row) => (
        <div>
          <span className="registrations-cell__title">{row.registrationNumber}</span>
          <span className="registrations-cell__sub">{row.id}</span>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      render: (row) => <span className="registrations-cell__title">{row.customerName}</span>,
    },
    {
      key: "propertyName",
      header: "Property",
      sortable: true,
      render: (row) => (
        <div>
          <span className="registrations-cell__title">{row.propertyName}</span>
          <span className="registrations-cell__sub">{row.bookingId}</span>
        </div>
      ),
    },
    { key: "plotNumber", header: "Plot", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge
          tone={REGISTRATION_STATUS_META[row.status]?.tone}
          label={REGISTRATION_STATUS_META[row.status]?.label || row.status}
          dot
        />
      ),
    },
    {
      key: "submittedDate",
      header: "Submitted",
      sortable: true,
      render: (row) => (
        <span className="registrations-cell__muted">{formatDate(row.submittedDate)}</span>
      ),
    },
    {
      key: "completedDate",
      header: "Completed",
      sortable: true,
      render: (row) => (
        <span className="registrations-cell__muted">{formatDate(row.completedDate)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "registrations-col-actions",
      render: (row) => (
        <span
          className="registrations-cell__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => navigate(`/dashboard/documents/registrations/${row.id}`)}
            aria-label="View registration"
          >
            <FiEye />
          </Button>
          <Dropdown
            items={[
              {
                label: "View Details",
                icon: <FiEye />,
                onClick: () => navigate(`/dashboard/documents/registrations/${row.id}`),
              },
              { label: "Download", icon: <FiDownload />, onClick: () => {} },
            ]}
          />
        </span>
      ),
    },
  ];

  return (
    <motion.div
      className="erp-module-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Plot Registrations"
        description="Track registration applications, document submissions and completion status."
      />

      <div className="registrations-stats">
        <StatsCard icon={<FiShield />} label="Total" value={stats.total} tone="accent" />
        <StatsCard icon={<FiCheckCircle />} label="Completed" value={stats.completed} tone="success" />
        <StatsCard icon={<FiClock />} label="In Progress" value={stats.inProgress} tone="info" />
        <StatsCard icon={<FiAlertCircle />} label="Pending" value={stats.pending} tone="warning" />
      </div>

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            placeholder="Search registrations, customers, plots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<FiShield />}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "All Statuses" },
              ...REGISTRATION_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            placeholder="Status"
          />
        </div>
        <button
          type="button"
          className="erp-toolbar__reset"
          onClick={() => {
            setSearch("");
            setStatusFilter("");
          }}
          disabled={!hasFilters}
        >
          <FiRotateCcw /> Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey="id"
        onRowClick={(row) => navigate(`/dashboard/documents/registrations/${row.id}`)}
        emptyState={
          <EmptyState
            title="No registrations found"
            description={
              hasFilters
                ? "Try adjusting your search or filters."
                : "Registration records appear when agreements are submitted."
            }
            action={
              hasFilters ? (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              ) : null
            }
          />
        }
      />
    </motion.div>
  );
}

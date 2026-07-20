import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEye,
  FiDownload,
  FiRotateCcw,
  FiFileText,
  FiCheckCircle,
  FiEdit3,
  FiSlash,
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
import { useAgreements } from "../../../context/AgreementsContext";
import { AGREEMENT_STATUSES, AGREEMENT_STATUS_META, formatDate } from "./constants";
import "../../../styles/module.css";
import "./agreements.css";

export default function AgreementList() {
  const navigate = useNavigate();
  const { agreements } = useAgreements();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const stats = useMemo(() => {
    const registered = agreements.filter((a) => a.status === "Registered").length;
    const signed = agreements.filter((a) => a.status === "Signed").length;
    const draft = agreements.filter((a) => a.status === "Draft").length;
    return { total: agreements.length, registered, signed, draft };
  }, [agreements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agreements.filter((a) => {
      const matchSearch =
        !q ||
        [
          a.agreementNumber,
          a.customerName,
          a.propertyName,
          a.plotNumber,
          a.bookingId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchStatus = !statusFilter || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [agreements, search, statusFilter]);

  const hasFilters = search || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const columns = [
    {
      key: "agreementNumber",
      header: "Agreement No.",
      sortable: true,
      render: (row) => (
        <div>
          <span className="agreements-cell__title">{row.agreementNumber}</span>
          <span className="agreements-cell__sub">{row.id}</span>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      render: (row) => (
        <span className="agreements-cell__title">{row.customerName}</span>
      ),
    },
    {
      key: "propertyName",
      header: "Property",
      sortable: true,
      render: (row) => (
        <div>
          <span className="agreements-cell__title">{row.propertyName}</span>
          <span className="agreements-cell__sub">{row.bookingId}</span>
        </div>
      ),
    },
    {
      key: "plotNumber",
      header: "Plot",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge
          tone={AGREEMENT_STATUS_META[row.status]?.tone}
          label={AGREEMENT_STATUS_META[row.status]?.label || row.status}
          dot
        />
      ),
    },
    {
      key: "version",
      header: "Version",
      align: "center",
      sortable: true,
      render: (row) => <span>v{row.version}</span>,
    },
    {
      key: "signedDate",
      header: "Signed Date",
      sortable: true,
      render: (row) => (
        <span className="agreements-cell__muted">{formatDate(row.signedDate)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "agreements-col-actions",
      render: (row) => (
        <span
          className="agreements-cell__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => navigate(`/dashboard/documents/agreements/${row.id}`)}
            aria-label="View agreement"
          >
            <FiEye />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => {}}
            aria-label="Download agreement"
          >
            <FiDownload />
          </Button>
          <Dropdown
            items={[
              {
                label: "View Details",
                icon: <FiEye />,
                onClick: () => navigate(`/dashboard/documents/agreements/${row.id}`),
              },
              {
                label: "Download",
                icon: <FiDownload />,
                onClick: () => {},
              },
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
        title="Sale Agreements"
        description="Manage sale agreements linked to bookings — track drafts, signatures and registration status."
        actions={
          <Button variant="accent" size="md" to="/dashboard/documents/agreements/new">
            <FiPlus /> New Agreement
          </Button>
        }
      />

      <div className="agreements-stats">
        <StatsCard icon={<FiFileText />} label="Total Agreements" value={stats.total} tone="accent" />
        <StatsCard icon={<FiCheckCircle />} label="Registered" value={stats.registered} tone="success" />
        <StatsCard icon={<FiEdit3 />} label="Signed" value={stats.signed} tone="info" />
        <StatsCard icon={<FiSlash />} label="Draft" value={stats.draft} tone="neutral" />
      </div>

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            placeholder="Search agreements, customers, plots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<FiFileText />}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "All Statuses" },
              ...AGREEMENT_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            placeholder="Status"
          />
        </div>
        <button
          type="button"
          className="erp-toolbar__reset"
          onClick={resetFilters}
          disabled={!hasFilters}
        >
          <FiRotateCcw /> Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey="id"
        onRowClick={(row) => navigate(`/dashboard/documents/agreements/${row.id}`)}
        emptyState={
          <EmptyState
            title="No agreements found"
            description={
              hasFilters
                ? "Try adjusting your search or filters."
                : "Create a new agreement from a confirmed booking."
            }
            action={
              !hasFilters ? (
                <Button variant="accent" size="md" to="/dashboard/documents/agreements/new">
                  <FiPlus /> New Agreement
                </Button>
              ) : (
                <Button variant="ghost" size="md" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        }
      />
    </motion.div>
  );
}

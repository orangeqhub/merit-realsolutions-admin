import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBarChart2,
  FiRotateCcw,
  FiCheckCircle,
  FiTrash2,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Select from "../../components/ui/select/Select";
import DataTable from "../../components/table/DataTable";
import EmptyState from "../../components/layout/EmptyState";
import Dropdown from "../../components/ui/dropdown/Dropdown";
import Badge from "../../components/ui/badge/Badge";
import RightDrawer from "../../components/drawer/RightDrawer";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import { useFollowUps } from "../../context/FollowUpsContext";
import { useToast } from "../../components/feedback/Toast";
import FollowUpFormFields, { FORM_ID } from "./FollowUpFormFields";
import {
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUSES,
  FOLLOWUP_PRIORITIES,
  FOLLOWUP_STATUS_META,
  PRIORITY_META,
  resolveStatus,
  formatDate,
  EMPTY_FOLLOWUP,
} from "./constants";
import "./followups.css";

const EMPTY_FILTERS = { search: "", type: "", status: "", priority: "" };
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startPad; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
}

export default function FollowUpList() {
  const toast = useToast();
  const { followUps, addFollowUp, completeFollowUp, removeFollowUp } = useFollowUps();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FOLLOWUP);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const now = new Date();
  const [calYear] = useState(now.getFullYear());
  const [calMonth] = useState(now.getMonth());

  const enriched = useMemo(
    () => followUps.map((f) => ({ ...f, displayStatus: resolveStatus(f) })),
    [followUps]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return [...enriched]
      .filter((f) => {
        const matchSearch =
          !q ||
          [f.id, f.leadName, f.customerName, f.assignedTo, f.notes, f.type]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        const matchType = !filters.type || f.type === filters.type;
        const matchStatus = !filters.status || f.displayStatus === filters.status;
        const matchPriority = !filters.priority || f.priority === filters.priority;
        return matchSearch && matchType && matchStatus && matchPriority;
      })
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }, [enriched, filters]);

  const hasFilters = filters.search || filters.type || filters.status || filters.priority;

  const datesWithFollowups = useMemo(() => {
    const set = new Set();
    followUps.forEach((f) => {
      if (!f.scheduledDate) return;
      const d = new Date(f.scheduledDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [followUps, calYear, calMonth]);

  const calendarCells = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const openDrawer = () => {
    setForm(EMPTY_FOLLOWUP);
    setDrawerOpen(true);
  };

  const handleCreate = (values) => {
    addFollowUp(values);
    toast.success("Follow-up scheduled");
    setDrawerOpen(false);
    setForm(EMPTY_FOLLOWUP);
  };

  const buildMenu = (row) => [
    ...(row.displayStatus !== "Completed"
      ? [{
          label: "Mark Complete",
          icon: <FiCheckCircle />,
          onClick: () => {
            completeFollowUp(row.id);
            toast.success("Follow-up completed");
          },
        }]
      : []),
    {
      label: "Delete",
      icon: <FiTrash2 />,
      tone: "danger",
      onClick: () => setDeleteTarget(row),
    },
  ];

  const columns = [
    {
      key: "leadName",
      header: "Lead / Customer",
      render: (row) => (
        <span className="followups-table__name">{row.leadName || row.customerName || "—"}</span>
      ),
    },
    { key: "type", header: "Type" },
    {
      key: "displayStatus",
      header: "Status",
      render: (row) => (
        <Badge tone={FOLLOWUP_STATUS_META[row.displayStatus]?.tone}>{row.displayStatus}</Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <Badge tone={PRIORITY_META[row.priority]?.tone}>{row.priority}</Badge>,
    },
    {
      key: "scheduledDate",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="followups-table__muted">
          {formatDate(row.scheduledDate)} {row.scheduledTime}
        </span>
      ),
    },
    { key: "assignedTo", header: "Assigned To", render: (row) => row.assignedTo || "—" },
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
      className="erp-module-page followups-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Follow-ups"
        description="Manage scheduled follow-ups with calendar view, filters and quick actions."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/follow-ups">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="accent" size="md" onClick={openDrawer}>
              <FiPlus /> New Follow-up
            </Button>
          </>
        }
      />

      <section className="followups-calendar">
        <div className="followups-calendar__head">
          <h2 className="erp-section-title" style={{ margin: 0 }}>
            {monthLabel}
          </h2>
          <span className="followups-table__muted">{followUps.length} total scheduled</span>
        </div>
        <div className="followups-calendar__grid">
          {DAY_LABELS.map((d) => (
            <div key={d} className="followups-calendar__day-label">
              {d}
            </div>
          ))}
          {calendarCells.map((cell, i) => {
            const isToday =
              cell.day &&
              cell.day === todayDate &&
              calMonth === todayMonth &&
              calYear === todayYear;
            const hasEvent = cell.day && datesWithFollowups.has(cell.day);
            return (
              <div
                key={`cell-${i}`}
                className={[
                  "followups-calendar__cell",
                  !cell.day ? "followups-calendar__cell--muted" : "",
                  isToday ? "followups-calendar__cell--today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {cell.day && <span className="followups-calendar__date">{cell.day}</span>}
                {hasEvent && <span className="followups-calendar__dot" />}
              </div>
            );
          })}
        </div>
      </section>

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            placeholder="Search follow-ups..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={filters.type}
            onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
            options={[{ value: "", label: "All Types" }, ...FOLLOWUP_TYPES.map((t) => ({ value: t, label: t }))]}
            placeholder="Type"
          />
          <Select
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[{ value: "", label: "All Status" }, ...FOLLOWUP_STATUSES.map((s) => ({ value: s, label: s }))]}
            placeholder="Status"
          />
          <Select
            value={filters.priority}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
            options={[{ value: "", label: "All Priority" }, ...FOLLOWUP_PRIORITIES.map((p) => ({ value: p, label: p }))]}
            placeholder="Priority"
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
          title="No follow-ups found"
          description={hasFilters ? "Try adjusting your filters." : "Schedule your first follow-up."}
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={() => setFilters(EMPTY_FILTERS)}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" onClick={openDrawer}>
                <FiPlus /> New Follow-up
              </Button>
            )
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} rowKey="id" defaultPageSize={25} />
      )}

      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Follow-up"
        subtitle="Schedule a call, meeting or site visit"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" type="submit" form={FORM_ID}>
              Schedule
            </Button>
          </>
        }
      >
        <FollowUpFormFields initialValues={form} onSubmit={handleCreate} />
      </RightDrawer>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          removeFollowUp(deleteTarget.id);
          toast.success("Follow-up removed");
          setDeleteTarget(null);
        }}
        title="Delete Follow-up?"
        message="This action cannot be undone."
        highlight={deleteTarget?.leadName || deleteTarget?.customerName}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBarChart2, FiList } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useLeads } from "../../context/LeadsContext";
import { PIPELINE_COLUMNS, LEAD_STATUS_META, PRIORITY_META, formatINR, formatDate } from "./constants";
import "./leads.css";

export default function LeadPipeline() {
  const navigate = useNavigate();
  const { leads } = useLeads();

  const columns = useMemo(() => {
    return PIPELINE_COLUMNS.map((status) => ({
      status,
      meta: LEAD_STATUS_META[status],
      items: leads.filter((l) => l.status === status),
    }));
  }, [leads]);

  return (
    <motion.div
      className="erp-module-page leads-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Lead Pipeline"
        description="Kanban view of leads by status — drag-style columns for sales stage tracking."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/leads">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="ghost" size="md" to="/dashboard/leads/list">
              <FiList /> List View
            </Button>
          </>
        }
      />

      <div className="erp-pipeline">
        {columns.map((col, colIndex) => (
          <motion.div
            key={col.status}
            className="erp-pipeline__column"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: colIndex * 0.05 }}
          >
            <div className="erp-pipeline__column-head">
              <Badge tone={col.meta.tone}>{col.status}</Badge>
              <span className="erp-pipeline__count">{col.items.length}</span>
            </div>

            {col.items.length === 0 ? (
              <p className="leads-table__muted" style={{ fontSize: "0.8rem", padding: "0.5rem 0" }}>
                No leads
              </p>
            ) : (
              col.items.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  className="erp-pipeline__card"
                  onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                >
                  <strong>{lead.name}</strong>
                  <span>{lead.interestedProperty}</span>
                  <div className="leads-pipeline__card-meta">
                    <Badge tone={PRIORITY_META[lead.priority]?.tone} size="sm">
                      {lead.priority}
                    </Badge>
                    <span>{formatINR(lead.budget)}</span>
                  </div>
                  <div className="leads-pipeline__card-meta">
                    <span>{lead.assignedExecutive || "Unassigned"}</span>
                    <span>{formatDate(lead.expectedCloseDate)}</span>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

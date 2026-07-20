import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiDollarSign,
  FiHome,
  FiCalendar,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import Select from "../../components/ui/select/Select";
import Badge from "../../components/ui/badge/Badge";
import Timeline from "../../components/timeline/Timeline";
import EmptyState from "../../components/layout/EmptyState";
import { Link } from "react-router-dom";
import { useLeads } from "../../context/LeadsContext";
import { usePartnerAssignments } from "../../context/PartnerAssignmentsContext";
import { AssignedPartnerCard } from "../../components/erp/RelationshipCards";
import { useToast } from "../../components/feedback/Toast";
import { LEAD_STATUSES, PRIORITY_META, formatINR, formatDate } from "./constants";
import "./leads.css";

export default function LeadDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { getLead, updateLeadStatus } = useLeads();
  const { getLeadRelationships } = usePartnerAssignments();

  const lead = getLead(id);
  const { partner, property, venture, nextFollowUp } = lead
    ? getLeadRelationships(id)
    : {};
  const [status, setStatus] = useState(lead?.status || "New");

  if (!lead) {
    return (
      <EmptyState
        title="Lead not found"
        description="This lead may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/leads/list">
            <FiArrowLeft /> Back to Leads
          </Button>
        }
      />
    );
  }

  const handleStatusChange = (next) => {
    setStatus(next);
    updateLeadStatus(lead.id, next);
    toast.success(`Status updated to ${next}`);
  };

  const timelineItems = (lead.timeline || []).map((item, i) => ({
    id: `tl-${i}`,
    title: item.title,
    description: item.description,
    time: formatDate(item.date),
    tone: item.tone || "accent",
  }));

  return (
    <motion.div
      className="erp-module-page leads-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "CRM" },
          { label: "Leads", to: "/dashboard/leads/list" },
          { label: lead.name },
        ]}
      />

      <section className="erp-details__header">
        <div>
          <div className="erp-details__title-row">
            <h1>{lead.name}</h1>
            <Badge status={status} dot />
            <Badge tone={PRIORITY_META[lead.priority]?.tone}>{lead.priority}</Badge>
          </div>
          <p className="erp-details__subtitle">
            {lead.id} · {lead.email} · {lead.phone}
          </p>
        </div>
        <div className="erp-details__actions">
          <div className="leads-details__status-select">
            <Select
              label="Status"
              value={status}
              onChange={handleStatusChange}
              options={LEAD_STATUSES}
            />
          </div>
        </div>
      </section>

      <div className="erp-details__summary">
        <SummaryCard icon={<FiUser />} label="Executive" value={lead.assignedExecutive || "—"} tone="violet" />
        <SummaryCard icon={<FiDollarSign />} label="Budget" value={formatINR(lead.budget)} tone="success" />
        <SummaryCard icon={<FiHome />} label="Property" value={lead.interestedProperty || "—"} tone="info" />
        <SummaryCard icon={<FiCalendar />} label="Follow-up" value={formatDate(lead.followUpDate || nextFollowUp?.scheduledDate)} tone="warning" />
      </div>

      <div className="erp-details__layout">
        <div className="erp-details__main">
          <div className="erp-details__tab-content">
            <InfoCard
              title="Lead Information"
              icon={<FiUser />}
              items={[
                { label: "Status", value: status },
                { label: "Source", value: lead.source || "—" },
                { label: "Priority", value: lead.priority },
                { label: "Budget", value: formatINR(lead.budget) },
                { label: "Interested Property", value: lead.interestedProperty || "—" },
                { label: "Venture", value: lead.ventureName || "—" },
                { label: "Sales Team Member", value: partner?.partner?.personal?.name || partner?.name || "—" },
                { label: "Follow-up Date", value: formatDate(lead.followUpDate || nextFollowUp?.scheduledDate) },
                { label: "Assigned Executive", value: lead.assignedExecutive || "—" },
                { label: "Created", value: formatDate(lead.createdDate) },
                { label: "Last Updated", value: formatDate(lead.lastUpdated) },
              ]}
            />

            <InfoCard title="Remarks" icon={<FiMessageSquare />}>
              <div className="leads-details__remarks">
                {lead.remarks || "No remarks added for this lead."}
              </div>
            </InfoCard>

            <section>
              <h3 className="erp-section-title">
                <FiClock style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
                Timeline
              </h3>
              {timelineItems.length ? (
                <Timeline items={timelineItems} />
              ) : (
                <EmptyState title="No timeline" description="Status changes and interactions will appear here." />
              )}
            </section>
          </div>
        </div>

        <aside className="erp-details__sidebar">
          <AssignedPartnerCard partner={partner?.partner} assignedDate={partner?.assignedDate} />
          {(property || venture) && (
            <InfoCard title="Interest">
              {property && (
                <Link to={`/dashboard/properties/${property.id}`} className="erp-rel-list__link">
                  <span>Property</span>
                  <strong>{property.name}</strong>
                </Link>
              )}
              {venture && (
                <Link to={`/dashboard/ventures/${venture.id}`} className="erp-rel-list__link">
                  <span>Venture</span>
                  <strong>{venture.name}</strong>
                </Link>
              )}
            </InfoCard>
          )}
          <InfoCard
            title="Assignment"
            items={[
              { label: "Executive", value: lead.assignedExecutive || "—" },
              { label: "Source", value: lead.source || "—" },
              { label: "Priority", value: lead.priority },
              { label: "Status", value: status },
            ]}
          />
          <Button variant="accent" size="md" to={`/dashboard/follow-ups/new?lead=${lead.id}`}>
            Schedule Follow-up
          </Button>
        </aside>
      </div>
    </motion.div>
  );
}

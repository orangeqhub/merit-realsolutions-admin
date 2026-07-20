import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiFileText,
  FiHome,
  FiUser,
  FiClock,
  FiShield,
} from "react-icons/fi";
import Breadcrumb from "../../../components/layout/Breadcrumb";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import Select from "../../../components/ui/select/Select";
import Upload from "../../../components/ui/upload/Upload";
import SummaryCard from "../../../components/cards/SummaryCard";
import InfoCard from "../../../components/cards/InfoCard";
import Tabs from "../../../components/navigation/Tabs";
import Timeline from "../../../components/timeline/Timeline";
import EmptyState from "../../../components/layout/EmptyState";
import { useRegistrations } from "../../../context/RegistrationsContext";
import { useToast } from "../../../components/feedback/Toast";
import {
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_META,
  formatDate,
} from "./constants";
import "../../../styles/module.css";
import "./registrations.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "timeline", label: "Timeline", icon: <FiClock /> },
];

export default function RegistrationDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { getRegistration, updateRegistration } = useRegistrations();
  const registration = getRegistration(id);

  const [tab, setTab] = useState("overview");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  const primaryDoc = useMemo(
    () => registration?.documents?.[0] || null,
    [registration]
  );

  if (!registration) {
    return (
      <EmptyState
        title="Registration not found"
        description="This registration may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/documents/registrations">
            <FiArrowLeft /> Back to Registrations
          </Button>
        }
      />
    );
  }

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc?.name || "document"}...`);
  };

  const handleStatusUpdate = () => {
    const next = statusDraft || registration.status;
    if (next === registration.status) return;
    const today = new Date().toISOString().split("T")[0];
    const patch = {
      status: next,
      timeline: [
        ...(registration.timeline || []),
        {
          type: "status",
          title: `Status changed to ${next}`,
          date: today,
          tone: REGISTRATION_STATUS_META[next]?.tone || "accent",
        },
      ],
    };
    if (next === "Completed") patch.completedDate = today;
    updateRegistration(registration.id, patch);
    toast.success(`Status updated to ${next}`);
    setStatusDraft("");
  };

  const handleUpload = () => {
    if (!uploadFile) return;
    const today = new Date().toISOString().split("T")[0];
    const newDoc = {
      id: `rd-new-${Date.now()}`,
      name: uploadFile.name || "Registration Document",
      type: "pdf",
      size: uploadFile.size ? `${(uploadFile.size / 1048576).toFixed(1)} MB` : "—",
      date: today,
    };
    updateRegistration(registration.id, {
      documents: [...(registration.documents || []), newDoc],
      timeline: [
        ...(registration.timeline || []),
        {
          type: "upload",
          title: `Document uploaded: ${newDoc.name}`,
          date: today,
          tone: "info",
        },
      ],
    });
    toast.success("Document uploaded");
    setUploadFile(null);
  };

  const timelineItems = (registration.timeline || []).map((item, i) => ({
    id: `reg-tl-${i}`,
    title: item.title,
    time: formatDate(item.date),
    tone: item.tone || "accent",
  }));

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <InfoCard
            title="Registration Details"
            icon={<FiShield />}
            items={[
              { label: "Registration No.", value: registration.registrationNumber },
              { label: "Customer", value: registration.customerName },
              { label: "Property", value: registration.propertyName },
              { label: "Plot", value: registration.plotNumber },
              { label: "Booking ID", value: registration.bookingId },
              { label: "Submitted", value: formatDate(registration.submittedDate) },
              { label: "Completed", value: formatDate(registration.completedDate) },
              { label: "Status", value: registration.status },
            ]}
          />
        );
      case "documents":
        return (
          <>
            <div className="registrations-doc-list">
              {(registration.documents || []).map((doc) => (
                <article key={doc.id} className="registrations-doc-item">
                  <span className="registrations-doc-item__icon">
                    <FiFileText />
                  </span>
                  <div className="registrations-doc-item__info">
                    <strong>{doc.name}</strong>
                    <span>
                      {doc.type?.toUpperCase()} · {doc.size} · {formatDate(doc.date)}
                    </span>
                  </div>
                  <div className="registrations-doc-item__actions">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)}>
                      <FiEye /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <FiDownload /> Download
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="registrations-preview">
              <FiFileText />
              <p>
                {previewDoc
                  ? `Preview: ${previewDoc.name}`
                  : primaryDoc
                    ? `Select Preview on ${primaryDoc.name} to view`
                    : "No document uploaded"}
              </p>
            </div>
            <Upload
              label="Upload Registration Document"
              accept=".pdf,image/*"
              variant="file"
              value={uploadFile}
              onChange={setUploadFile}
            />
            {uploadFile && (
              <Button variant="accent" size="md" onClick={handleUpload}>
                Save Document
              </Button>
            )}
          </>
        );
      case "timeline":
        return timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <p className="registrations-cell__muted">No timeline events recorded.</p>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="erp-module-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Breadcrumb
        items={[
          { label: "Registrations", to: "/dashboard/documents/registrations" },
          { label: registration.registrationNumber },
        ]}
      />

      <section className="erp-details__header">
        <div>
          <div className="erp-details__title-row">
            <h1>{registration.registrationNumber}</h1>
            <Badge
              tone={REGISTRATION_STATUS_META[registration.status]?.tone}
              label={
                REGISTRATION_STATUS_META[registration.status]?.label || registration.status
              }
            />
          </div>
          <p className="erp-details__subtitle">
            {registration.customerName} · {registration.propertyName} · Plot {registration.plotNumber}
          </p>
        </div>
        <div className="erp-details__actions">
          <Button
            variant="ghost"
            size="md"
            onClick={() => primaryDoc && handleDownload(primaryDoc)}
            disabled={!primaryDoc}
          >
            <FiDownload /> Download
          </Button>
        </div>
      </section>

      <div className="erp-details__summary">
        <SummaryCard icon={<FiUser />} label="Customer" value={registration.customerName} tone="violet" />
        <SummaryCard icon={<FiHome />} label="Property" value={registration.propertyName} tone="info" />
        <SummaryCard icon={<FiClock />} label="Submitted" value={formatDate(registration.submittedDate)} tone="warning" />
        <SummaryCard icon={<FiShield />} label="Status" value={registration.status} tone="accent" />
      </div>

      <div className="registrations-status-form">
        <Select
          label="Update Status"
          value={statusDraft || registration.status}
          onChange={setStatusDraft}
          options={REGISTRATION_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Button variant="accent" size="md" onClick={handleStatusUpdate}>
          Save Status
        </Button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="registration-tabs" />
      <motion.div
        key={tab}
        className="erp-details__tab-content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTab()}
      </motion.div>
    </motion.div>
  );
}

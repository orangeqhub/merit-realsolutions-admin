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
  FiEdit3,
} from "react-icons/fi";
import Breadcrumb from "../../../components/layout/Breadcrumb";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import Select from "../../../components/ui/select/Select";
import SummaryCard from "../../../components/cards/SummaryCard";
import InfoCard from "../../../components/cards/InfoCard";
import Tabs from "../../../components/navigation/Tabs";
import EmptyState from "../../../components/layout/EmptyState";
import { useAgreements } from "../../../context/AgreementsContext";
import { useToast } from "../../../components/feedback/Toast";
import { AGREEMENT_STATUSES, AGREEMENT_STATUS_META, formatDate } from "./constants";
import "../../../styles/module.css";
import "./agreements.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "versions", label: "Version History", icon: <FiClock /> },
];

export default function AgreementDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { getAgreement, updateAgreement } = useAgreements();
  const agreement = getAgreement(id);

  const [tab, setTab] = useState("overview");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");

  const primaryDoc = useMemo(
    () => agreement?.documents?.[0] || null,
    [agreement]
  );

  if (!agreement) {
    return (
      <EmptyState
        title="Agreement not found"
        description="This agreement may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/documents/agreements">
            <FiArrowLeft /> Back to Agreements
          </Button>
        }
      />
    );
  }

  const handleDownload = (doc) => {
    toast.success(`Downloading ${doc?.name || "document"}...`);
  };

  const handleStatusUpdate = () => {
    const next = statusDraft || agreement.status;
    if (next === agreement.status) return;
    updateAgreement(agreement.id, { status: next });
    toast.success(`Status updated to ${next}`);
    setStatusDraft("");
  };

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <div className="agreements-details__grid">
            <InfoCard
              title="Customer & Property"
              icon={<FiUser />}
              items={[
                { label: "Customer", value: agreement.customerName },
                { label: "Property", value: agreement.propertyName },
                { label: "Plot", value: agreement.plotNumber },
                { label: "Booking ID", value: agreement.bookingId },
              ]}
            />
            <InfoCard
              title="Agreement Info"
              icon={<FiFileText />}
              items={[
                { label: "Agreement No.", value: agreement.agreementNumber },
                { label: "Status", value: agreement.status },
                { label: "Version", value: `v${agreement.version}` },
                { label: "Signed Date", value: formatDate(agreement.signedDate) },
                { label: "Registered Date", value: formatDate(agreement.registeredDate) },
                { label: "Last Updated", value: formatDate(agreement.lastUpdated) },
              ]}
            />
          </div>
        );
      case "documents":
        return (
          <>
            <div className="agreements-doc-list">
              {(agreement.documents || []).map((doc) => (
                <article key={doc.id} className="agreements-doc-item">
                  <span className="agreements-doc-item__icon">
                    <FiFileText />
                  </span>
                  <div className="agreements-doc-item__info">
                    <strong>{doc.name}</strong>
                    <span>
                      {doc.type?.toUpperCase()} · {doc.size} · v{doc.version} · {formatDate(doc.date)}
                    </span>
                  </div>
                  <div className="agreements-doc-item__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <FiEye /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <FiDownload /> Download
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="agreements-preview">
              <FiFileText />
              <p>
                {previewDoc
                  ? `Preview: ${previewDoc.name} (${previewDoc.type?.toUpperCase()})`
                  : primaryDoc
                    ? `Select Preview on ${primaryDoc.name} to view`
                    : "No document uploaded"}
              </p>
              {previewDoc && (
                <Button variant="accent" size="sm" onClick={() => handleDownload(previewDoc)}>
                  <FiDownload /> Download
                </Button>
              )}
            </div>
          </>
        );
      case "versions":
        return (agreement.versionHistory || []).length > 0 ? (
          <table className="agreements-version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {agreement.versionHistory.map((v) => (
                <tr key={v.version}>
                  <td>v{v.version}</td>
                  <td>{formatDate(v.date)}</td>
                  <td>{v.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="agreements-cell__muted">No version history recorded.</p>
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
          { label: "Agreements", to: "/dashboard/documents/agreements" },
          { label: agreement.agreementNumber },
        ]}
      />

      <section className="erp-details__header">
        <div>
          <div className="erp-details__title-row">
            <h1>{agreement.agreementNumber}</h1>
            <Badge
              tone={AGREEMENT_STATUS_META[agreement.status]?.tone}
              label={AGREEMENT_STATUS_META[agreement.status]?.label || agreement.status}
            />
            <Badge tone="neutral" label={`v${agreement.version}`} />
          </div>
          <p className="erp-details__subtitle">
            {agreement.customerName} · {agreement.propertyName} · Plot {agreement.plotNumber}
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
          <Button variant="accent" size="md" to="/dashboard/documents/agreements/new">
            <FiEdit3 /> New Version
          </Button>
        </div>
      </section>

      <div className="erp-details__summary">
        <SummaryCard icon={<FiUser />} label="Customer" value={agreement.customerName} tone="violet" />
        <SummaryCard icon={<FiHome />} label="Property" value={agreement.propertyName} tone="info" />
        <SummaryCard icon={<FiFileText />} label="Version" value={`v${agreement.version}`} tone="accent" />
        <SummaryCard icon={<FiClock />} label="Signed" value={formatDate(agreement.signedDate)} tone="warning" />
      </div>

      <div className="registrations-status-form">
        <Select
          label="Update Status"
          value={statusDraft || agreement.status}
          onChange={setStatusDraft}
          options={AGREEMENT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <Button variant="accent" size="md" onClick={handleStatusUpdate}>
          Save Status
        </Button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="agreement-tabs" />
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

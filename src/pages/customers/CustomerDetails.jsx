import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiShield,
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiActivity,
  FiMessageSquare,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import Tabs from "../../components/navigation/Tabs";
import Badge from "../../components/ui/badge/Badge";
import Timeline from "../../components/timeline/Timeline";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import { useCustomers } from "../../context/CustomersContext";
import { useBookings } from "../../context/BookingsContext";
import { usePartnerAssignments } from "../../context/PartnerAssignmentsContext";
import { AssignedPartnerCard } from "../../components/erp/RelationshipCards";
import { CustomerReservationsPanel } from "../../components/reservation/ReservationCrossDomain";
import { useToast } from "../../components/feedback/Toast";
import { KYC_STATUS_META, formatINR, formatDate } from "./constants";
import "./customer.css";

const TABS = [
  { id: "profile", label: "Profile", icon: <FiUser /> },
  { id: "kyc", label: "KYC", icon: <FiShield /> },
  { id: "properties", label: "Purchased Properties", icon: <FiHome /> },
  { id: "bookings", label: "Booking History", icon: <FiCalendar /> },
  { id: "payments", label: "Payment Summary", icon: <FiDollarSign /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "timeline", label: "Timeline", icon: <FiClock /> },
  { id: "activity", label: "Activity", icon: <FiActivity /> },
  { id: "communications", label: "Communications", icon: <FiMessageSquare /> },
];

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { getCustomer, removeCustomer } = useCustomers();
  const { bookings } = useBookings();
  const { getCustomerRelationships } = usePartnerAssignments();

  const customer = getCustomer(id);
  const { partner } = customer ? getCustomerRelationships(id) : {};
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "profile";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/customers/list">
            <FiArrowLeft /> Back to Directory
          </Button>
        }
      />
    );
  }

  const customerBookings = bookings.filter((b) => b.customerId === customer.id);

  const timelineItems = (customer.timeline || []).map((item, i) => ({
    id: `tl-${i}`,
    title: item.title,
    description: item.description,
    time: formatDate(item.date),
    tone: item.tone || "accent",
  }));

  const renderTab = () => {
    switch (tab) {
      case "profile":
        return (
          <InfoCard
            title="Contact & Profile"
            icon={<FiUser />}
            items={[
              { label: "Email", value: customer.email },
              { label: "Phone", value: customer.phone },
              { label: "Alternate Phone", value: customer.alternatePhone || "—" },
              { label: "Address", value: customer.address },
              { label: "City", value: customer.city },
              { label: "State", value: customer.state },
              { label: "Occupation", value: customer.occupation || "—" },
              { label: "Source", value: customer.source || "—" },
              { label: "Assigned Agent", value: customer.assignedAgent || "—" },
              { label: "Member Since", value: formatDate(customer.createdDate) },
            ]}
          />
        );
      case "kyc":
        return (
          <>
            <InfoCard
              title="KYC Information"
              icon={<FiShield />}
              items={[
                { label: "KYC Status", value: customer.kycStatus },
                { label: "PAN", value: customer.pan || "—" },
                { label: "Aadhar", value: customer.aadhar || "—" },
              ]}
            />
            <div className="customers-payment__grid">
              <SummaryCard
                icon={<FiShield />}
                label="Verification"
                value={customer.kycStatus}
                tone={KYC_STATUS_META[customer.kycStatus]?.tone || "neutral"}
              />
            </div>
          </>
        );
      case "properties":
        return (customer.purchasedProperties || []).length ? (
          <div className="customers-properties__grid">
            {customer.purchasedProperties.map((p, i) => (
              <button
                key={`${p.id || p.plotId}-${i}`}
                type="button"
                className="customers-properties__card customers-recent__item--clickable"
                onClick={() =>
                  p.id?.startsWith("PRP")
                    ? navigate(`/dashboard/properties/${p.id}`)
                    : p.plotId && navigate(`/dashboard/plots/${p.plotId}`)
                }
              >
                <strong>{p.name || p.propertyName}</strong>
                {p.plotId && <span>Plot linked</span>}
                <span>Purchased {formatDate(p.purchaseDate || p.date)}</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No properties" description="This customer has no purchased properties yet." />
        );
      case "bookings":
        return customerBookings.length ? (
          <div className="customers-recent__list">
            {customerBookings.map((b) => (
              <button
                key={b.id}
                type="button"
                className="customers-recent__item customers-recent__item--clickable"
                onClick={() => navigate(`/dashboard/property-bookings/${b.id}`)}
              >
                <span className="customers-recent__id">{b.bookingNumber}</span>
                <div>
                  <strong>{b.propertyName}</strong>
                  <span>
                    {b.plotNumber} · {b.ventureName}
                  </span>
                </div>
                <Badge status={b.status} size="sm" />
                <span className="customers-table__muted">{formatDate(b.bookingDate)}</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No bookings" description="No booking records linked to this customer." />
        );
      case "payments":
        return (
          <div className="customers-payment__grid">
            <SummaryCard icon={<FiDollarSign />} label="Total Paid" value={formatINR(customer.totalPaid)} tone="success" />
            <SummaryCard icon={<FiDollarSign />} label="Outstanding" value={formatINR(customer.outstanding)} tone="warning" />
            <SummaryCard
              icon={<FiDollarSign />}
              label="Net Position"
              value={formatINR((Number(customer.totalPaid) || 0) + (Number(customer.outstanding) || 0))}
              tone="accent"
            />
          </div>
        );
      case "documents":
        return (customer.documents || []).length ? (
          <div className="customers-docs__list">
            {customer.documents.map((doc) => (
              <div key={doc.id} className="customers-docs__row">
                <span>
                  <strong>{doc.name}</strong> · {doc.type?.toUpperCase()} · {doc.size}
                </span>
                <span className="customers-table__muted">{formatDate(doc.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No documents" description="Upload KYC and agreement documents from the customer profile." />
        );
      case "timeline":
        return timelineItems.length ? (
          <Timeline items={timelineItems} />
        ) : (
          <EmptyState title="No timeline events" description="Customer activity will appear here." />
        );
      case "activity":
        return (customer.activities || []).length ? (
          <div className="customers-activity__list">
            {customer.activities.map((a, i) => (
              <div key={`act-${i}`} className="customers-activity__item">
                <strong>{a.title}</strong>
                <p>{a.description}</p>
                <span className="customers-table__muted">{formatDate(a.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No activity" description="Site visits and interactions will be logged here." />
        );
      case "communications":
        return (customer.communications || []).length ? (
          <div className="customers-comms__list">
            {customer.communications.map((c, i) => (
              <div key={`comm-${i}`} className="customers-comms__item">
                <strong>
                  {c.type === "call" ? <FiPhone /> : <FiMail />} {c.title}
                </strong>
                <p>{c.notes}</p>
                <span className="customers-table__muted">{formatDate(c.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No communications" description="Calls, emails and messages will appear here." />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="erp-module-page customers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "CRM" },
          { label: "Customers", to: "/dashboard/customers/list" },
          { label: customer.name },
        ]}
      />

      <section className="erp-details__header">
        <div>
          <div className="erp-details__title-row">
            <h1>{customer.name}</h1>
            <Badge status={customer.status} dot />
            <Badge status={customer.kycStatus} size="sm" />
          </div>
          <p className="erp-details__subtitle">
            {customer.id} · {customer.email} · {customer.phone}
          </p>
        </div>
        <div className="erp-details__actions">
          <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/customers/${customer.id}/edit`)}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      </section>

      <div className="erp-details__summary">
        <SummaryCard icon={<FiUser />} label="Agent" value={customer.assignedAgent || "—"} tone="violet" />
        <SummaryCard icon={<FiHome />} label="Properties" value={(customer.purchasedProperties || []).length} tone="info" />
        <SummaryCard icon={<FiCalendar />} label="Bookings" value={customerBookings.length} tone="accent" />
        <SummaryCard icon={<FiDollarSign />} label="Total Paid" value={formatINR(customer.totalPaid)} tone="success" />
        <SummaryCard icon={<FiDollarSign />} label="Payment Status" value={customer.paymentStatus || "—"} tone="primary" />
      </div>

      <div className="erp-details__layout">
        <div className="erp-details__main">
          <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="customer-tabs" />
          <motion.div
            key={tab}
            className="erp-details__tab-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </div>

        <aside className="erp-details__sidebar">
          <AssignedPartnerCard partner={partner?.partner} assignedDate={partner?.assignedDate} />
          <CustomerReservationsPanel customerId={customer.id} />
          <InfoCard
            title="Quick Info"
            items={[
              { label: "City", value: customer.city },
              { label: "Source", value: customer.source || "—" },
              { label: "Occupation", value: customer.occupation || "—" },
              { label: "Joined", value: formatDate(customer.createdDate) },
            ]}
          />
        </aside>
      </div>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          removeCustomer(customer.id);
          toast.success(`${customer.name} deleted`);
          navigate("/dashboard/customers/list");
        }}
        title="Delete Customer?"
        message="This action cannot be undone."
        highlight={customer.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

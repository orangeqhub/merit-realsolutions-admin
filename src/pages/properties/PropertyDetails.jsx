import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiHome,
  FiImage,
  FiDollarSign,
  FiMapPin,
  FiHeart,
  FiUser,
  FiFileText,
  FiClock,
  FiMaximize,
  FiCompass,
  FiDownload,
  FiExternalLink,
  FiCheck,
  FiUsers,
  FiGrid,
  FiMessageSquare,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import Tabs from "../../components/navigation/Tabs";
import ImageGrid from "../../components/gallery/ImageGrid";
import Timeline from "../../components/timeline/Timeline";
import Upload from "../../components/ui/upload/Upload";
import Select from "../../components/ui/select/Select";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import EnquiryFormModal from "../../components/enquiry/EnquiryFormModal.jsx";
import { useProperties } from "../../context/PropertiesContext";
import {
  AssignedPartnerCard,
  EntityRelationshipSummary,
} from "../../components/erp/RelationshipCards";
import { useToast } from "../../components/feedback/Toast";
import { listSalesUsers, formatSalesUserOption, ROLE_LABELS } from "../../services/users/userApi.js";
import {
  resolvePropertyAssignee,
  resolvePropertyAssignments,
} from "../../services/property/propertyMapper.js";
import {
  formatINR,
  formatFull,
  formatArea,
  formatDate,
  getListedByLabel,
  getListedByDetail,
} from "./constants";
import "./property.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "specifications", label: "Specifications", icon: <FiGrid /> },
  { id: "gallery", label: "Gallery", icon: <FiImage /> },
  { id: "pricing", label: "Pricing", icon: <FiDollarSign /> },
  { id: "location", label: "Location", icon: <FiMapPin /> },
  { id: "amenities", label: "Amenities", icon: <FiHeart /> },
  { id: "assigned-team", label: "Assigned Team", icon: <FiUsers /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "history", label: "History", icon: <FiClock /> },
];

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { getProperty, getPropertyById, removeProperty, assignProperty, unassignProperty } = useProperties();

  const [property, setProperty] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      setLoadingProperty(true);
      const cached = getProperty(id);
      if (cached && active) setProperty(cached);

      try {
        const mapped = await getPropertyById(id);
        if (active) setProperty(mapped);
      } catch (err) {
        if (active && !cached) setProperty(null);
      } finally {
        if (active) setLoadingProperty(false);
      }
    }

    if (id) loadProperty();
    return () => { active = false; };
  }, [id, getProperty, getPropertyById]);

  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploads, setUploads] = useState({});
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [assignForm, setAssignForm] = useState({ assigneeUserId: "" });
  const [assignSaving, setAssignSaving] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  if (loadingProperty && !property) {
    return (
      <EmptyState
        title="Loading property..."
        description="Fetching property details and assignment information."
        compact
      />
    );
  }

  if (!property) {
    return (
      <EmptyState
        title="Property not found"
        description="This property may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/properties/list">
            <FiArrowLeft /> Back to Properties
          </Button>
        }
      />
    );
  }

  const location = [property.city, property.district, property.state].filter(Boolean).join(", ");
  const activeAmenities = Array.isArray(property.amenityList)
    ? property.amenityList
    : Object.entries(property.amenities || {})
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key);

  const timelineItems = (property.history || []).map((h, i) => ({
    id: `${h.type}-${i}`,
    title: h.title,
    description: h.description,
    time: formatDate(h.date),
    tone: h.tone || "accent",
  }));

  const assignee = resolvePropertyAssignee(property);
  const teamAssignments = resolvePropertyAssignments(property);

  const enquiryProperty = {
    id: property.id,
    uuid: property.uuid,
    propertyTitle: property.name,
    title: property.name,
    propertyTypeName: property.propertyTypeName,
    category: property.propertyCategory,
    location,
    city: property.city,
    state: property.state,
    price: formatINR(property.finalPrice),
    status: property.status,
    area: formatArea(property.area, property.unit),
    image: property.banner || property.thumbnail,
    thumbnail: property.thumbnail,
    bannerImage: property.banner,
  };

  const openAssignModal = async () => {
    try {
      const users = await listSalesUsers();
      setAssigneeOptions(users.map(formatSalesUserOption));
      setAssignForm({
        assigneeUserId: property.assigneeUserId || property.assignedPartnerId
          ? String(property.assigneeUserId || property.assignedPartnerId)
          : "",
      });
      setAssignOpen(true);
    } catch (err) {
      toast.error(err.message || "Failed to load sales users.");
    }
  };

  const saveAssignment = async () => {
    setAssignSaving(true);
    try {
      const updated = await assignProperty(property.id, {
        assigneeUserId: assignForm.assigneeUserId || null,
      });
      setProperty(updated);
      setAssignOpen(false);
      toast.success("Assignment updated.");
    } catch (err) {
      toast.error(err.message || "Failed to update assignment.");
    } finally {
      setAssignSaving(false);
    }
  };

  const clearAssignment = async () => {
    try {
      const updated = await unassignProperty(property.id);
      setProperty(updated);
      toast.success("Assignment removed.");
    } catch (err) {
      toast.error(err.message || "Failed to remove assignment.");
    }
  };

  const renderAssignmentCard = (assignmentItem, index) => {
    const member = assignmentItem?.assignee || null;
    if (!member) return null;
    const assignedBy = assignmentItem?.assignedByUser?.name || "—";
    const assignmentStatus = assignmentItem?.status || member.status || "Active";
    const assignedDate = assignmentItem?.assignedAt || property.assignment?.assignedAt;

    return (
      <article key={`${member.id}-${index}`} className="property-assignment-card">
        <div className="property-assignment-card__header">
          <div className="property-assignment-card__identity">
            {member.photo || member.profilePhoto ? (
              <img
                src={member.photo || member.profilePhoto}
                alt=""
                className="property-assignment-card__avatar"
              />
            ) : (
              <span className="property-assignment-card__avatar property-assignment-card__avatar--placeholder">
                <FiUser />
              </span>
            )}
            <div>
              <h3>{member.name || "—"}</h3>
              <p>{member.employeeCode || member.partnerCode || "—"}</p>
            </div>
          </div>
          <Badge tone="success" label={assignmentStatus} size="sm" />
        </div>
        <div className="property-assignment-card__grid">
          <div><span>Role</span><strong>{member.roleLabel || ROLE_LABELS[member.role] || member.role || "—"}</strong></div>
          <div><span>Mobile</span><strong>{member.mobile || "—"}</strong></div>
          <div><span>Email</span><strong>{member.email || "—"}</strong></div>
          <div><span>Assigned Date</span><strong>{formatDate(assignedDate)}</strong></div>
          <div><span>Assigned By</span><strong>{assignedBy}</strong></div>
          <div><span>Status</span><strong>{assignmentStatus}</strong></div>
        </div>
        <div className="property-assignment-card__actions">
          <Button variant="ghost" size="sm" to={`/dashboard/users/${member.id}`}>
            <FiExternalLink /> View Profile
          </Button>
        </div>
      </article>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <AssignedPartnerCard
              partner={assignee}
              assignedDate={property.assignment?.assignedAt}
            />
            <EntityRelationshipSummary
              items={[{ key: "status", label: "Status", value: property.status }]}
            />
            <div className="property-details__overview-grid">
              <InfoCard
                title="Property Information"
                items={[
                  { label: "Code", value: property.code },
                  { label: "Type", value: property.propertyTypeName },
                  {
                    label: "Listed By",
                    value: (
                      <span className="property-listed-by">
                        <span className="property-listed-by__type">
                          {property.listedByLabel || getListedByLabel(property.propertyListedBy)}
                        </span>
                        {getListedByDetail(property) ? (
                          <span className="property-listed-by__name">{getListedByDetail(property)}</span>
                        ) : null}
                      </span>
                    ),
                  },
                  { label: "Category", value: property.propertyCategory },
                  { label: "Area", value: formatArea(property.area, property.unit) },
                  { label: "Facing", value: property.facing },
                ]}
              />
              <InfoCard
                title="Dates"
                items={[
                  { label: "Created", value: formatDate(property.createdDate) },
                  { label: "Last Updated", value: formatDate(property.lastUpdated) },
                  { label: "Status", value: property.status },
                ]}
              />
            </div>
          </>
        );
      case "specifications":
        return (property.specifications || []).length ? (
          <InfoCard
            title="Property Specifications"
            items={(property.specifications || []).map((spec) => ({
              label: spec.name,
              value: spec.value,
            }))}
          />
        ) : (
          <EmptyState
            icon={<FiGrid />}
            title="No specifications"
            description="Specifications are loaded based on property type when editing."
            compact
          />
        );
      case "gallery":
        return property.gallery?.length ? (
          <ImageGrid images={property.gallery} columns={3} enableLightbox />
        ) : (
          <EmptyState
            icon={<FiImage />}
            title="No gallery images"
            description="Upload images when editing this property."
            compact
          />
        );
      case "pricing":
        return (
          <div className="property-details__pricing-grid">
            <SummaryCard icon={<FiDollarSign />} label="Price" value={formatINR(property.finalPrice)} tone="success" />
            <SummaryCard icon={<FiDollarSign />} label="Registration" value={formatINR(property.registrationCharges || 0)} tone="info" />
            <SummaryCard icon={<FiDollarSign />} label="Maintenance" value={formatINR(property.maintenanceCharges || 0)} tone="primary" />
            <InfoCard
              title="Price Breakdown"
              items={[
                { label: "Listed Price", value: formatFull(property.finalPrice) },
                { label: "Negotiable", value: property.negotiable ? "Yes" : "No" },
                { label: "Registration Charges", value: formatFull(property.registrationCharges || 0) },
                { label: "Maintenance", value: formatFull(property.maintenanceCharges || 0) },
              ]}
            />
          </div>
        );
      case "location":
        return (
          <>
            <InfoCard
              title="Address"
              items={[
                { label: "City", value: property.city },
                { label: "District", value: property.district },
                { label: "State", value: property.state },
              ]}
            />
            <div className="property-details__map-card">
              <h3>Map & Coordinates</h3>
              {property.location?.latitude && property.location?.longitude && (
                <p className="property-details__coords">
                  {property.location.latitude}, {property.location.longitude}
                </p>
              )}
              {property.location?.mapUrl && (
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => window.open(property.location.mapUrl, "_blank", "noopener")}
                >
                  <FiExternalLink /> Open in Google Maps
                </Button>
              )}
              {property.location?.landmarks?.length > 0 && (
                <>
                  <h3>Nearby Landmarks</h3>
                  <ul className="property-details__landmarks">
                    {property.location.landmarks.map((lm, i) => (
                      <li key={i}>{lm}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        );
      case "amenities":
        return activeAmenities.length ? (
          <div className="property-amenities">
            {activeAmenities.map((name) => (
              <div key={name} className="property-amenities__item">
                <span className="property-amenities__icon">
                  <FiCheck />
                </span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FiHeart />}
            title="No amenities listed"
            description="Add amenities when editing this property."
            compact
          />
        );
      case "assigned-team":
        return (
          <div className="property-assigned-team">
            <div className="property-assigned-team__actions">
              <Button variant="accent" size="sm" onClick={openAssignModal}>
                Change Assignment
              </Button>
              {teamAssignments.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAssignment}>
                  Remove Assignment
                </Button>
              )}
            </div>
            {teamAssignments.length > 0 ? (
              <div className="property-assignment-list">
                {teamAssignments.map((assignmentItem, index) => renderAssignmentCard(assignmentItem, index))}
              </div>
            ) : (
              <EmptyState
                icon={<FiUsers />}
                title="No team member assigned"
                description="Assign a sales team member from this tab or the property form."
                compact
              />
            )}
            {assignOpen && (
              <div className="property-assign-modal">
                <h3>Change Assignment</h3>
                <Select
                  label="Assign To"
                  value={assignForm.assigneeUserId}
                  onChange={(v) => setAssignForm({ assigneeUserId: v || "" })}
                  options={assigneeOptions}
                  searchable
                  placeholder="Select team member"
                />
                <div className="property-assign-modal__actions">
                  <Button variant="ghost" size="sm" onClick={() => setAssignOpen(false)}>Cancel</Button>
                  <Button variant="accent" size="sm" onClick={saveAssignment} disabled={assignSaving}>Save</Button>
                </div>
              </div>
            )}
          </div>
        );
      case "documents":
        return (
          <>
            {property.documents?.length ? (
              <div className="property-docs">
                {property.documents.map((doc, index) => (
                  <article key={doc.url || doc.name || index} className="property-docs__card">
                    <span className="property-docs__icon">
                      <FiFileText />
                    </span>
                    <div className="property-docs__info">
                      <h4>{doc.name || `Document ${index + 1}`}</h4>
                      <p>{doc.isPublic ? "Public on website" : "Admin only"}</p>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="property-docs__download"
                        aria-label={`Open ${doc.name}`}
                      >
                        <FiDownload />
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FiFileText />}
                title="No documents"
                description="Upload property documents when editing."
                compact
              />
            )}
          </>
        );
      case "history":
        return timelineItems.length ? (
          <Timeline items={timelineItems} />
        ) : (
          <EmptyState
            icon={<FiClock />}
            title="No history"
            description="Activity timeline will appear as changes are made."
            compact
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="erp-module-page property-page property-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "Properties", to: "/dashboard/properties/list" },
          { label: property.propertyTypeName || property.name },
          { label: property.name },
        ]}
      />

      <section className="property-hero">
        <div className="property-hero__banner">
          {(property.banner || property.thumbnail) ? (
            <img src={property.banner || property.thumbnail} alt={property.name} />
          ) : (
            <div className="property-hero__banner-placeholder" aria-hidden="true" />
          )}
          <div className="property-hero__overlay" />
        </div>
        <div className="property-hero__content">
          <div>
            <div className="property-hero__badges">
              <Badge status={property.status} dot />
              <span className="property-hero__type">{property.propertyTypeName}</span>
              <span className="property-hero__type">{property.propertyCategory}</span>
            </div>
            <h1 className="property-hero__title">{property.name}</h1>
            <p className="property-hero__meta">
              <span><FiMapPin /> {location}</span>
              <span><FiMaximize /> {formatArea(property.area)}</span>
              <span><FiCompass /> {property.facing}</span>
            </p>
          </div>
          <div className="property-hero__actions">
            <Button variant="accent" size="md" onClick={() => setEnquiryOpen(true)}>
              <FiMessageSquare /> Create Enquiry
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/properties/${property.id}/edit`)}>
              <FiEdit2 /> Edit
            </Button>
            <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
              <FiTrash2 /> Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="erp-details__summary">
        <SummaryCard icon={<FiDollarSign />} label="Price" value={formatINR(property.finalPrice)} tone="success" />
        <SummaryCard icon={<FiMaximize />} label="Area" value={formatArea(property.area, property.unit)} tone="accent" />
        <SummaryCard icon={<FiCompass />} label="Facing" value={property.facing || "—"} tone="info" />
        <SummaryCard icon={<FiGrid />} label="Type" value={property.propertyTypeName || "—"} tone="violet" />
        <SummaryCard icon={<FiHome />} label="Status" value={property.status} tone="warning" />
      </div>

      <div className="erp-details__layout">
        <div className="erp-details__main">
          <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="property-tabs" />
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

      </div>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          removeProperty(property.id);
          toast.success(`${property.name} deleted`);
          navigate("/dashboard/properties/list");
        }}
        title="Delete Property?"
        message="This action cannot be undone."
        highlight={property.name}
        confirmLabel="Delete"
        tone="danger"
      />

      {enquiryOpen ? (
        <EnquiryFormModal
          property={enquiryProperty}
          onClose={() => setEnquiryOpen(false)}
          onSuccess={() => toast.success('Enquiry submitted successfully.')}
        />
      ) : null}
    </motion.div>
  );
}

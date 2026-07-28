import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiUser,
  FiHash,
  FiCreditCard,
  FiFileText,
  FiLayers,
  FiGrid,
  FiMap,
  FiTrendingUp,
  FiCalendar,
  FiPlusCircle,
  FiEdit3,
  FiArrowLeft,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import StatsCard from "../../components/cards/StatsCard";
import Badge from "../../components/ui/badge/Badge";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import RightDrawer from "../../components/drawer/RightDrawer";
import Button from "../../components/ui/button/Button";
import { useCompanies } from "../../context/CompaniesContext";
import { companyService } from "../../shared/services/companyService.js";
import CompanyForm from "./CompanyForm";
import "./company.css";

const ACTIVITY_ICONS = {
  created: <FiPlusCircle />,
  venture: <FiLayers />,
  layout: <FiMap />,
  update: <FiEdit3 />,
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCompany, updateCompany, removeCompany } = useCompanies();
  const company = getCompany(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!company) {
    return (
      <div className="company-page">
        <EmptyState
          title="Company not found"
          description="The company you are looking for doesn't exist or may have been removed."
          action={
            <Button variant="accent" size="md" onClick={() => navigate("/dashboard/companies")}>
              <FiArrowLeft />
              Back to Companies
            </Button>
          }
        />
      </div>
    );
  }

  const handleEditSubmit = (values) => {
    updateCompany(company.id, values);
    setEditOpen(false);
  };

  const handleDelete = () => {
    removeCompany(company.id);
    navigate("/dashboard/companies");
  };

  const companyStats = companyService.getStatistics(company.id);
  const summary = [
    { icon: <FiLayers />, label: "Total Ventures", value: companyStats.ventures, tone: "accent" },
    { icon: <FiMap />, label: "Layouts", value: companyStats.layouts, tone: "info" },
    { icon: <FiGrid />, label: "Plots", value: companyStats.plots, tone: "primary" },
    {
      icon: <FiTrendingUp />,
      label: "Revenue",
      value: companyStats.revenue,
      tone: "success",
      prefix: "₹",
      suffix: " Cr",
      decimals: 1,
    },
    { icon: <FiCalendar />, label: "Bookings", value: companyStats.bookings, tone: "warning" },
  ];

  const infoCards = [
    {
      title: "Address",
      icon: <FiMapPin />,
      rows: [
        { label: "Street", value: company.address },
        { label: "City", value: company.city },
        { label: "District", value: company.district },
        { label: "State", value: company.state },
        { label: "Pincode", value: company.pincode },
      ],
    },
    {
      title: "Contact Details",
      icon: <FiPhone />,
      rows: [
        { label: "Contact Person", value: company.contactPerson, icon: <FiUser /> },
        { label: "Mobile", value: company.mobile, icon: <FiPhone /> },
        { label: "Alternate", value: company.altMobile || "—", icon: <FiPhone /> },
        { label: "Email", value: company.email, icon: <FiMail /> },
        { label: "Website", value: company.website, icon: <FiGlobe /> },
      ],
    },
    {
      title: "Business Information",
      icon: <FiFileText />,
      rows: [
        { label: "GST Number", value: company.gst, icon: <FiHash /> },
        { label: "PAN Number", value: company.pan, icon: <FiCreditCard /> },
        { label: "Registration", value: company.registrationNumber, icon: <FiFileText /> },
      ],
    },
  ];

  return (
    <motion.div
      className="company-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Breadcrumb
        items={[
          { label: "Masters" },
          { label: "Companies", to: "/dashboard/companies" },
          { label: company.name },
        ]}
      />

      {/* Profile banner */}
      <motion.section
        className="company-profile"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="company-profile__banner">
          <img src={company.banner} alt={`${company.name} banner`} />
          <div className="company-profile__banner-overlay" />
        </div>

        <div className="company-profile__body">
          <div className="company-profile__identity">
            <img className="company-profile__logo" src={company.logo} alt={company.name} />
            <div className="company-profile__heading">
              <div className="company-profile__title-row">
                <h1 className="company-profile__name">{company.name}</h1>
                <Badge status={company.status} dot />
              </div>
              <div className="company-profile__meta">
                <span className="company-cell__type">{company.type}</span>
                <span className="company-cell__type">{company.salesPartnershipType === "FULL_TIME" ? "Full Time Sales" : company.salesPartnershipType === "PART_TIME" ? "Part Time Sales" : "—"}</span>
                <span className="company-profile__id">{company.id}</span>
              </div>
            </div>
          </div>

          <div className="company-profile__actions">
            <Button variant="ghost" size="md" onClick={() => setEditOpen(true)}>
              <FiEdit2 />
              Edit
            </Button>
            <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
              <FiTrash2 />
              Delete
            </Button>
          </div>
        </div>

        {company.description && (
          <p className="company-profile__description">{company.description}</p>
        )}
      </motion.section>

      {/* Business summary */}
      <div className="company-summary">
        {summary.map((item, index) => (
          <StatsCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            tone={item.tone}
            prefix={item.prefix}
            suffix={item.suffix}
            decimals={item.decimals}
            delay={index * 0.06}
          />
        ))}
      </div>

      {/* Info cards */}
      <div className="company-info-grid">
        {infoCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="company-info-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
          >
            <div className="company-info-card__head">
              <span className="company-info-card__icon">{card.icon}</span>
              <h3 className="company-info-card__title">{card.title}</h3>
            </div>
            <dl className="company-info-card__rows">
              {card.rows.map((row) => (
                <div key={row.label} className="company-info-card__row">
                  <dt>{row.label}</dt>
                  <dd>{row.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        ))}
      </div>

      <div className="company-detail-columns">
        {/* Gallery */}
        <motion.section
          className="company-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="company-panel__head">
            <h3 className="company-panel__title">Gallery</h3>
            <span className="company-panel__count">
              {company.gallery?.length || 0} images
            </span>
          </div>
          {company.gallery?.length ? (
            <div className="company-gallery">
              {company.gallery.map((image, index) => (
                <motion.div
                  key={image}
                  className="company-gallery__item"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.25 + index * 0.05 }}
                >
                  <img src={image} alt={`${company.name} ${index + 1}`} loading="lazy" />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState title="No gallery images" description="Images will appear here once uploaded." />
          )}
        </motion.section>

        {/* Recent activities */}
        <motion.section
          className="company-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
        >
          <div className="company-panel__head">
            <h3 className="company-panel__title">Recent Activities</h3>
          </div>
          <ul className="company-timeline">
            {(company.activities || []).map((activity, index) => (
              <li key={`${activity.title}-${index}`} className="company-timeline__item">
                <span className={`company-timeline__icon company-timeline__icon--${activity.type}`}>
                  {ACTIVITY_ICONS[activity.type] || <FiEdit3 />}
                </span>
                <div className="company-timeline__content">
                  <p className="company-timeline__title">{activity.title}</p>
                  <p className="company-timeline__desc">{activity.description}</p>
                  <span className="company-timeline__date">{formatDate(activity.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      <RightDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Company"
        subtitle="Update the company details below."
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" type="submit" form="company-form">
              Save Changes
            </Button>
          </>
        }
      >
        <CompanyForm initialValues={company} onSubmit={handleEditSubmit} />
      </RightDrawer>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Company?"
        message="This action cannot be undone."
        highlight={company.name}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
      />
    </motion.div>
  );
}

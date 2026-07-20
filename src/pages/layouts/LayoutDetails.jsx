import { useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiGrid,
  FiMapPin,
  FiMaximize,
  FiHome,
  FiMap,
  FiHeart,
  FiImage,
  FiFileText,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiBookmark,
  FiTag,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import ProgressBar from "../../components/feedback/ProgressBar";
import Tabs from "../../components/navigation/Tabs";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import LayoutPlanViewer from "../../components/layouts/LayoutPlanViewer";
import LayoutQuickActions from "../../components/layouts/LayoutQuickActions";
import LayoutGallery from "../../components/layouts/LayoutGallery";
import LayoutDocuments from "../../components/layouts/LayoutDocuments";
import LayoutTimeline from "../../components/layouts/LayoutTimeline";
import LayoutAmenities from "../../components/layouts/LayoutAmenities";
import { useLayouts } from "../../context/LayoutsContext";
import { usePartnerAssignments } from "../../context/PartnerAssignmentsContext";
import {
  AssignedPartnersList,
  EntityRelationshipSummary,
} from "../../components/erp/RelationshipCards";
import { useToast } from "../../components/feedback/Toast";
import { formatArea, formatPrice, formatSqYardPrice } from "./constants";
import "./layout.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "plan", label: "Layout Plan", icon: <FiMap /> },
  { id: "plots", label: "Plots", icon: <FiGrid /> },
  { id: "amenities", label: "Amenities", icon: <FiHeart /> },
  { id: "gallery", label: "Gallery", icon: <FiImage /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "timeline", label: "Timeline", icon: <FiClock /> },
  { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
];

export default function LayoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getLayoutStats } = usePartnerAssignments();
  const [searchParams] = useSearchParams();
  const { getLayout, removeLayout } = useLayouts();
  const layout = getLayout(id);
  const layoutStats = getLayoutStats(id);

  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!layout) {
    return (
      <EmptyState
        title="Layout not found"
        description="This layout may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/layouts/list">
            <FiArrowLeft /> Back to Layouts
          </Button>
        }
      />
    );
  }

  const plots = layoutStats.plots || layout.plots || {};
  const location = [layout.city, layout.district, layout.state].filter(Boolean).join(", ");

  const handleDelete = () => {
    removeLayout(layout.id);
    toast.success(`${layout.name} deleted`);
    navigate("/dashboard/layouts/list");
  };

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <div className="layout-details__summary">
              <SummaryCard icon={<FiGrid />} label="Total Plots" value={plots.total || 0} tone="accent" />
              <SummaryCard icon={<FiCheckCircle />} label="Available" value={plots.available || 0} tone="success" />
              <SummaryCard icon={<FiClock />} label="Booked" value={plots.booked || 0} tone="warning" />
              <SummaryCard icon={<FiBookmark />} label="Reserved" value={plots.reserved || 0} tone="violet" />
              <SummaryCard icon={<FiTag />} label="Sold" value={plots.sold || 0} tone="info" />
              <SummaryCard icon={<FiMaximize />} label="Bookings" value={layoutStats.bookingStats?.total || 0} tone="primary" />
            </div>

            <div className="layout-details__overview-grid">
              <InfoCard
                title="Layout Information"
                items={[
                  { label: "Code", value: layout.code },
                  { label: "Survey No.", value: layout.surveyNumber },
                  { label: "Approval", value: layout.approval },
                  { label: "Approval No.", value: layout.approvalNumber },
                  { label: "Approval Date", value: layout.approvalDate },
                  { label: "Plot Count", value: layout.plotCount },
                ]}
              />
              <InfoCard
                title="Venture & Pricing"
                items={[
                  { label: "Venture", value: layout.ventureName },
                  { label: "Base Price", value: formatSqYardPrice(layout.basePrice) },
                  { label: "Current Price", value: formatSqYardPrice(layout.currentPrice) },
                  { label: "Registration", value: formatPrice(layout.registrationCharges) },
                  { label: "Development", value: formatPrice(layout.developmentCharges) },
                  { label: "Revenue", value: `₹${(layout.revenue || 0).toFixed(1)} Cr` },
                ]}
              />
              <div className="layout-details__progress-card">
                <h3>Development Progress</h3>
                <ProgressBar value={layout.progress} showValue tone="accent" />
                <div className="layout-details__plot-breakdown">
                  <span className="avail">{plots.available} Available</span>
                  <span className="booked">{plots.booked} Booked</span>
                  <span className="reserved">{plots.reserved} Reserved</span>
                  <span className="sold">{plots.sold} Sold</span>
                </div>
                <Button variant="soft" size="sm" onClick={() => setTab("plan")}>
                  <FiMap /> View Layout Plan
                </Button>
              </div>
            </div>

            {layout.description && (
              <p className="layout-details__description">{layout.description}</p>
            )}
          </>
        );
      case "plan":
        return (
          <LayoutPlanViewer src={layout.layoutPlan} title={`${layout.name} — Layout Plan`} />
        );
      case "plots":
        return (
          <EmptyState
            icon={<FiGrid />}
            title="Plot Inventory"
            description={`${plots.total || 0} plots registered for this layout. The interactive plot inventory & booking module is coming next.`}
            action={
              <Button variant="accent" size="md" onClick={() => setTab("plan")}>
                <FiMap /> Open Layout Plan
              </Button>
            }
          />
        );
      case "amenities":
        return <LayoutAmenities amenities={layout.amenities} />;
      case "gallery":
        return <LayoutGallery images={layout.gallery} />;
      case "documents":
        return <LayoutDocuments documents={layout.documents} />;
      case "timeline":
        return <LayoutTimeline activities={layout.activities} />;
      case "analytics":
        return (
          <div className="layout-details__analytics">
            <ChartCard title="Plot Distribution" subtitle="By plot size">
              <BarChart data={layout.analytics?.plotDistribution || []} color="var(--erp-accent)" />
            </ChartCard>
            <ChartCard title="Booking Status" subtitle="Inventory breakdown">
              <div className="layout-details__donut-wrap">
                <DonutChart
                  data={layout.analytics?.bookingStatus || []}
                  centerValue={plots.total || 0}
                  centerLabel="Plots"
                />
              </div>
            </ChartCard>
            <ChartCard title="Revenue Projection" subtitle="Quarterly (₹ Lakhs)">
              <LineChart data={layout.analytics?.revenueProjection || []} color="var(--erp-success)" />
            </ChartCard>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="layout-page layout-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "Layouts", to: "/dashboard/layouts/list" },
          { label: layout.name },
        ]}
      />

      <section className="layout-hero">
        <div className="layout-hero__banner">
          <img src={layout.banner} alt={layout.name} />
          <div className="layout-hero__overlay" />
        </div>
        <div className="layout-hero__content">
          <div className="layout-hero__info">
            <div className="layout-hero__badges">
              <Badge status={layout.status} dot />
              <span className="layout-hero__approval">{layout.approval}</span>
              <Link to={`/dashboard/ventures/${layout.ventureId}`} className="layout-hero__venture">
                {layout.ventureName}
              </Link>
            </div>
            <h1 className="layout-hero__title">{layout.name}</h1>
            <p className="layout-hero__meta">
              <span><FiMapPin /> {location}</span>
              <span><FiMaximize /> {formatArea(layout.totalArea)}</span>
              <span><FiGrid /> {plots.total || 0} plots</span>
            </p>
          </div>
          <div className="layout-hero__actions">
            <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/layouts/${layout.id}/edit`)}>
              <FiEdit2 /> Edit
            </Button>
            <Button variant="ghost" size="md" onClick={() => setTab("plots")}>
              <FiGrid /> Plot Inventory
            </Button>
            <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
              <FiTrash2 /> Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="layout-details__layout">
        <div className="layout-details__main">
          <AssignedPartnersList partners={layoutStats.partners} />
          <EntityRelationshipSummary
            items={[
              {
                key: "active",
                label: "Active Bookings",
                value: layoutStats.bookingStats?.active || 0,
                to: "/dashboard/property-bookings",
              },
              {
                key: "completed",
                label: "Completed Bookings",
                value: layoutStats.bookingStats?.completed || 0,
                to: "/dashboard/property-bookings",
              },
            ]}
          />

          <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="layout-tabs" />
          <motion.div
            key={tab}
            className="layout-details__tab-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </div>

        <LayoutQuickActions
          className="layout-details__sidebar"
          onAction={(actionId) => {
            if (actionId === "open-plots") setTab("plots");
            else if (actionId === "export") toast.success("Layout export started");
            else if (actionId === "upload-docs") setTab("documents");
            else if (actionId === "report") setTab("analytics");
            else toast.info("This action will be available soon");
          }}
        />
      </div>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Layout?"
        message="This action cannot be undone."
        highlight={layout.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

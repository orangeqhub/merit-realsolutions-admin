import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiLayers,
  FiGrid,
  FiUsers,
  FiDollarSign,
  FiUserCheck,
  FiPlus,
  FiEye,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import VentureHeader from "../../components/venture/VentureHeader";
import VentureTabs from "../../components/venture/VentureTabs";
import VentureQuickActions from "../../components/venture/VentureQuickActions";
import VentureProgress from "../../components/venture/VentureProgress";
import {
  VentureGallery,
  VentureTimeline,
  VentureDocuments,
  VentureAmenities,
  VenturePricing,
  VentureLocation,
} from "../../components/venture/VentureSubComponents";
import { useVentures } from "../../context/VenturesContext";
import { useLayouts } from "../../shared/hooks/useLayouts.js";
import { usePartnerAssignments } from "../../context/PartnerAssignmentsContext";
import {
  AssignedPartnersList,
  RevenueSummaryCard,
} from "../../components/erp/RelationshipCards";
import { useToast } from "../../components/feedback/Toast";
import { getVentureAnalytics, getVentureStatistics } from "../../shared/services/statisticsService.js";
import { useCollection } from "../../shared/hooks/useDataStore.js";
import InteractivePlotReservationWorkspace from "../../domains/venture/interactivePlots/InteractivePlotReservationWorkspace";
import "./venture.css";

export default function VentureDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVentureStats } = usePartnerAssignments();
  const toast = useToast();
  const { getVenture, removeVenture } = useVentures();
  const { getByVenture } = useLayouts();
  const plots = useCollection("plots");
  const layouts = useCollection("layouts");
  const venture = getVenture(id);
  const ventureStats = getVentureStats(id);
  const stats = useMemo(() => (id ? getVentureStatistics(id) : null), [id, plots, layouts]);
  const analytics = useMemo(() => (id ? getVentureAnalytics(id) : null), [id, plots, layouts]);
  const ventureLayouts = useMemo(() => (id ? getByVenture(id) : []), [id, getByVenture, layouts]);
  const [tab, setTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!venture) {
    return (
      <EmptyState
        title="Venture not found"
        description="This venture may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/ventures/list">
            <FiArrowLeft /> Back to Ventures
          </Button>
        }
      />
    );
  }

  const revenueCr = stats?.revenue ? (stats.revenue / 10000000).toFixed(2) : "0";

  const handleDelete = () => {
    removeVenture(venture.id);
    toast.success(`${venture.name} deleted`);
    navigate("/dashboard/ventures/list");
  };

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <div className="venture-details__summary">
              <SummaryCard icon={<FiLayers />} label="Layouts" value={stats?.totalLayouts ?? 0} tone="accent" />
              <SummaryCard icon={<FiGrid />} label="Total Plots" value={stats?.totalPlots ?? 0} tone="violet" />
              <SummaryCard icon={<FiUsers />} label="Bookings" value={stats?.totalBookings ?? 0} tone="warning" />
              <SummaryCard icon={<FiDollarSign />} label="Revenue" value={`₹${revenueCr} Cr`} tone="success" />
              <SummaryCard icon={<FiUsers />} label="Active Leads" value={stats?.activeLeads ?? 0} tone="info" />
              <SummaryCard icon={<FiUserCheck />} label="Agents" value={ventureStats.partners?.length ?? 0} tone="primary" />
            </div>
            <div className="venture-details__overview-grid">
              <InfoCard
                title="Project Info"
                items={[
                  { label: "Code", value: venture.code },
                  { label: "Property Type", value: venture.propertyType },
                  { label: "Developer", value: venture.developer },
                  { label: "Approval", value: venture.approval },
                  { label: "DTCP", value: venture.dtcp || "—" },
                  { label: "RERA", value: venture.rera || "—" },
                ]}
              />
              <div className="venture-details__progress-card">
                <h3>Project Progress</h3>
                <VentureProgress value={venture.progress} label="Overall Completion" />
                <div className="venture-details__plot-breakdown">
                  <span className="avail">{stats?.availablePlots ?? 0} Available</span>
                  <span className="booked">{stats?.bookedPlots ?? 0} Booked</span>
                  <span className="sold">{stats?.soldPlots ?? 0} Sold</span>
                </div>
              </div>
            </div>
            <p className="venture-details__description">{venture.description}</p>
            <VentureLocation venture={venture} />
          </>
        );
      case "layouts":
        return ventureLayouts.length ? (
          <div className="venture-details__layouts">
            <div className="venture-details__layouts-head">
              <h3>Layouts ({ventureLayouts.length})</h3>
              <Button variant="accent" size="sm" to={`/dashboard/layouts/new?venture=${venture.id}`}>
                <FiPlus /> Add Layout
              </Button>
            </div>
            <div className="venture-details__layouts-grid">
              {ventureLayouts.map((layout) => (
                <article key={layout.id} className="venture-details__layout-card">
                  <h4>{layout.name}</h4>
                  <p>{layout.city}, {layout.district}</p>
                  <span className="venture-details__layout-status">{layout.status}</span>
                  <Button variant="ghost" size="sm" to={`/dashboard/layouts/${layout.id}`}>
                    <FiEye /> Open
                  </Button>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No layouts yet"
            description="Create the first layout for this venture to start adding plots."
            action={
              <Button variant="accent" size="md" to={`/dashboard/layouts/new?venture=${venture.id}`}>
                <FiPlus /> Create Layout
              </Button>
            }
          />
        );
      case "plots":
        return <InteractivePlotReservationWorkspace venture={venture} />;
      case "pricing":
        return <VenturePricing venture={venture} />;
      case "amenities":
        return <VentureAmenities amenities={venture.amenities} />;
      case "gallery":
        return <VentureGallery images={venture.gallery} />;
      case "documents":
        return <VentureDocuments documents={venture.documents} />;
      case "timeline":
        return <VentureTimeline activities={venture.activities} />;
      case "analytics":
        return (
          <div className="venture-details__analytics">
            <ChartCard title="Monthly Sales" subtitle="Booking trend">
              <BarChart data={analytics?.monthlySales || []} color="var(--erp-accent)" />
            </ChartCard>
            <ChartCard title="Plot Status" subtitle="Inventory breakdown">
              <div className="venture-details__donut-wrap">
                <DonutChart
                  data={analytics?.plotStatus?.length ? analytics.plotStatus : [{ label: "No plots", value: 1, color: "#94a3b8" }]}
                  centerValue={stats?.totalPlots ?? 0}
                  centerLabel="Plots"
                />
              </div>
            </ChartCard>
            <ChartCard title="Revenue Trend" subtitle="Last 6 months (₹ Lakhs)">
              <LineChart
                data={(analytics?.monthlySales || []).map((m) => ({
                  ...m,
                  value: m.value * 2.5,
                }))}
                color="var(--erp-success)"
              />
            </ChartCard>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="venture-page venture-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "Ventures", to: "/dashboard/ventures/list" },
          { label: venture.name },
        ]}
      />

      <VentureHeader
        venture={venture}
        onEdit={() => navigate(`/dashboard/ventures/${venture.id}/edit`)}
        onShare={() => toast.info("Share link copied to clipboard")}
        onDocuments={() => setTab("documents")}
      />

      <div className="venture-details__layout">
        <div className="venture-details__main">
          <VentureTabs active={tab} onChange={setTab} />
          <motion.div
            key={tab}
            className="venture-details__tab-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </div>

        <div className="venture-details__sidebar">
          <AssignedPartnersList partners={ventureStats.partners} />
          <RevenueSummaryCard
            label="Booking Revenue"
            amount={ventureStats.revenue}
            bookings={ventureStats.bookings}
          />

          <VentureQuickActions
            onAction={(actionId) => {
              if (actionId === "add-layout")
                navigate(`/dashboard/layouts/new?venture=${venture.id}`);
              else if (actionId === "import-plots") setTab("plots");
              else if (actionId === "upload-docs") setTab("documents");
              else if (actionId === "report") setTab("analytics");
              else toast.info("This action will be available soon");
            }}
          />
        </div>
      </div>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Venture?"
        message="This action cannot be undone."
        highlight={venture.name}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

import { useMemo, useState } from "react";
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
  FiUploadCloud,
  FiDownload,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Tabs from "../../components/navigation/Tabs";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import LineChart from "../../components/charts/LineChart";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import LayoutPlanViewer from "../../components/layouts/LayoutPlanViewer";
import LayoutQuickActions from "../../components/layouts/LayoutQuickActions";
import LayoutDashboardPanels from "../../components/layouts/LayoutDashboardPanels";
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
import { useVentures } from "../../context/VenturesContext";
import ImportLayoutWizard from "../../features/layout-import/ImportLayoutWizard";
import { LayoutExcelExporter } from "../../services/layoutImport";
import { getLayoutHeroImageUrl, getLayoutPlanSrc } from "../../utils/media.js";
import { LAYOUT_LABELS } from "./layoutTerminology";
import { formatArea } from "./constants";
import { getLayoutGisSummary } from "./layoutGisSummary";
import "./layout.css";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
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
  const { getLayout, getLayoutRecord, removeLayout } = useLayouts();
  const { getVenture } = useVentures();
  const layout = getLayout(id);
  const layoutRecord = getLayoutRecord(id);
  const venture = useMemo(
    () => (layout ? getVenture(layout.ventureId) : null),
    [getVenture, layout]
  );
  const layoutStats = getLayoutStats(id);

  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "dashboard";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const plots = layout ? (layoutStats.plots || layout.plots || {}) : {};
  const location = layout
    ? [layout.city, layout.district, layout.state].filter(Boolean).join(", ")
    : "";

  const gisSummary = useMemo(
    () => (layout ? getLayoutGisSummary(layout, layoutRecord, plots) : { hasGisData: false, plots: 0 }),
    [layout, layoutRecord, plots]
  );

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

  const openWorkspace = () => navigate(`/dashboard/layouts/${layout.id}/workspace`);
  const openGenerate = () => navigate(`/dashboard/layouts/${layout.id}/workspace?generate=1`);

  const handleExportGis = () => {
    try {
      const result = LayoutExcelExporter.exportLayout(layout.id, venture);
      toast.success(`Exported GIS workbook — ${result.counts.plots} plots to ${result.filename}`);
    } catch (err) {
      toast.error(err.message || "Nothing to export yet — import or generate township data first");
    }
  };

  const handleDelete = () => {
    removeLayout(layout.id);
    toast.success(`${layout.name} deleted`);
    navigate("/dashboard/layouts/list");
  };

  const handleQuickAction = (actionId) => {
    if (actionId === "open-workspace") openWorkspace();
    else if (actionId === "import-gis") setImportOpen(true);
    else if (actionId === "generate-township") openGenerate();
    else if (actionId === "manage-plots") setTab("plots");
    else if (actionId === "export-gis") handleExportGis();
    else if (actionId === "documents") setTab("documents");
    else if (actionId === "analytics") setTab("analytics");
  };

  const heroImageUrl = getLayoutHeroImageUrl(layout);
  const layoutPlanSrc = getLayoutPlanSrc(layout);
  const safeHeroImageUrl = heroImageFailed ? '' : heroImageUrl;

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return (
          <LayoutDashboardPanels
            layout={layout}
            venture={venture}
            location={location}
            gisSummary={gisSummary}
            plots={plots}
            onImport={() => setImportOpen(true)}
            onGenerate={openGenerate}
          />
        );
      case "plan":
        return (
          <LayoutPlanViewer src={layoutPlanSrc} title={`${layout.name} — Layout Plan`} />
        );
      case "plots":
        return (
          <EmptyState
            icon={<FiGrid />}
            title={LAYOUT_LABELS.managePlots}
            description={`${plots.total || 0} plots registered for this layout. Open the workspace to manage plot inventory and bookings.`}
            action={
              <Button variant="accent" size="md" onClick={openWorkspace}>
                <FiMap /> {LAYOUT_LABELS.openWorkspace}
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

      <section className="layout-hero layout-hero--dashboard">
        <div className="layout-hero__banner">
          {safeHeroImageUrl ? (
            <img
              src={safeHeroImageUrl}
              alt={layout.name}
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className="layout-hero__banner-placeholder" aria-hidden />
          )}
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
              {!gisSummary.hasGisData ? (
                <span className="layout-hero__gis-badge">Metadata only</span>
              ) : null}
            </div>
            <h1 className="layout-hero__title">{layout.name}</h1>
            <p className="layout-hero__meta">
              <span><FiMapPin /> {location || venture?.city || "—"}</span>
              <span><FiMaximize /> {formatArea(layout.totalArea)}</span>
              <span><FiGrid /> {gisSummary.plots || 0} plots</span>
            </p>
          </div>

          <div className="layout-hero__actions layout-hero__actions--grouped">
            <div className="layout-hero__actions-primary">
              <Button variant="accent" size="md" onClick={openWorkspace}>
                <FiMap /> {LAYOUT_LABELS.openWorkspace}
              </Button>
              <Button variant="accent" size="md" onClick={() => setImportOpen(true)}>
                <FiUploadCloud /> {LAYOUT_LABELS.importGisWorkbook}
              </Button>
            </div>
            <div className="layout-hero__actions-secondary">
              <Button variant="soft" size="md" onClick={openGenerate}>
                <FiGrid /> {LAYOUT_LABELS.generateTownship}
              </Button>
              <Button variant="soft" size="md" onClick={() => setTab("plots")}>
                <FiGrid /> {LAYOUT_LABELS.managePlots}
              </Button>
              <Button variant="ghost" size="md" onClick={handleExportGis}>
                <FiDownload /> {LAYOUT_LABELS.exportGisWorkbook}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setTab("documents")}>
                <FiFileText /> {LAYOUT_LABELS.documents}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setTab("analytics")}>
                <FiBarChart2 /> {LAYOUT_LABELS.analytics}
              </Button>
              <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/layouts/${layout.id}/edit`)}>
                <FiEdit2 /> {LAYOUT_LABELS.editLayout}
              </Button>
            </div>
            <div className="layout-hero__actions-danger">
              <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
                <FiTrash2 /> {LAYOUT_LABELS.deleteLayout}
              </Button>
            </div>
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
          onAction={handleQuickAction}
        />
      </div>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Layout?"
        message="This removes layout metadata. GIS data linked to this layout may also become inaccessible."
        highlight={layout.name}
        confirmLabel="Delete"
        tone="danger"
      />

      <ImportLayoutWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        layout={layout}
        venture={venture}
        onOpenWorkspace={openWorkspace}
        onImportComplete={() => {
          toast.success("Township imported successfully — open workspace to view on map.");
        }}
      />
    </motion.div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiMaximize,
  FiCompass,
  FiDollarSign,
  FiUser,
  FiCreditCard,
  FiActivity,
  FiHome,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/ui/button/Button";
import SummaryCard from "../../components/cards/SummaryCard";
import InfoCard from "../../components/cards/InfoCard";
import Tabs from "../../components/navigation/Tabs";
import Upload from "../../components/ui/upload/Upload";
import RightDrawer from "../../components/drawer/RightDrawer";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import PlotStatusBadge from "../../components/plots/PlotStatusBadge";
import PlotQuickActions from "../../components/plots/PlotQuickActions";
import PlotPricingCard from "../../components/plots/PlotPricingCard";
import PlotHistory from "../../components/plots/PlotHistory";
import PlotTimeline from "../../components/plots/PlotTimeline";
import PlotMapCard from "../../components/plots/PlotMapCard";
import PlotAssignment from "../../components/plots/PlotAssignment";
import { usePlots } from "../../context/PlotsContext";
import { usePartnerAssignments } from "../../context/PartnerAssignmentsContext";
import { PlotReservationPanel } from "../../components/reservation/ReservationCrossDomain";
import {
  AssignedPartnerCard,
  EntityRelationshipSummary,
} from "../../components/erp/RelationshipCards";
import { useToast } from "../../components/feedback/Toast";
import { formatINR } from "./constants";
import "./plotInventory.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "pricing", label: "Pricing", icon: <FiDollarSign /> },
  { id: "history", label: "History", icon: <FiClock /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
];

const DOC_SLOTS = [
  { key: "agreement", label: "Sale Agreement" },
  { key: "registration", label: "Registration" },
  { key: "approval", label: "Approval Copy" },
  { key: "siteImages", label: "Site Images" },
];

export default function PlotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getPlotRelationships } = usePartnerAssignments();
  const [searchParams] = useSearchParams();
  const {
    getPlot,
    reservePlot,
    bookPlot,
    sellPlot,
    blockPlot,
    releasePlot,
    assignPlot,
    removePlot,
  } = usePlots();

  // Read model: Layout + Venture fields inherited via resolvePlotView in usePlots.
  const plot = getPlot(id);
  const { booking, customer, partner } = getPlotRelationships(id);

  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [docs, setDocs] = useState({});

  if (!plot) {
    return (
      <EmptyState
        title="Plot not found"
        description="This plot may have been removed or the link is invalid."
        action={
          <Button variant="accent" size="md" to="/dashboard/plots/list">
            <FiArrowLeft /> Back to Inventory
          </Button>
        }
      />
    );
  }

  const handleAction = (action) => {
    switch (action) {
      case "reserve":
        reservePlot(plot.id);
        toast.success(`${plot.plotNumber} reserved`);
        break;
      case "book":
        bookPlot(plot.id);
        toast.success(`${plot.plotNumber} booked`);
        break;
      case "sell":
        sellPlot(plot.id);
        toast.success(`${plot.plotNumber} marked as sold`);
        break;
      case "block":
        blockPlot(plot.id);
        toast.warning(`${plot.plotNumber} blocked`);
        break;
      case "release":
        releasePlot(plot.id);
        toast.success(`${plot.plotNumber} released`);
        break;
      case "assign":
        setAssignOpen(true);
        break;
      case "edit":
        navigate(`/dashboard/plots/${plot.id}/edit`);
        break;
      case "history":
        setTab("history");
        break;
      case "plan":
        navigate(`/dashboard/layouts/${plot.layoutId}?tab=plan`);
        break;
      default:
        break;
    }
  };

  const saveAssignment = () => {
    if (assignment) {
      assignPlot(plot.id, assignment);
      toast.success("Assignment updated");
    }
    setAssignOpen(false);
  };

  const renderTab = () => {
    switch (tab) {
      case "overview":
        return (
          <>
            <AssignedPartnerCard partner={partner?.partner} assignedDate={partner?.assignedDate} />
            <EntityRelationshipSummary
              items={[
                {
                  key: "status",
                  label: "Booking Status",
                  value: plot.status,
                },
                booking && {
                  key: "booking",
                  label: "Booking",
                  value: booking.bookingNumber,
                  to: `/dashboard/property-bookings/${booking.id}`,
                },
                customer && {
                  key: "customer",
                  label: "Customer",
                  value: customer.name,
                  to: `/dashboard/customers/${customer.id}`,
                },
              ].filter(Boolean)}
            />
            <InfoCard
              title="Property Information"
              items={[
                { label: "Venture", value: plot.ventureName },
                { label: "Layout", value: plot.layoutName },
                { label: "Plot Number", value: plot.plotNumber },
                { label: "Dimensions", value: plot.dimensions },
                { label: "Area", value: `${plot.areaSqYards} sq.yd` },
                { label: "Facing", value: plot.facing },
                { label: "Road Width", value: plot.roadWidth },
                { label: "Corner Plot", value: plot.corner ? "Yes" : "No" },
              ]}
            />
            <PlotMapCard plot={plot} />
            {plot.notes && (
              <div className="plot-details__notes">
                <h4>Notes</h4>
                <p>{plot.notes}</p>
              </div>
            )}
          </>
        );
      case "pricing":
        return <PlotPricingCard plot={plot} />;
      case "history":
        return <PlotHistory history={plot.history} />;
      case "documents":
        return (
          <div className="plot-details__docs">
            {DOC_SLOTS.map((slot) => (
              <Upload
                key={slot.key}
                label={slot.label}
                accept={slot.key === "siteImages" ? "image/*" : "image/*,.pdf"}
                multiple={slot.key === "siteImages"}
                value={docs[slot.key]}
                onChange={(v) => setDocs((d) => ({ ...d, [slot.key]: v }))}
                variant={slot.key === "siteImages" ? "image" : "file"}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="plot-page plot-details-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Breadcrumb
        items={[
          { label: "Ventures", to: "/dashboard/ventures/list" },
          { label: plot.ventureName, to: `/dashboard/ventures/${plot.ventureId}` },
          { label: "Layouts", to: "/dashboard/layouts/list" },
          { label: plot.layoutName, to: `/dashboard/layouts/${plot.layoutId}` },
          { label: `Plot ${plot.plotNumber}` },
        ]}
      />

      <section className="plot-details__header">
        <div className="plot-details__header-main">
          <div className="plot-details__title-row">
            <h1>Plot {plot.plotNumber}</h1>
            <PlotStatusBadge status={plot.status} />
          </div>
          <p className="plot-details__subtitle">
            {plot.layoutName} · {plot.ventureName} · {plot.city}
          </p>
        </div>
        <div className="plot-details__header-actions">
          {plot.status === "Available" && (
            <Button variant="soft" size="md" onClick={() => handleAction("reserve")}>
              Reserve
            </Button>
          )}
          {["Available", "Reserved"].includes(plot.status) && (
            <Button variant="accent" size="md" onClick={() => handleAction("book")}>
              Book Plot
            </Button>
          )}
          {plot.status === "Booked" && (
            <Button variant="accent" size="md" onClick={() => handleAction("sell")}>
              Mark as Sold
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={() => handleAction("edit")}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      </section>

      <div className="plot-details__overview">
        <SummaryCard icon={<FiMaximize />} label="Area" value={`${plot.areaSqYards} sq.yd`} tone="accent" />
        <SummaryCard icon={<FiCompass />} label="Facing" value={plot.facing} tone="info" />
        <SummaryCard icon={<FiDollarSign />} label="Final Price" value={formatINR(plot.finalPrice)} tone="success" />
        <SummaryCard icon={<FiActivity />} label="Status" value={plot.status} tone="warning" />
        <SummaryCard icon={<FiUser />} label="Customer" value={plot.customer || "—"} tone="violet" />
        <SummaryCard icon={<FiCreditCard />} label="Base Price" value={formatINR(plot.totalPrice)} tone="primary" />
      </div>

      <div className="plot-details__layout">
        <div className="plot-details__main">
          <Tabs tabs={TABS} active={tab} onChange={setTab} layoutId="plot-tabs" />
          <motion.div
            key={tab}
            className="plot-details__tab-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </div>

        <aside className="plot-details__sidebar">
          <PlotQuickActions plot={plot} onAction={handleAction} />
          {booking && (
            <InfoCard title="Active Booking">
              <Link to={`/dashboard/property-bookings/${booking.id}`} className="erp-rel-list__link">
                <span>{booking.bookingNumber}</span>
                <strong>{booking.status}</strong>
              </Link>
            </InfoCard>
          )}
          <PlotReservationPanel plotId={plot.id} />
          <div className="plot-details__lifecycle">
            <h3>Lifecycle</h3>
            <PlotTimeline plot={plot} />
          </div>
        </aside>
      </div>

      <RightDrawer
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Assign Plot ${plot.plotNumber}`}
        subtitle="Customer, sales team & reservation"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" onClick={saveAssignment}>
              Save Assignment
            </Button>
          </>
        }
      >
        <PlotAssignment plot={plot} onChange={setAssignment} />
      </RightDrawer>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          removePlot(plot.id);
          toast.success(`${plot.plotNumber} deleted`);
          navigate("/dashboard/plots/list");
        }}
        title="Delete Plot?"
        message="This action cannot be undone."
        highlight={plot.plotNumber}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

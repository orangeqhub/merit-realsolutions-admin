import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../../../components/layout/PageHeader";
import Select from "../../../components/ui/select/Select";
import LayoutPlanViewer from "../../../components/layouts/LayoutPlanViewer";
import ReservationDrawer from "../../../components/reservation/ReservationDrawer";
import { useReservations } from "../../../context/ReservationContext";
import { usePlots } from "../../../shared/hooks/usePlots.js";
import { useToast } from "../../../components/feedback/Toast";
import { assignPlotGridPositions } from "../../../services/reservation/reservationService";
import "../../../components/reservation/reservation.css";

const STEPS = ["Venture", "Layout", "Interactive Layout", "Plot", "Reservation"];

function mapPlotStatus(status) {
  const map = {
    Available: "available",
    Reserved: "reserved",
    Booked: "booked",
    Sold: "sold",
    Blocked: "blocked",
    Cancelled: "cancelled",
  };
  return map[status] || "available";
}

export default function InteractiveReservation() {
  const toast = useToast();
  const {
    ventures,
    layouts,
    plots,
    customers,
    createReservation,
    computeMinimumAmount,
    getActiveForPlot,
  } = useReservations();
  const { reservePlot } = usePlots();

  const [ventureId, setVentureId] = useState(ventures[0]?.id || "");
  const [layoutId, setLayoutId] = useState("");
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const venture = ventures.find((v) => v.id === ventureId);
  const layoutOptions = useMemo(
    () => layouts.filter((l) => l.ventureId === ventureId),
    [layouts, ventureId]
  );
  const activeLayoutId = layoutId || layoutOptions[0]?.id || "";
  const layout = layouts.find((l) => l.id === activeLayoutId);

  const plotsForLayout = useMemo(
    () => plots.filter((p) => p.layoutId === activeLayoutId),
    [plots, activeLayoutId]
  );

  const hotspotPlots = useMemo(
    () =>
      assignPlotGridPositions(
        plotsForLayout.map((plot) => ({
          ...plot,
          status: getActiveForPlot(plot.id) ? "reserved" : mapPlotStatus(plot.status),
        }))
      ),
    [plotsForLayout, getActiveForPlot]
  );

  const currentStep = selectedPlot ? 4 : layout ? 2 : venture ? 0 : 0;

  const handleVentureChange = (id) => {
    setVentureId(id);
    const firstLayout = layouts.find((l) => l.ventureId === id);
    setLayoutId(firstLayout?.id || "");
    setSelectedPlot(null);
  };

  const handleLayoutChange = (id) => {
    setLayoutId(id);
    setSelectedPlot(null);
  };

  const handlePlotClick = (hotspot) => {
    const plot = hotspot.plot || plotsForLayout.find((p) => p.id === hotspot.id);
    if (!plot) return;
    if (!["Available", "Reserved"].includes(plot.status) && !getActiveForPlot(plot.id)) {
      toast.warning(`Plot ${plot.plotNumber} is ${plot.status} and cannot be reserved`);
      return;
    }
    if (plot.status !== "Available") {
      toast.info(`Plot ${plot.plotNumber} is already reserved`);
    }
    setSelectedPlot(plot);
    setDrawerOpen(true);
  };

  const handleSubmit = (payload) => {
    const result = createReservation(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    reservePlot(payload.plotId, {
      customer: result.reservation.customerName,
      customerId: result.reservation.customerId,
      reservationExpiry: result.reservation.expiryDate,
    });
    toast.success(`Reservation ${result.reservation.reference} created. Inventory locked.`);
  };

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Interactive Reservation"
        description="Select venture, layout, and plot on the interactive plan. Reserve inventory with minimum payment — same workflow powers the public website."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Interactive Reservation" },
        ]}
      />

      <div className="rsv-interactive-steps">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`rsv-step ${i < currentStep ? "is-done" : ""} ${i === currentStep ? "is-active" : ""}`.trim()}
          >
            {i + 1}. {step}
          </span>
        ))}
      </div>

      <motion.section
        className="rsv-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rsv-list-filters">
          <Select
            label="Venture"
            value={ventureId}
            onChange={(e) => handleVentureChange(e.target.value)}
            options={ventures.map((v) => ({ value: v.id, label: v.name }))}
          />
          <Select
            label="Layout"
            value={activeLayoutId}
            onChange={(e) => handleLayoutChange(e.target.value)}
            options={layoutOptions.map((l) => ({ value: l.id, label: l.name }))}
          />
        </div>

        {layout && (
          <LayoutPlanViewer
            src={layout.layoutPlan}
            title={layout.name}
            plots={hotspotPlots}
            onPlotClick={handlePlotClick}
          />
        )}

        <div className="rsv-legend">
          <span className="rsv-legend__item"><span className="rsv-legend__swatch rsv-legend__swatch--available" /> Available</span>
          <span className="rsv-legend__item"><span className="rsv-legend__swatch rsv-legend__swatch--reserved" /> Reserved</span>
          <span className="rsv-legend__item"><span className="rsv-legend__swatch rsv-legend__swatch--booked" /> Booked</span>
          <span className="rsv-legend__item"><span className="rsv-legend__swatch rsv-legend__swatch--sold" /> Sold</span>
        </div>
      </motion.section>

      <ReservationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        plot={selectedPlot}
        layout={layout}
        venture={venture}
        customers={customers}
        minimumAmount={
          selectedPlot
            ? computeMinimumAmount(selectedPlot.finalPrice || selectedPlot.totalPrice)
            : 0
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}

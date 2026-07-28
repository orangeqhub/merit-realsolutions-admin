import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import LayoutPlanViewer from "../../../components/layouts/LayoutPlanViewer";
import DataTable from "../../../components/table/DataTable";
import Checkbox from "../../../components/ui/checkbox/Checkbox";
import Button from "../../../components/ui/button/Button";
import { useLayouts } from "../../../shared/hooks/useLayouts.js";
import { usePlots } from "../../../shared/hooks/usePlots.js";
import { useReservations } from "../../../context/ReservationContext";
import { assignPlotGridPositions } from "../../../services/reservation/reservationService";
import { WorkspaceKPIStrip, computeWorkspaceMetrics } from "../../../features/plot-map/workspace";
import PlotReservationDrawer from "./PlotReservationDrawer";
import "../../../components/reservation/reservation.css";
import "../../../features/plot-map/workspace/workspace-premium.css";
import "./interactivePlots.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Available", label: "Available" },
  { value: "Reserved", label: "Reserved" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Registered", label: "Registered" },
  { value: "Sold", label: "Sold" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Blocked", label: "Blocked" },
];

const FACING_OPTIONS = [
  { value: "", label: "All Facing" },
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
].map((x) => (typeof x === "string" ? { value: x, label: x } : x));

function effectivePlotStatus(plot, reservation) {
  if (reservation?.status === "Confirmed") return "Confirmed";
  if (reservation?.status === "Registered") return "Registered";
  if (reservation?.status === "Completed") return "Sold";
  if (reservation?.status === "Reserved") return "Reserved";
  if (reservation?.status === "Cancelled") return "Cancelled";
  if (reservation?.status === "Released") return "Available";
  return plot.status;
}

function statusToHotspot(status) {
  const map = {
    Available: "available",
    Reserved: "reserved",
    Confirmed: "confirmed",
    Registered: "registered",
    Sold: "sold",
    Booked: "confirmed",
    Blocked: "blocked",
    Cancelled: "cancelled",
  };
  return map[status] || "available";
}

export default function InteractivePlotReservationWorkspace({ venture }) {
  const { getByVenture } = useLayouts();
  const { getByLayout } = usePlots();
  const { getActiveForPlot } = useReservations();

  const layouts = useMemo(() => getByVenture(venture.id), [getByVenture, venture.id]);
  const [layoutId, setLayoutId] = useState(layouts[0]?.id || "");

  const activeLayout = layouts.find((l) => l.id === layoutId) || layouts[0] || null;

  const rawPlots = useMemo(() => (activeLayout ? getByLayout(activeLayout.id) : []), [getByLayout, activeLayout]);

  const plots = useMemo(
    () =>
      rawPlots.map((p) => {
        const r = getActiveForPlot(p.id);
        const s = effectivePlotStatus(p, r);
        return { ...p, effectiveStatus: s, reservation: r };
      }),
    [rawPlots, getActiveForPlot]
  );

  const kpis = useMemo(() => {
    const total = plots.length;
    const count = (s) => plots.filter((p) => p.effectiveStatus === s).length;
    return {
      total,
      available: count("Available"),
      reserved: count("Reserved"),
      confirmed: count("Confirmed"),
      registered: count("Registered"),
      sold: count("Sold"),
      cancelled: count("Cancelled"),
    };
  }, [plots]);

  const workspaceMetrics = useMemo(() => {
    const normalized = plots.map((p) => {
      const statusMap = {
        Confirmed: "Booked",
        Registered: "Sold",
        Cancelled: "Blocked",
      };
      return {
        ...p,
        status: statusMap[p.effectiveStatus] || p.effectiveStatus || p.status,
      };
    });
    return computeWorkspaceMetrics(normalized);
  }, [plots]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [facing, setFacing] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const amin = Number(areaMin) || 0;
    const amax = Number(areaMax) || 0;
    const pmin = Number(priceMin) || 0;
    const pmax = Number(priceMax) || 0;

    return plots.filter((p) => {
      if (status && p.effectiveStatus !== status) return false;
      if (facing && p.facing !== facing) return false;
      if (q && !String(p.plotNumber).toLowerCase().includes(q)) return false;
      if (amin && Number(p.areaSqYards) < amin) return false;
      if (amax && Number(p.areaSqYards) > amax) return false;
      const price = Number(p.finalPrice || p.totalPrice || 0);
      if (pmin && price < pmin) return false;
      if (pmax && price > pmax) return false;
      return true;
    });
  }, [plots, search, status, facing, areaMin, areaMax, priceMin, priceMax]);

  const hotspots = useMemo(() => {
    const positioned = assignPlotGridPositions(
      filtered.map((p) => ({
        ...p,
        status: statusToHotspot(p.effectiveStatus),
        number: p.plotNumber,
        title: [
          `Plot ${p.plotNumber}`,
          `${p.areaSqYards} sq.yd`,
          p.facing,
          `₹${Number(p.finalPrice || p.totalPrice || 0).toLocaleString("en-IN")}`,
          p.effectiveStatus,
          p.reservation?.partnerName ? `Partner: ${p.reservation.partnerName}` : null,
          p.reservation?.customerName ? `Customer: ${p.reservation.customerName}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      }))
    );
    return positioned;
  }, [filtered]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || null;

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const isAllSelected = filtered.length > 0 && filtered.every((p) => selected[p.id]);
  const isSomeSelected = filtered.some((p) => selected[p.id]);

  const layoutCards = useMemo(() => {
    return layouts.map((l) => {
      const lp = getByLayout(l.id).map((p) => {
        const r = getActiveForPlot(p.id);
        return { ...p, effectiveStatus: effectivePlotStatus(p, r) };
      });
      const total = lp.length;
      const available = lp.filter((p) => p.effectiveStatus === "Available").length;
      const reserved = lp.filter((p) => p.effectiveStatus === "Reserved").length;
      const sold = lp.filter((p) => p.effectiveStatus === "Sold").length;
      return { layout: l, total, available, reserved, sold };
    });
  }, [layouts, getByLayout, getActiveForPlot]);

  const columns = useMemo(
    () => [
      {
        key: "__select__",
        header: (
          <Checkbox
            checked={isAllSelected}
            indeterminate={!isAllSelected && isSomeSelected}
            onChange={(checked) => {
              if (!checked) return setSelected({});
              const next = {};
              filtered.forEach((p) => {
                next[p.id] = true;
              });
              setSelected(next);
            }}
          />
        ),
        render: (row) => (
          <Checkbox
            checked={Boolean(selected[row.id])}
            onChange={(checked) => setSelected((prev) => ({ ...prev, [row.id]: checked }))}
          />
        ),
      },
      { key: "plotNumber", header: "Plot", sortable: true },
      { key: "areaSqYards", header: "Area", sortable: true, render: (r) => `${r.areaSqYards} sq.yd` },
      { key: "facing", header: "Facing", sortable: true },
      { key: "effectiveStatus", header: "Status", sortable: true, render: (r) => <span className={`rsv-status rsv-status--${r.effectiveStatus.toLowerCase()}`}>{r.effectiveStatus}</span> },
      {
        key: "__actions__",
        header: "Actions",
        render: (r) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPlotId(r.id);
              setDrawerOpen(true);
            }}
          >
            Open
          </Button>
        ),
      },
    ],
    [filtered, isAllSelected, isSomeSelected, selected]
  );

  return (
    <div className="v-plotws ws-premium">
      <WorkspaceKPIStrip metrics={workspaceMetrics} />
      <p className="v-plotws__kpi-note" aria-live="polite">
        {kpis.confirmed} confirmed · {kpis.registered} registered · {kpis.cancelled} cancelled
      </p>

      <section className="v-plotws__panel">
        <header className="v-plotws__panel-head">
          <div>
            <h3>Layout Selector</h3>
            <p>Select a layout to load its interactive plot workspace.</p>
          </div>
        </header>
        <div className="v-plotws__layout-cards">
          {layoutCards.map((c) => (
            <div
              key={c.layout.id}
              className={`v-plotws__layout-card ${c.layout.id === activeLayout?.id ? "is-active" : ""}`.trim()}
              onClick={() => setLayoutId(c.layout.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLayoutId(c.layout.id)}
            >
              <strong>{c.layout.name}</strong>
              <span>{c.total} Plots</span>
              <div className="v-plotws__layout-metrics">
                <div className="v-plotws__metric"><span>Available</span><strong>{c.available}</strong></div>
                <div className="v-plotws__metric"><span>Reserved</span><strong>{c.reserved}</strong></div>
                <div className="v-plotws__metric"><span>Sold</span><strong>{c.sold}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="v-plotws__panel">
        <header className="v-plotws__panel-head">
          <div>
            <h3>Interactive Plot Layout</h3>
            <p>Click any plot to open the Reservation Drawer. Use filters to isolate inventory quickly.</p>
          </div>
        </header>

        <div className="v-plotws__filters">
          <Input
            label="Search Plot"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. D-001"
            icon={<FiSearch />}
          />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
          <Select label="Facing" value={facing} onChange={(e) => setFacing(e.target.value)} options={FACING_OPTIONS} />
          <Input label="Area Min" type="number" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} placeholder="sq.yd" />
          <Input label="Area Max" type="number" value={areaMax} onChange={(e) => setAreaMax(e.target.value)} placeholder="sq.yd" />
          <Input label="Price Min" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="₹" />
          <Input label="Price Max" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="₹" />
        </div>

        <div className="v-plotws__main v-plotws__main--spaced">
          <motion.div className="v-plotws__map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {activeLayout && (
              <LayoutPlanViewer
                src={activeLayout.layoutPlan}
                title={activeLayout.name}
                plots={hotspots}
                onPlotClick={(hotspot) => {
                  setSelectedPlotId(hotspot.id);
                  setDrawerOpen(true);
                }}
              />
            )}

            <div className="v-plotws__legend">
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--available" /> Available</span>
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--reserved" /> Reserved</span>
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--confirmed" /> Confirmed</span>
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--registered" /> Registered</span>
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--sold" /> Sold</span>
              <span className="v-plotws__legend-item"><span className="v-plotws__swatch v-plotws__swatch--blocked" /> Blocked</span>
            </div>

            <p className="v-plotws__helper">
              Hover plots for quick details (title tooltip). Reservation countdown and timeline are visible inside the drawer.
            </p>
          </motion.div>

          <div className="v-plotws__bulk">
            <div className="v-plotws__panel-head">
              <div>
                <h3>Bulk Operations</h3>
                <p>Select multiple plots to run batch actions.</p>
              </div>
            </div>
            {selectedIds.length > 0 ? (
              <div className="rsv-proc__bulkbar">
                <div>
                  <strong>{selectedIds.length} selected</strong>
                  <div className="rsv-timeline__meta">Assign Partner / Mark Blocked / Export / Print (placeholders)</div>
                </div>
                <div className="rsv-proc__actions">
                  <Button variant="ghost" size="sm">Assign Partner</Button>
                  <Button variant="ghost" size="sm">Mark Blocked</Button>
                  <Button variant="ghost" size="sm">Export</Button>
                  <Button variant="ghost" size="sm">Print</Button>
                </div>
              </div>
            ) : (
              <p className="v-plotws__helper">No plots selected.</p>
            )}

            <div className="v-plotws__table-wrap">
              <DataTable
                columns={columns}
                data={filtered}
                rowKey="id"
                defaultPageSize={10}
                onRowClick={(row) => {
                  setSelectedPlotId(row.id);
                  setDrawerOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <PlotReservationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        venture={venture}
        layout={activeLayout}
        plot={selectedPlot}
      />
    </div>
  );
}


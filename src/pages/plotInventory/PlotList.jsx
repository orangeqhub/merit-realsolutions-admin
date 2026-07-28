import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiUploadCloud,
  FiBarChart2,
  FiGrid,
  FiList,
  FiMap,
  FiEye,
  FiEdit2,
  FiBookmark,
  FiCheckSquare,
  FiLock,
  FiRotateCcw,
  FiClock,
  FiTrash2,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Pills from "../../components/navigation/Pills";
import Dropdown from "../../components/ui/dropdown/Dropdown";
import DataTable from "../../components/table/DataTable";
import EmptyState from "../../components/layout/EmptyState";
import ConfirmationModal from "../../components/modal/ConfirmationModal";
import PlotStatistics from "../../components/plots/PlotStatistics";
import PlotFilters from "../../components/plots/PlotFilters";
import PlotStatusBadge from "../../components/plots/PlotStatusBadge";
import PlotCard from "../../components/plots/PlotCard";
import MapWorkspace from "../../features/plot-map/MapWorkspace";
import { useLayouts } from "../../context/LayoutsContext";
import { useVentures } from "../../context/VenturesContext";
import { usePlots } from "../../context/PlotsContext";
import { useToast } from "../../components/feedback/Toast";
import { formatINR, formatRate } from "./constants";
import "../../features/plot-map/styles/plot-map.css";
import "./plotInventory.css";

const EMPTY_FILTERS = {
  search: "",
  venture: "",
  layout: "",
  facing: "",
  status: "",
  area: "",
  price: "",
  agent: "",
  sort: "newest",
};

const inRange = (value, range) => {
  if (!range) return true;
  const [min, max] = range.split("-").map(Number);
  return value >= min && value <= max;
};

export default function PlotList() {
  const navigate = useNavigate();
  const toast = useToast();
  const { plots, reservePlot, bookPlot, blockPlot, releasePlot, removePlot } = usePlots();
  const { layouts, getLayoutRecord } = useLayouts();
  const { getVenture } = useVentures();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState("table");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Map engines need the persisted layout record (not Venture-merged view).
  const mapLayout = useMemo(() => {
    if (!filters.layout) return null;
    const match = layouts.find((l) => l.name === filters.layout);
    if (!match) return null;
    return getLayoutRecord(match.id) || match;
  }, [filters.layout, layouts, getLayoutRecord]);

  const mapVenture = useMemo(
    () => (mapLayout ? getVenture(mapLayout.ventureId) : null),
    [getVenture, mapLayout]
  );

  const ventures = useMemo(
    () => [...new Set(plots.map((p) => p.ventureName).filter(Boolean))].sort(),
    [plots]
  );
  const layoutOptions = useMemo(() => {
    const pool = filters.venture
      ? plots.filter((p) => p.ventureName === filters.venture)
      : plots;
    return [...new Set(pool.map((p) => p.layoutName).filter(Boolean))].sort();
  }, [plots, filters.venture]);
  const agents = useMemo(
    () => [...new Set(plots.map((p) => p.agent).filter(Boolean))].sort(),
    [plots]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let result = plots.filter((p) => {
      const matchSearch =
        !q ||
        [p.plotNumber, p.layoutName, p.ventureName, p.customer, p.agent, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchVenture = !filters.venture || p.ventureName === filters.venture;
      const matchLayout = !filters.layout || p.layoutName === filters.layout;
      const matchFacing = !filters.facing || p.facing === filters.facing;
      const matchStatus = !filters.status || p.status === filters.status;
      const matchAgent = !filters.agent || p.agent === filters.agent;
      const matchArea = inRange(p.areaSqYards, filters.area);
      const matchPrice = inRange(p.finalPrice, filters.price);
      return (
        matchSearch && matchVenture && matchLayout && matchFacing &&
        matchStatus && matchAgent && matchArea && matchPrice
      );
    });

    result = [...result].sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return new Date(a.createdDate) - new Date(b.createdDate);
        case "priceLow":
          return a.finalPrice - b.finalPrice;
        case "priceHigh":
          return b.finalPrice - a.finalPrice;
        case "areaLow":
          return a.areaSqYards - b.areaSqYards;
        case "areaHigh":
          return b.areaSqYards - a.areaSqYards;
        default:
          return new Date(b.createdDate) - new Date(a.createdDate);
      }
    });
    return result;
  }, [plots, filters]);

  const hasFilters = useMemo(
    () =>
      filters.search ||
      filters.venture ||
      filters.layout ||
      filters.facing ||
      filters.status ||
      filters.area ||
      filters.price ||
      filters.agent,
    [filters]
  );

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  /** Central action handler — these are the booking entry points. */
  const handleAction = (plot, action) => {
    switch (action) {
      case "view":
        navigate(`/dashboard/plots/${plot.id}`);
        break;
      case "edit":
        navigate(`/dashboard/plots/${plot.id}/edit`);
        break;
      case "reserve":
        reservePlot(plot.id);
        toast.success(`${plot.plotNumber} reserved`);
        break;
      case "book":
        bookPlot(plot.id);
        toast.success(`${plot.plotNumber} booked`);
        break;
      case "block":
        blockPlot(plot.id);
        toast.warning(`${plot.plotNumber} blocked`);
        break;
      case "release":
        releasePlot(plot.id);
        toast.success(`${plot.plotNumber} released`);
        break;
      case "history":
        navigate(`/dashboard/plots/${plot.id}?tab=history`);
        break;
      case "delete":
        setDeleteTarget(plot);
        break;
      default:
        break;
    }
  };

  const buildMenu = (plot) => {
    const items = [
      { label: "View", icon: <FiEye />, onClick: () => handleAction(plot, "view") },
      { label: "Edit", icon: <FiEdit2 />, onClick: () => handleAction(plot, "edit") },
    ];
    if (plot.status === "Available")
      items.push({ label: "Reserve", icon: <FiBookmark />, onClick: () => handleAction(plot, "reserve") });
    if (["Available", "Reserved"].includes(plot.status))
      items.push({ label: "Book", icon: <FiCheckSquare />, onClick: () => handleAction(plot, "book") });
    if (!["Blocked", "Sold"].includes(plot.status))
      items.push({ label: "Block", icon: <FiLock />, onClick: () => handleAction(plot, "block") });
    if (plot.status !== "Available")
      items.push({ label: "Release", icon: <FiRotateCcw />, onClick: () => handleAction(plot, "release") });
    items.push({ label: "History", icon: <FiClock />, onClick: () => handleAction(plot, "history") });
    items.push({ label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => handleAction(plot, "delete") });
    return items;
  };

  const columns = [
    {
      key: "plotNumber",
      header: "Plot No.",
      sortable: true,
      render: (row) => <span className="plot-table__no">{row.plotNumber}</span>,
    },
    { key: "layoutName", header: "Layout", sortable: true, render: (row) => <span className="plot-table__muted">{row.layoutName}</span> },
    { key: "ventureName", header: "Venture", render: (row) => <span className="plot-table__muted">{row.ventureName}</span> },
    { key: "facing", header: "Facing" },
    { key: "dimensions", header: "Dimensions" },
    { key: "areaSqYards", header: "Area", align: "right", sortable: true, render: (row) => `${row.areaSqYards} sq.yd` },
    { key: "ratePerSqYard", header: "Rate", align: "right", sortable: true, render: (row) => formatRate(row.ratePerSqYard) },
    { key: "finalPrice", header: "Total Price", align: "right", sortable: true, render: (row) => <strong>{formatINR(row.finalPrice)}</strong> },
    { key: "status", header: "Status", render: (row) => <PlotStatusBadge status={row.status} size="sm" /> },
    { key: "customer", header: "Customer", render: (row) => row.customer || <span className="plot-table__dash">—</span> },
    { key: "agent", header: "Agent", render: (row) => row.agent || <span className="plot-table__dash">—</span> },
    { key: "lastUpdated", header: "Updated", sortable: true, render: (row) => <span className="plot-table__muted">{row.lastUpdated}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown items={buildMenu(row)} />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="plot-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Plot Inventory"
        description="Manage every plot across all ventures and layouts — availability, pricing, assignment and booking entry points."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/plots">
              <FiBarChart2 /> Dashboard
            </Button>
            <Button variant="ghost" size="md" to="/dashboard/plots/import">
              <FiUploadCloud /> Bulk Import
            </Button>
            <Button variant="accent" size="md" to="/dashboard/plots/new">
              <FiPlus /> Add Plot
            </Button>
          </>
        }
      />

      <PlotStatistics plots={plots} compact />

      <PlotFilters
        values={filters}
        onChange={setFilters}
        onReset={resetFilters}
        ventures={ventures}
        layouts={layoutOptions}
        agents={agents}
        hasFilters={Boolean(hasFilters)}
        resultCount={filtered.length}
      />

      <div className="plot-list__viewbar">
        <Pills
          items={[
            { id: "table", label: "Table", icon: <FiList /> },
            { id: "grid", label: "Grid", icon: <FiGrid /> },
            { id: "map", label: "Map", icon: <FiMap /> },
          ]}
          active={view}
          onChange={setView}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="No plots found"
          description={hasFilters ? "Try adjusting your filters." : "Add your first plot to get started."}
          action={
            hasFilters ? (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                <FiRotateCcw /> Reset Filters
              </Button>
            ) : (
              <Button variant="accent" size="md" to="/dashboard/plots/new">
                <FiPlus /> Add Plot
              </Button>
            )
          }
        />
      ) : view === "map" ? (
        mapLayout ? (
          <div className="plot-list-map-shell">
            <MapWorkspace layout={mapLayout} venture={mapVenture} />
          </div>
        ) : (
          <EmptyState
            title="Select a layout to open the map"
            description="Choose a layout from the filters above to view and manage plots on the satellite map."
          />
        )
      ) : view === "table" ? (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          defaultPageSize={25}
          pageSizeOptions={[25, 50, 100]}
          onRowClick={(row) => navigate(`/dashboard/plots/${row.id}`)}
        />
      ) : (
        <div className="plot-grid">
          {filtered.slice(0, 60).map((plot, i) => (
            <motion.div
              key={plot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
            >
              <PlotCard
                plot={plot}
                onView={(p) => handleAction(p, "view")}
                onEdit={(p) => handleAction(p, "edit")}
                onReserve={(p) => handleAction(p, "reserve")}
                onBook={(p) => handleAction(p, "book")}
              />
            </motion.div>
          ))}
          {filtered.length > 60 && (
            <p className="plot-grid__more">
              Showing first 60 of {filtered.length} plots. Use filters or the table view to see more.
            </p>
          )}
        </div>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          removePlot(deleteTarget.id);
          toast.success(`${deleteTarget.plotNumber} removed`);
          setDeleteTarget(null);
        }}
        title="Delete Plot?"
        message="This action cannot be undone. The plot will be permanently removed from inventory."
        highlight={deleteTarget?.plotNumber}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

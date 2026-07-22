import { useCallback, useMemo, useRef, useState } from 'react';
import { usePlots } from '../../../context/PlotsContext';
import { useCollection } from '../../../shared/hooks/useDataStore.js';
import { DEFAULT_PLOT_OVERLAY, MOCK_CUSTOMERS, MOCK_PARTNERS } from '../constants/mapStatus';
import { addDays } from '../utils/coordinates';

const EMPTY_FORM = {
  plotNumber: '',
  areaSqYards: '',
  facing: 'East',
  dimensions: '',
  ratePerSqYard: '',
  status: 'Available',
  mapWidth: DEFAULT_PLOT_OVERLAY.mapWidth,
  mapHeight: DEFAULT_PLOT_OVERLAY.mapHeight,
  rotation: DEFAULT_PLOT_OVERLAY.rotation,
};

export function usePlotMapState({ layout, venture }) {
  const plots = useCollection('plots');
  const { addPlot, updatePlot, reservePlot, sellPlot, removePlot } = usePlots();

  const layoutPlots = useMemo(
    () => plots.filter((p) => p.layoutId === layout?.id),
    [plots, layout?.id]
  );

  const [liveCoords, setLiveCoords] = useState(null);
  const [frozenCoords, setFrozenCoords] = useState(null);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const undoRef = useRef(null);

  const selectedPlot = useMemo(
    () => layoutPlots.find((p) => p.id === selectedPlotId) || null,
    [layoutPlots, selectedPlotId]
  );

  const filteredPlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return layoutPlots;
    return layoutPlots.filter((p) =>
      [p.plotNumber, p.id, p.facing, p.status, p.customer]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  const pushUndo = useCallback((action) => {
    undoRef.current = action;
  }, []);

  const handleMouseMove = useCallback((coords) => {
    setLiveCoords(coords);
  }, []);

  const handleMapClick = useCallback((coords) => {
    setFrozenCoords(coords);
    setSelectedPlotId(null);
    setDetailOpen(false);
    setForm({ ...EMPTY_FORM, plotNumber: `P-${String(layoutPlots.length + 1).padStart(3, '0')}` });
    setCreateOpen(true);
  }, [layoutPlots.length]);

  const handlePlotClick = useCallback((plot) => {
    setSelectedPlotId(plot.id);
    setFrozenCoords({ lat: plot.latitude, lng: plot.longitude });
    setCreateOpen(false);
    setDetailOpen(true);
  }, []);

  const closeDrawers = useCallback(() => {
    setCreateOpen(false);
    setDetailOpen(false);
    setFrozenCoords(null);
  }, []);

  const savePlot = useCallback(() => {
    if (!frozenCoords || !layout) return null;

    const customer =
      form.status === 'Available' || form.status === 'Blocked'
        ? ''
        : MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];

    const partner =
      form.status === 'Available' || form.status === 'Blocked'
        ? ''
        : MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)];

    const record = addPlot({
      plotNumber: form.plotNumber,
      layoutId: layout.id,
      ventureId: venture?.id || layout.ventureId,
      facing: form.facing,
      dimensions: form.dimensions,
      areaSqYards: Number(form.areaSqYards) || 0,
      ratePerSqYard: Number(form.ratePerSqYard) || 0,
      status: form.status,
      latitude: frozenCoords.lat,
      longitude: frozenCoords.lng,
      mapWidth: Number(form.mapWidth) || DEFAULT_PLOT_OVERLAY.mapWidth,
      mapHeight: Number(form.mapHeight) || DEFAULT_PLOT_OVERLAY.mapHeight,
      rotation: Number(form.rotation) || 0,
      customer: form.status === 'Reserved' || form.status === 'Booked' ? customer : '',
      agent: partner,
      reservationExpiry: form.status === 'Reserved' ? addDays(7) : '',
    });

    pushUndo({ type: 'delete', plotId: record.id });

    setCreateOpen(false);
    setFrozenCoords(null);
    setSelectedPlotId(record.id);
    setDetailOpen(true);
    return record;
  }, [addPlot, form, frozenCoords, layout, pushUndo, venture?.id]);

  const reserveSelected = useCallback(() => {
    if (!selectedPlot) return;
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before: { ...selectedPlot } });
    reservePlot(selectedPlot.id, {
      customer: MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)],
      agent: MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)],
      reservationExpiry: addDays(7),
    });
  }, [pushUndo, reservePlot, selectedPlot]);

  const purchaseSelected = useCallback(() => {
    if (!selectedPlot) return;
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before: { ...selectedPlot } });
    sellPlot(selectedPlot.id, {
      customer: selectedPlot.customer || MOCK_CUSTOMERS[0],
      agent: selectedPlot.agent || MOCK_PARTNERS[0],
      reservationExpiry: null,
    });
  }, [pushUndo, sellPlot, selectedPlot]);

  const scheduleVisit = useCallback(() => {
    if (!selectedPlot) return;
    updatePlot(selectedPlot.id, {
      notes: `${selectedPlot.notes || ''} Site visit scheduled (mock).`.trim(),
    });
  }, [selectedPlot, updatePlot]);

  const undo = useCallback(() => {
    const action = undoRef.current;
    if (!action) return;
    if (action.type === 'delete') {
      removePlot(action.plotId);
      setDetailOpen(false);
      setSelectedPlotId(null);
    }
    if (action.type === 'restore') {
      updatePlot(action.plotId, action.before);
    }
    undoRef.current = null;
  }, [removePlot, updatePlot]);

  return {
    layoutPlots,
    filteredPlots,
    liveCoords,
    frozenCoords,
    selectedPlot,
    createOpen,
    detailOpen,
    form,
    setForm,
    searchQuery,
    setSearchQuery,
    handleMouseMove,
    handleMapClick,
    handlePlotClick,
    closeDrawers,
    savePlot,
    reserveSelected,
    purchaseSelected,
    scheduleVisit,
    undo,
    setCreateOpen,
    setDetailOpen,
    setSelectedPlotId,
  };
}

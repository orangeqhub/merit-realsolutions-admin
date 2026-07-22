import { useCallback, useMemo, useRef, useState } from 'react';
import { usePlots } from '../../../context/PlotsContext';
import { useCollection } from '../../../shared/hooks/useDataStore.js';
import { dataStore } from '../../../shared/repositories/dataStore.js';
import {
  DEFAULT_PLOT_OVERLAY,
  MOCK_CUSTOMERS,
  MOCK_PARTNERS,
  SHAPE_TYPES,
} from '../constants/mapStatus';
import { addDays } from '../utils/coordinateUtils';
import { plotStorage } from '../services/plotStorage';

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
  shapeType: SHAPE_TYPES.RECTANGLE,
  polygonPoints: [],
};

function matchesSearch(plot, query) {
  const haystack = [
    plot.plotNumber,
    plot.areaSqYards,
    plot.facing,
    plot.status,
    plot.customer,
    plot.agent,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function usePlotWorkspace({ layout, venture }) {
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
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  const selectedPlot = useMemo(
    () => layoutPlots.find((p) => p.id === selectedPlotId) || null,
    [layoutPlots, selectedPlotId]
  );

  const filteredPlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return layoutPlots;
    return layoutPlots.filter((p) => matchesSearch(p, q));
  }, [layoutPlots, searchQuery]);

  const pushUndo = useCallback((action) => {
    undoStack.current.push(action);
    redoStack.current = [];
    bumpHistory();
  }, [bumpHistory]);

  const handleMouseMove = useCallback((coords) => {
    setLiveCoords(coords);
  }, []);

  const handleMapClick = useCallback(
    (coords) => {
      setFrozenCoords(coords);
      setSelectedPlotId(null);
      setDetailOpen(false);
      setEditOpen(false);
      setForm({
        ...EMPTY_FORM,
        plotNumber: `P-${String(layoutPlots.length + 1).padStart(3, '0')}`,
      });
      setCreateOpen(true);
    },
    [layoutPlots.length]
  );

  const handlePlotClick = useCallback((plot) => {
    setSelectedPlotId(plot.id);
    setFrozenCoords({ lat: plot.latitude, lng: plot.longitude });
    setCreateOpen(false);
    setEditOpen(false);
    setDetailOpen(true);
  }, []);

  const closeDrawers = useCallback(() => {
    setCreateOpen(false);
    setDetailOpen(false);
    setEditOpen(false);
    setFrozenCoords(null);
  }, []);

  const openEditPlot = useCallback(() => {
    if (!selectedPlot) return;
    setForm({
      plotNumber: selectedPlot.plotNumber || '',
      areaSqYards: selectedPlot.areaSqYards ?? '',
      facing: selectedPlot.facing || 'East',
      dimensions: selectedPlot.dimensions || '',
      ratePerSqYard: selectedPlot.ratePerSqYard ?? '',
      status: selectedPlot.status || 'Available',
      mapWidth: selectedPlot.mapWidth ?? DEFAULT_PLOT_OVERLAY.mapWidth,
      mapHeight: selectedPlot.mapHeight ?? DEFAULT_PLOT_OVERLAY.mapHeight,
      rotation: selectedPlot.rotation ?? 0,
      shapeType: selectedPlot.shapeType || SHAPE_TYPES.RECTANGLE,
      polygonPoints: selectedPlot.polygonPoints || [],
    });
    setFrozenCoords({ lat: selectedPlot.latitude, lng: selectedPlot.longitude });
    setDetailOpen(false);
    setEditOpen(true);
  }, [selectedPlot]);

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

    const payload = {
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
      shapeType: form.shapeType || SHAPE_TYPES.RECTANGLE,
      polygonPoints: form.polygonPoints || [],
      customer: form.status === 'Reserved' || form.status === 'Booked' ? customer : '',
      agent: partner,
      reservationExpiry: form.status === 'Reserved' ? addDays(7) : '',
    };

    let record;
    if (editOpen && selectedPlot) {
      const before = { ...selectedPlot };
      record = updatePlot(selectedPlot.id, payload);
      pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after: record });
    } else {
      record = addPlot(payload);
      pushUndo({ type: 'delete', plotId: record.id, after: record });
    }

    setCreateOpen(false);
    setEditOpen(false);
    setFrozenCoords(null);
    setSelectedPlotId(record.id);
    setDetailOpen(true);
    return record;
  }, [addPlot, editOpen, form, frozenCoords, layout, pushUndo, selectedPlot, updatePlot, venture?.id]);

  const reserveSelected = useCallback(() => {
    if (!selectedPlot) return;
    const before = { ...selectedPlot };
    const after = reservePlot(selectedPlot.id, {
      customer: MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)],
      agent: MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)],
      reservationExpiry: addDays(7),
    });
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after });
  }, [pushUndo, reservePlot, selectedPlot]);

  const purchaseSelected = useCallback(() => {
    if (!selectedPlot) return;
    const before = { ...selectedPlot };
    const after = sellPlot(selectedPlot.id, {
      customer: selectedPlot.customer || MOCK_CUSTOMERS[0],
      agent: selectedPlot.agent || MOCK_PARTNERS[0],
      reservationExpiry: null,
    });
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after });
  }, [pushUndo, sellPlot, selectedPlot]);

  const scheduleVisit = useCallback(() => {
    if (!selectedPlot) return;
    const before = { ...selectedPlot };
    const after = updatePlot(selectedPlot.id, {
      notes: `${selectedPlot.notes || ''} Site visit scheduled (mock).`.trim(),
    });
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after });
  }, [pushUndo, selectedPlot, updatePlot]);

  const applyUndoAction = useCallback(
    (action, direction) => {
      if (action.type === 'delete') {
        if (direction === 'undo') {
          removePlot(action.plotId);
        } else if (action.after) {
          dataStore.updateList('plots', (list) => [action.after, ...list]);
        }
      }
      if (action.type === 'restore') {
        const snapshot = direction === 'undo' ? action.before : action.after || action.before;
        updatePlot(action.plotId, snapshot);
      }
    },
    [removePlot, updatePlot]
  );

  const undo = useCallback(() => {
    const action = undoStack.current.pop();
    if (!action) return false;
    applyUndoAction(action, 'undo');
    redoStack.current.push(action);
    bumpHistory();
    if (action.plotId === selectedPlotId && action.type === 'delete') {
      setDetailOpen(false);
      setSelectedPlotId(null);
    }
    return true;
  }, [applyUndoAction, bumpHistory, selectedPlotId]);

  const redo = useCallback(() => {
    const action = redoStack.current.pop();
    if (!action) return false;
    applyUndoAction(action, 'redo');
    undoStack.current.push(action);
    bumpHistory();
    return true;
  }, [applyUndoAction, bumpHistory]);

  const saveLayoutMap = useCallback(() => {
    if (!layout?.id) return;
    plotStorage.persistLayoutSnapshot(layout.id, layoutPlots);
  }, [layout?.id, layoutPlots]);

  const canUndo = useMemo(() => undoStack.current.length > 0, [historyVersion]);
  const canRedo = useMemo(() => redoStack.current.length > 0, [historyVersion]);

  return {
    layoutPlots,
    filteredPlots,
    liveCoords,
    frozenCoords,
    selectedPlot,
    createOpen,
    detailOpen,
    editOpen,
    form,
    setForm,
    searchQuery,
    setSearchQuery,
    handleMouseMove,
    handleMapClick,
    handlePlotClick,
    closeDrawers,
    openEditPlot,
    savePlot,
    reserveSelected,
    purchaseSelected,
    scheduleVisit,
    undo,
    redo,
    canUndo,
    canRedo,
    historyVersion,
    saveLayoutMap,
    setCreateOpen,
    setDetailOpen,
    setSelectedPlotId,
  };
}

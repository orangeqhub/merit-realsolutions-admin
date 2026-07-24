import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePlots } from '../../../context/PlotsContext';
import { useCollection } from '../../../shared/hooks/useDataStore.js';
import { dataStore } from '../../../shared/repositories/dataStore.js';
import {
  MOCK_CUSTOMERS,
  MOCK_PARTNERS,
  SHAPE_TYPES,
} from '../constants/mapStatus';
import { addDays } from '../utils/coordinateUtils';
import { plotStorage } from '../services/plotStorage';
import {
  buildPreviewPlot,
  computeCentroid,
  EMPTY_CORNERS,
  parseAndValidateCorners,
} from '../utils/polygonUtils';
import {
  PlotInteractionService,
  PlotSearchService,
  PlotFilterService,
  PlotDrawerService,
} from '../services/plotInteraction';

const EMPTY_FORM = {
  plotNumber: '',
  corners: EMPTY_CORNERS.map((c) => ({ ...c })),
  areaSqYards: '',
  facing: 'East',
  ratePerSqYard: '',
  status: 'Available',
};

const EMPTY_EDIT_FORM = {
  plotNumber: '',
  areaSqYards: '',
  facing: 'East',
  ratePerSqYard: '',
  dimensions: '',
  status: 'Available',
  description: '',
};

function cornersFromPlot(plot) {
  const points = plot?.polygonPoints || [];
  const corners = EMPTY_CORNERS.map((empty, index) => {
    const pt = points[index];
    if (!pt) return { ...empty };
    return {
      lat: pt.lat ?? pt.latitude ?? '',
      lng: pt.lng ?? pt.longitude ?? '',
    };
  });
  return corners;
}

export function usePlotWorkspace({ layout, venture }) {
  const plots = useCollection('plots');
  const {
    addPlot,
    updatePlot,
    reservePlot,
    bookPlot,
    sellPlot,
    blockPlot,
    releasePlot,
    removePlot,
  } = usePlots();

  const layoutPlots = useMemo(
    () => plots.filter((p) => p.layoutId === layout?.id),
    [plots, layout?.id]
  );

  const [liveCoords, setLiveCoords] = useState(null);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [previewPlot, setPreviewPlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [highlightedPlotId, setHighlightedPlotId] = useState(null);
  const [focusPlotId, setFocusPlotId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistory = useCallback(() => setHistoryVersion((v) => v + 1), []);

  const selectedPlot = useMemo(
    () => layoutPlots.find((p) => p.id === selectedPlotId) || null,
    [layoutPlots, selectedPlotId]
  );

  const filteredPlots = useMemo(
    () =>
      PlotInteractionService.applyPlotFilters(layoutPlots, {
        searchQuery,
        activeStatuses: statusFilters,
      }),
    [layoutPlots, searchQuery, statusFilters]
  );

  const pushUndo = useCallback(
    (action) => {
      undoStack.current.push(action);
      redoStack.current = [];
      bumpHistory();
    },
    [bumpHistory]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setHighlightedPlotId(null);
      setFocusPlotId(null);
      return;
    }

    const match = PlotSearchService.findBestMatch(layoutPlots, q);
    if (match) {
      setSelectedPlotId(match.id);
      setDetailOpen(true);
      setHighlightedPlotId(match.id);
      setFocusPlotId(match.id);
      setFocusRequest((n) => n + 1);
    }
  }, [searchQuery, layoutPlots]);

  const focusSearchMatch = useCallback(() => {
    const match = PlotSearchService.findBestMatch(layoutPlots, searchQuery);
    if (!match) return null;
    setSelectedPlotId(match.id);
    setDetailOpen(true);
    setHighlightedPlotId(match.id);
    setFocusPlotId(match.id);
    setFocusRequest((n) => n + 1);
    return match;
  }, [layoutPlots, searchQuery]);

  const handleMouseMove = useCallback((coords) => {
    setLiveCoords(coords);
  }, []);

  const handlePlotHover = useCallback((plotId) => {
    setHoveredPlotId(plotId);
  }, []);

  const toggleStatusFilter = useCallback((status) => {
    setStatusFilters((prev) => PlotFilterService.toggleStatus(prev, status));
  }, []);

  const openAddPlot = useCallback(() => {
    setFormMode('create');
    setForm({
      ...EMPTY_FORM,
      corners: EMPTY_CORNERS.map((c) => ({ ...c })),
      plotNumber: `P-${String(layoutPlots.length + 1).padStart(3, '0')}`,
    });
    setPreviewPlot(null);
    setSelectedPlotId(null);
    setDetailOpen(false);
    setEditOpen(false);
    setFormOpen(true);
  }, [layoutPlots.length]);

  const handlePlotClick = useCallback((plot) => {
    setSelectedPlotId(plot.id);
    setFormOpen(false);
    setEditOpen(false);
    setPreviewPlot(null);
    setDetailOpen(true);
    setHighlightedPlotId(plot.id);
  }, []);

  const closeDrawers = useCallback(() => {
    setFormOpen(false);
    setDetailOpen(false);
    setEditOpen(false);
    setPreviewPlot(null);
  }, []);

  const closeFormDrawer = useCallback(() => {
    setFormOpen(false);
    setPreviewPlot(null);
  }, []);

  const closeEditDrawer = useCallback(() => {
    setEditOpen(false);
  }, []);

  const openEditPlot = useCallback(() => {
    if (!selectedPlot) return;
    setEditForm(PlotDrawerService.buildEditForm(selectedPlot));
    setDetailOpen(false);
    setEditOpen(true);
  }, [selectedPlot]);

  const openEditGeometry = useCallback(() => {
    if (!selectedPlot) return;
    setFormMode('edit');
    setForm({
      plotNumber: selectedPlot.plotNumber || '',
      corners: cornersFromPlot(selectedPlot),
      areaSqYards: selectedPlot.areaSqYards ?? '',
      facing: selectedPlot.facing || 'East',
      ratePerSqYard: selectedPlot.ratePerSqYard ?? '',
      status: selectedPlot.status || 'Available',
    });
    setPreviewPlot(null);
    setDetailOpen(false);
    setEditOpen(false);
    setFormOpen(true);
  }, [selectedPlot]);

  const previewPlotOnMap = useCallback(() => {
    const validation = parseAndValidateCorners(form);
    if (!validation.valid) return validation;

    const preview = {
      ...buildPreviewPlot(form),
      polygonPoints: validation.points,
    };
    setPreviewPlot(preview);

    if (preview.latitude != null && preview.longitude != null) {
      setLiveCoords({ lat: preview.latitude, lng: preview.longitude });
    }

    return { valid: true, points: validation.points };
  }, [form]);

  const savePlot = useCallback(() => {
    if (!layout) return null;

    const validation = parseAndValidateCorners(form);
    if (!validation.valid) return { error: validation.message };

    const polygonPoints = validation.points;
    const centroid = computeCentroid(polygonPoints);
    if (!centroid) return { error: 'Unable to compute plot centroid from coordinates.' };

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
      areaSqYards: Number(form.areaSqYards) || 0,
      ratePerSqYard: Number(form.ratePerSqYard) || 0,
      status: form.status,
      latitude: centroid.lat,
      longitude: centroid.lng,
      shapeType: SHAPE_TYPES.POLYGON,
      polygonPoints,
      customer: form.status === 'Reserved' || form.status === 'Booked' ? customer : '',
      agent: partner,
      reservationExpiry: form.status === 'Reserved' ? addDays(7) : '',
    };

    let record;
    if (formMode === 'edit' && selectedPlot) {
      const before = { ...selectedPlot };
      record = updatePlot(selectedPlot.id, payload);
      pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after: record });
    } else {
      record = addPlot(payload);
      pushUndo({ type: 'delete', plotId: record.id, after: record });
    }

    setFormOpen(false);
    setPreviewPlot(null);
    setSelectedPlotId(record.id);
    setDetailOpen(true);
    return { plot: record };
  }, [addPlot, form, formMode, layout, pushUndo, selectedPlot, updatePlot, venture?.id]);

  const saveMetadataEdit = useCallback(() => {
    if (!selectedPlot) return { error: 'No plot selected' };

    const before = { ...selectedPlot };
    const payload = {
      areaSqYards: Number(editForm.areaSqYards) || 0,
      facing: editForm.facing,
      ratePerSqYard: Number(editForm.ratePerSqYard) || 0,
      dimensions: editForm.dimensions,
      status: editForm.status,
      notes: editForm.description,
      description: editForm.description,
    };

    const after = updatePlot(selectedPlot.id, payload);
    pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after });
    setEditOpen(false);
    setDetailOpen(true);
    return { plot: after };
  }, [editForm, pushUndo, selectedPlot, updatePlot]);

  const applyStatusChange = useCallback(
    (mutator) => {
      if (!selectedPlot) return null;
      const before = { ...selectedPlot };
      const after = mutator(selectedPlot.id, {
        customer: selectedPlot.customer || MOCK_CUSTOMERS[0],
        agent: selectedPlot.agent || MOCK_PARTNERS[0],
        reservationExpiry: addDays(7),
      });
      if (after) {
        pushUndo({ type: 'restore', plotId: selectedPlot.id, before, after });
      }
      return after;
    },
    [pushUndo, selectedPlot]
  );

  const reserveSelected = useCallback(
    () => applyStatusChange((id, extra) => reservePlot(id, extra)),
    [applyStatusChange, reservePlot]
  );

  const bookSelected = useCallback(
    () => applyStatusChange((id, extra) => bookPlot(id, extra)),
    [applyStatusChange, bookPlot]
  );

  const purchaseSelected = useCallback(
    () =>
      applyStatusChange((id, extra) =>
        sellPlot(id, {
          ...extra,
          reservationExpiry: null,
        })
      ),
    [applyStatusChange, sellPlot]
  );

  const blockSelected = useCallback(
    () => applyStatusChange((id) => blockPlot(id)),
    [applyStatusChange, blockPlot]
  );

  const releaseSelected = useCallback(
    () => applyStatusChange((id) => releasePlot(id)),
    [applyStatusChange, releasePlot]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedPlot) return null;
    const before = { ...selectedPlot };
    removePlot(selectedPlot.id);
    pushUndo({ type: 'remove', plotId: selectedPlot.id, before });
    setDetailOpen(false);
    setEditOpen(false);
    setSelectedPlotId(null);
    setHighlightedPlotId(null);
    return before;
  }, [pushUndo, removePlot, selectedPlot]);

  const applyUndoAction = useCallback(
    (action, direction) => {
      if (action.type === 'delete') {
        if (direction === 'undo') {
          removePlot(action.plotId);
        } else if (action.after) {
          dataStore.updateList('plots', (list) => [action.after, ...list]);
        }
      }
      if (action.type === 'remove') {
        if (direction === 'undo' && action.before) {
          dataStore.updateList('plots', (list) => [action.before, ...list]);
        } else {
          removePlot(action.plotId);
        }
      }
      if (action.type === 'restore') {
        const snapshot = direction === 'undo' ? action.before : action.after || action.before;
        if (snapshot) updatePlot(action.plotId, snapshot);
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
    if (action.plotId === selectedPlotId && (action.type === 'delete' || action.type === 'remove')) {
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
    previewPlot,
    selectedPlot,
    formOpen,
    detailOpen,
    editOpen,
    formMode,
    form,
    setForm,
    editForm,
    setEditForm,
    searchQuery,
    setSearchQuery,
    statusFilters,
    toggleStatusFilter,
    hoveredPlotId,
    highlightedPlotId,
    focusPlotId,
    focusRequest,
    focusSearchMatch,
    handleMouseMove,
    handlePlotHover,
    openAddPlot,
    handlePlotClick,
    closeDrawers,
    closeFormDrawer,
    closeEditDrawer,
    openEditPlot,
    openEditGeometry,
    previewPlotOnMap,
    savePlot,
    saveMetadataEdit,
    reserveSelected,
    bookSelected,
    purchaseSelected,
    blockSelected,
    releaseSelected,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    historyVersion,
    saveLayoutMap,
    setFormOpen,
    setDetailOpen,
    setSelectedPlotId,
  };
};

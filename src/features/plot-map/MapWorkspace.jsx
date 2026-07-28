import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/feedback/Toast';
import PlotFormDrawer from './PlotFormDrawer';
import PlotEditDrawer from './PlotEditDrawer';
import PlotDetailDrawer from './PlotDetailDrawer';
import GenerateLayoutDrawer from './GenerateLayoutDrawer';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { usePlotWorkspace } from './hooks/usePlotWorkspace';
import { useLeafletMap } from './hooks/useLeafletMap';
import { resolveMapView } from './utils/coordinateUtils';
import { resolveLayoutPricingDefaults } from '../../shared/services/layoutView.js';
import { clampMapZoom, getMapTypeLabel } from './utils/mapHelpers';
import { getMapRenderLevel, ZOOM_LEVEL, computeBoundaryFromPlots } from './utils/mapZoomRender';
import { filterPolygonPlots, getPolygonPositions } from './utils/polygonUtils';
import {
  LayoutGenerationService,
  DEFAULT_GENERATION_PARAMS,
  collectAllPreviewPositions,
} from '../../services/layoutGeneration';
import { LayoutSaveService } from '../../services/layoutSave';
import { LayoutValidationService } from './services/LayoutValidationService';
import { LayoutExcelExporter } from '../../services/layoutImport';
import { RefreshService } from '../../services/layoutSave/RefreshService.js';
import ImportLayoutWizard from '../layout-import/ImportLayoutWizard';
import LayoutMapChrome from './LayoutMapChrome';
import {
  WorkspaceKPIStrip,
  WorkspaceTopToolbar,
  WorkspaceMapControls,
  WorkspaceLoadingState,
  WorkspaceEmptyState,
  PlotInfoCard,
  WorkspaceSidebar,
  BottomStatusBar,
  computeWorkspaceMetrics,
  applyPresentationFilters,
  collectFilterOptions,
} from './workspace';
import './styles/plot-map.css';
import './workspace/workspace-premium.css';
import './workspace/workspace-phase1.css';

const OpenStreetMapCanvas = lazy(() => import('./OpenStreetMapCanvas'));

function buildDefaultGenerationForm(layout, venture) {
  // Raw layout for geo engines; pricing via SSOT resolve (Venture → legacy Layout → 0).
  const mapView = resolveMapView(venture, layout);
  const pricing = resolveLayoutPricingDefaults(layout, venture);
  const defaultRate = pricing.defaultRatePerSqYard;
  return {
    ...DEFAULT_GENERATION_PARAMS,
    amenities: { ...DEFAULT_GENERATION_PARAMS.amenities },
    startingLatitude: mapView.center?.lat != null ? String(mapView.center.lat) : '',
    startingLongitude: mapView.center?.lng != null ? String(mapView.center.lng) : '',
    defaultRatePerSqYard: defaultRate ? String(defaultRate) : '',
  };
}

export default function MapWorkspace({ layout, venture, className = '' }) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('satellite');
  const [showRoadLayer, setShowRoadLayer] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generateDrawerOpen, setGenerateDrawerOpen] = useState(false);
  const [importLayoutOpen, setImportLayoutOpen] = useState(false);
  const [generationForm, setGenerationForm] = useState(() =>
    buildDefaultGenerationForm(layout, venture)
  );
  const [generatedPreviewPlots, setGeneratedPreviewPlots] = useState([]);
  const [generatedPreviewRoads, setGeneratedPreviewRoads] = useState([]);
  const [generatedPreviewAmenities, setGeneratedPreviewAmenities] = useState([]);
  const [generatedBlockLabels, setGeneratedBlockLabels] = useState([]);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [generationErrors, setGenerationErrors] = useState([]);
  const [generationFieldErrors, setGenerationFieldErrors] = useState({});
  const [savedLayoutLayers, setSavedLayoutLayers] = useState(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [validationHighlightIds, setValidationHighlightIds] = useState([]);
  const [layoutBoundary, setLayoutBoundary] = useState([]);
  const [layoutHealth, setLayoutHealth] = useState(null);
  const [generationTimeMs, setGenerationTimeMs] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapZoom, setMapZoom] = useState(18);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [forceDetailDrawer, setForceDetailDrawer] = useState(false);
  const [legendHoverStatus, setLegendHoverStatus] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [presentationFilters, setPresentationFilters] = useState({
    facing: '',
    block: '',
    minArea: '',
    maxArea: '',
    minPrice: '',
    maxPrice: '',
    roadWidth: '',
    cornerOnly: false,
    availability: '',
  });
  const searchInputRef = useRef(null);
  const validationToastIdRef = useRef(null);
  const mapView = useMemo(() => resolveMapView(venture, layout), [venture, layout]);

  const reloadSavedLayoutLayers = useCallback(async () => {
    if (!layout?.id) return null;
    const saved = await LayoutSaveService.loadSavedLayout(layout.id);
    if (!saved) return null;
    const layers = {
      roads: saved.roads || [],
      amenities: saved.amenities || [],
      blockLabels: saved.blockLabels || saved.blocks || [],
      configuration: saved.configuration || null,
    };
    setSavedLayoutLayers(layers);
    return layers;
  }, [layout?.id]);

  const state = usePlotWorkspace({ layout, venture });
  const { zoomIn, zoomOut, centerMap } = useLeafletMap(mapRef, venture, layout, mapType);

  const workspaceMetrics = useMemo(
    () => computeWorkspaceMetrics(state.layoutPlots),
    [state.layoutPlots]
  );

  const filterOptions = useMemo(
    () => collectFilterOptions(state.layoutPlots),
    [state.layoutPlots]
  );

  const displayPlots = useMemo(
    () => applyPresentationFilters(state.filteredPlots, presentationFilters),
    [state.filteredPlots, presentationFilters]
  );

  const legendHighlightIds = useMemo(() => {
    if (!legendHoverStatus) return [];
    return state.layoutPlots
      .filter((plot) => plot.status === legendHoverStatus)
      .map((plot) => plot.id);
  }, [legendHoverStatus, state.layoutPlots]);

  const mappedCount = useMemo(
    () => filterPolygonPlots(state.layoutPlots).length,
    [state.layoutPlots]
  );

  const layoutValidation = useMemo(
    () =>
      LayoutValidationService.validateLayoutPlots(
        state.layoutPlots,
        mapView.center,
        layout?.id
      ),
    [state.layoutPlots, mapView.center, layout?.id]
  );

  const activeHighlightIds = useMemo(() => {
    const ids = new Set(validationHighlightIds);
    if (state.highlightedPlotId) ids.add(state.highlightedPlotId);
    legendHighlightIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [state.highlightedPlotId, validationHighlightIds, legendHighlightIds]);

  const effectiveBoundary = useMemo(() => {
    if (layoutBoundary.length) return layoutBoundary;
    return computeBoundaryFromPlots(state.layoutPlots);
  }, [layoutBoundary, state.layoutPlots]);

  const handleBlockClusterClick = useCallback((cluster) => {
    if (!cluster?.bounds || !mapRef.current) return;
    const { minLat, maxLat, minLng, maxLng } = cluster.bounds;
    mapRef.current.fitBounds(
      L.latLngBounds([minLat, minLng], [maxLat, maxLng]),
      { padding: [56, 56], maxZoom: 19, animate: true }
    );
  }, []);

  const handleReviewOffSitePlots = useCallback(
    (plotIds = []) => {
      if (!plotIds.length) return;
      setValidationHighlightIds(plotIds);

      const positions = state.layoutPlots
        .filter((plot) => plotIds.includes(plot.id))
        .flatMap((plot) => getPolygonPositions(plot.polygonPoints));

      if (mapRef.current && positions.length >= 3) {
        mapRef.current.fitBounds(L.latLngBounds(positions), {
          padding: [72, 72],
          maxZoom: 20,
          animate: true,
        });
      }
    },
    [state.layoutPlots]
  );

  const syncViewport = useCallback((map) => {
    if (!map) return;
    const bounds = map.getBounds();
    setViewport({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, []);

  const handleMapReady = useCallback(
    (map) => {
      mapRef.current = map;
      const { center, zoom } = resolveMapView(venture, layout);
      map.setView(
        [center.lat, center.lng],
        clampMapZoom(Math.max(zoom, 18), mapType),
        { animate: false }
      );
      window.requestAnimationFrame(() => map.invalidateSize());
      syncViewport(map);
      map.on('moveend', () => syncViewport(map));
      map.on('zoomend', () => syncViewport(map));
    },
    [layout, mapType, syncViewport, venture]
  );

  useEffect(() => {
    setForceDetailDrawer(false);
  }, [state.selectedPlot?.id]);

  useEffect(() => {
    setGenerationForm(buildDefaultGenerationForm(layout, venture));
    setGeneratedPreviewPlots([]);
    setGeneratedPreviewRoads([]);
    setGeneratedPreviewAmenities([]);
    setGeneratedBlockLabels([]);
    setPreviewSummary(null);
    setGenerationErrors([]);
    setGenerationFieldErrors({});
    setSavedLayoutLayers(null);
    setValidationHighlightIds([]);
    setLayoutBoundary([]);
    setLayoutHealth(null);
    setGenerationTimeMs(null);
    LayoutValidationService.invalidateLayout(layout?.id);
    LayoutValidationService.clearNotificationTracking(layout?.id);
    if (validationToastIdRef.current) {
      toast.dismiss(validationToastIdRef.current);
      validationToastIdRef.current = null;
    }
    LayoutGenerationService.clearLastConfiguration();

    if (!layout?.id) return undefined;

    let cancelled = false;
    LayoutSaveService.loadSavedLayout(layout.id).then((saved) => {
      if (cancelled || !saved) return;
      setSavedLayoutLayers({
        roads: saved.roads || [],
        amenities: saved.amenities || [],
        blockLabels: saved.blockLabels || saved.blocks || [],
        configuration: saved.configuration || null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [layout?.id, venture?.id]);

  useEffect(() => {
    if (!layout?.id) return undefined;
    return RefreshService.subscribe((detail) => {
      if (detail.layoutId && detail.layoutId !== layout.id) return;
      void reloadSavedLayoutLayers();
    });
  }, [layout?.id, reloadSavedLayoutLayers]);

  useEffect(() => {
    if (!layout?.id) return;
    if (searchParams.get('generate') === '1') {
      setGenerationForm(buildDefaultGenerationForm(layout, venture));
      setGenerateDrawerOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('generate');
        return next;
      }, { replace: true });
    }
    if (searchParams.get('import') === '1') {
      setImportLayoutOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('import');
        return next;
      }, { replace: true });
    }
  }, [layout?.id, searchParams, setSearchParams, venture]);

  useEffect(() => {
    if (typeof console !== 'undefined' && console.info) {
      console.info('PREMIUM_WORKSPACE_PHASE1_COMPLETE');
    }
  }, [layout?.id]);

  useEffect(() => {
    if (mapView.source === 'default-fallback') {
      toast.warning('Paste your Google Maps URL on the layout Location step to center the map on your site.');
    }
  }, [layout?.id, mapView.source, toast]);

  useEffect(() => {
    if (!layout?.id || !mapView.center) return undefined;

    const offSiteIssue = layoutValidation.issues.find(
      (issue) => issue.rule === 'off-site-distance'
    );

    if (!offSiteIssue) {
      if (validationToastIdRef.current) {
        toast.dismiss(validationToastIdRef.current);
        validationToastIdRef.current = null;
      }
      return undefined;
    }

    const notificationKey = LayoutValidationService.getNotificationKey(
      layout.id,
      offSiteIssue.rule,
      layoutValidation.fingerprint
    );

    if (LayoutValidationService.hasShownNotification(notificationKey)) {
      return undefined;
    }

    if (validationToastIdRef.current) {
      toast.dismiss(validationToastIdRef.current);
    }

    validationToastIdRef.current = toast.warning(offSiteIssue.message, {
      duration: 0,
      action: {
        label: 'Review',
        onClick: () => handleReviewOffSitePlots(offSiteIssue.plotIds),
      },
    });

    LayoutValidationService.markNotificationShown(notificationKey);
  }, [
    handleReviewOffSitePlots,
    layout?.id,
    layoutValidation.fingerprint,
    layoutValidation.issues,
    mapView.center,
    toast,
  ]);

  useEffect(() => {
    if (!state.previewPlot || !mapRef.current) return;
    const positions = getPolygonPositions(state.previewPlot.polygonPoints);
    if (positions.length < 3) return;

    const map = mapRef.current;
    map.fitBounds(positions, {
      padding: [56, 56],
      maxZoom: clampMapZoom(19, mapType),
      animate: true,
    });
    window.requestAnimationFrame(() => map.invalidateSize());
  }, [mapType, state.previewPlot]);

  useEffect(() => {
    if (!generatedPreviewPlots.length || !mapRef.current || !mapView.center) return;
    const positions = collectAllPreviewPositions(
      generatedPreviewPlots,
      generatedPreviewRoads,
      generatedPreviewAmenities,
      generatedBlockLabels
    );
    if (positions.length < 3) return;

    positions.push([mapView.center.lat, mapView.center.lng]);
    const map = mapRef.current;
    map.fitBounds(positions, {
      padding: [48, 48],
      maxZoom: clampMapZoom(18, mapType),
      animate: true,
    });
    window.requestAnimationFrame(() => map.invalidateSize());
  }, [generatedPreviewPlots, generatedPreviewRoads, generatedPreviewAmenities, generatedBlockLabels, mapType, mapView.center]);

  const runGenerationPreview = useCallback(async () => {
    setIsGenerating(true);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const pricing = resolveLayoutPricingDefaults(layout, venture);
    const result = LayoutGenerationService.generatePreview({
      ...generationForm,
      currentPrice: pricing.currentPrice ?? pricing.defaultRatePerSqYard,
      basePrice: pricing.basePrice ?? pricing.defaultRatePerSqYard,
    });

    setIsGenerating(false);

    if (!result.valid) {
      setGenerationErrors(result.errors);
      setGenerationFieldErrors(result.fieldErrors || {});
      setGeneratedPreviewPlots([]);
      setGeneratedPreviewRoads([]);
      setGeneratedPreviewAmenities([]);
      setGeneratedBlockLabels([]);
      setPreviewSummary(null);
      setLayoutBoundary([]);
      setLayoutHealth(null);
      setGenerationTimeMs(null);
      toast.error(result.errors[0] || 'Check layout generation parameters');
      return false;
    }

    setGenerationErrors([]);
    setGenerationFieldErrors({});
    setGeneratedPreviewPlots(result.plots.map((plot) => ({ ...plot, status: 'Available' })));
    setGeneratedPreviewRoads(result.roads || []);
    setGeneratedPreviewAmenities(result.amenities || []);
    setGeneratedBlockLabels(result.blockLabels || []);
    setLayoutBoundary(result.boundary || []);
    setLayoutHealth(result.health || null);
    setGenerationTimeMs(result.generationTimeMs ?? null);
    setPreviewSummary(result.summary || null);

    if (result.swappedCoordinates) {
      setGenerationForm((prev) => ({
        ...prev,
        startingLatitude: String(result.resolvedOrigin.lat),
        startingLongitude: String(result.resolvedOrigin.lng),
      }));
      toast.warning(
        'Latitude and longitude looked swapped — corrected automatically. Use Lat ≈ 16.55, Lng ≈ 80.38 for your site.'
      );
    }

    toast.success(
      `${result.plots.length} plots generated in ${result.generationTimeMs ?? 0} ms`
    );
    return true;
  }, [generationForm, layout, venture, toast]);

  const handleGeneratePreview = useCallback(() => {
    runGenerationPreview();
  }, [runGenerationPreview]);

  const handleRegenerate = useCallback(() => {
    runGenerationPreview();
  }, [runGenerationPreview]);

  const handleResetPreview = useCallback(() => {
    setGeneratedPreviewPlots([]);
    setGeneratedPreviewRoads([]);
    setGeneratedPreviewAmenities([]);
    setGeneratedBlockLabels([]);
    setPreviewSummary(null);
    setLayoutBoundary([]);
    setLayoutHealth(null);
    setGenerationTimeMs(null);
    setValidationHighlightIds([]);
    setGenerationErrors([]);
    setGenerationFieldErrors({});
    LayoutGenerationService.clearLastConfiguration();
    toast.info('Layout preview cleared');
  }, [toast]);

  const handleResetGenerationForm = useCallback(() => {
    setGenerationForm(buildDefaultGenerationForm(layout, venture));
  }, [layout, venture]);

  const handleExportExcel = useCallback(() => {
    if (generatedPreviewPlots.length) {
      const { rowCount, filename } = LayoutGenerationService.exportPreviewToExcel(
        generatedPreviewPlots,
        layout
      );
      toast.success(`Exported ${rowCount} plots to ${filename}`);
      return;
    }

    try {
      const result = LayoutExcelExporter.exportLayout(layout?.id, venture);
      toast.success(
        `Exported ${result.counts.plots} plots, ${result.counts.roads} roads to ${result.filename}`
      );
    } catch (err) {
      toast.info(err.message || 'Generate a layout or import data before exporting');
    }
  }, [generatedPreviewPlots, layout, venture, toast]);

  const handleOpenImportWizard = useCallback(() => {
    setImportLayoutOpen(true);
  }, []);

  const handleImportComplete = useCallback(
    async ({ preview, result }) => {
      setGeneratedPreviewPlots([]);
      setGeneratedPreviewRoads([]);
      setGeneratedPreviewAmenities([]);
      setGeneratedBlockLabels([]);
      setPreviewSummary(null);
      await reloadSavedLayoutLayers();

      const plotCount = result?.plots?.length ?? preview?.plots?.length ?? 0;
      const roadCount = preview?.roads?.length ?? 0;
      toast.success(
        `Township imported — ${plotCount} plots and ${roadCount} roads are now on the map`
      );

      if (mapRef.current && preview?.plots?.length) {
        const positions = collectAllPreviewPositions(
          preview.plots,
          preview.roads || [],
          preview.amenities || [],
          []
        );
        if (positions.length >= 3) {
          mapRef.current.fitBounds(L.latLngBounds(positions), {
            padding: [72, 72],
            maxZoom: 19,
            animate: true,
          });
        }
      }
    },
    [reloadSavedLayoutLayers, toast]
  );

  const handleHealthViewIssues = useCallback(
    (plotIds = []) => {
      if (!plotIds.length) return;
      setValidationHighlightIds(plotIds);
      const positions = generatedPreviewPlots
        .filter((plot) => plotIds.includes(plot.id))
        .flatMap((plot) => getPolygonPositions(plot.polygonPoints));
      if (mapRef.current && positions.length >= 3) {
        mapRef.current.fitBounds(L.latLngBounds(positions), {
          padding: [72, 72],
          maxZoom: 20,
          animate: true,
        });
      }
    },
    [generatedPreviewPlots]
  );

  const handleHealthHighlightIssue = useCallback(
    (issue) => {
      if (issue?.plotIds?.length) handleHealthViewIssues(issue.plotIds);
    },
    [handleHealthViewIssues]
  );

  const handleSaveGeneratedLayout = useCallback(async () => {
    if (!layout?.id || !generatedPreviewPlots.length) return;

    setIsSavingLayout(true);
    try {
      const result = await LayoutSaveService.saveGeneratedLayout({
        layout,
        venture,
        preview: {
          plots: generatedPreviewPlots,
          roads: generatedPreviewRoads,
          amenities: generatedPreviewAmenities,
          blockLabels: generatedBlockLabels,
          configuration: LayoutGenerationService.getLastConfiguration(),
        },
        generationForm,
      });

      setSavedLayoutLayers({
        roads: result.roads || generatedPreviewRoads,
        amenities: result.amenities || generatedPreviewAmenities,
        blockLabels: result.blockLabels || result.blocks || generatedBlockLabels,
        configuration: result.configuration || LayoutGenerationService.getLastConfiguration(),
      });

      setGeneratedPreviewPlots([]);
      setGeneratedPreviewRoads([]);
      setGeneratedPreviewAmenities([]);
      setGeneratedBlockLabels([]);
      setPreviewSummary(null);
      setGenerationErrors([]);
      setGenerationFieldErrors({});
      LayoutGenerationService.clearLastConfiguration();
      setGenerateDrawerOpen(false);

      toast.success(
        `Layout saved — ${result.summary?.plots ?? generatedPreviewPlots.length} plots, ${result.summary?.roads ?? 0} roads, ${result.summary?.amenities ?? 0} amenities`
      );
    } catch (error) {
      toast.error(error?.message || 'Unable to save generated layout');
    } finally {
      setIsSavingLayout(false);
    }
  }, [
    generatedBlockLabels,
    generatedPreviewAmenities,
    generatedPreviewPlots,
    generatedPreviewRoads,
    generationForm,
    layout,
    toast,
    venture,
  ]);

  const handleOpenGenerateDrawer = useCallback(() => {
    setGenerationForm(buildDefaultGenerationForm(layout, venture));
    setGenerateDrawerOpen(true);
  }, [layout, venture]);

  const handleSaveToolbar = useCallback(() => {
    state.saveLayoutMap();
    toast.success('Layout map saved locally');
  }, [state, toast]);

  const handleUndo = useCallback(() => {
    if (state.undo()) toast.info('Undid last map change');
  }, [state, toast]);

  const handleRedo = useCallback(() => {
    if (state.redo()) toast.info('Redid last map change');
  }, [state, toast]);

  const handlePreview = useCallback(() => {
    const result = state.previewPlotOnMap();
    if (result?.valid) {
      toast.success('Preview polygon drawn on map');
    } else {
      toast.error(result?.message || 'Enter valid corner coordinates to preview');
    }
  }, [state, toast]);

  const handleSavePlot = useCallback(() => {
    const result = state.savePlot();
    if (result?.plot) {
      toast.success(`Plot ${result.plot.plotNumber} saved to map`);
      return;
    }
    toast.error(result?.error || 'Unable to save plot');
  }, [state, toast]);

  const handleSaveMetadataEdit = useCallback(() => {
    const result = state.saveMetadataEdit();
    if (result?.plot) {
      toast.success(`Plot ${result.plot.plotNumber} updated`);
      return;
    }
    toast.error(result?.error || 'Unable to update plot');
  }, [state, toast]);

  const handleSearchSubmit = useCallback(() => {
    const match = state.focusSearchMatch();
    if (!match) toast.info('No matching plot found');
  }, [state, toast]);

  const handleDeleteConfirm = useCallback(() => {
    const deleted = state.deleteSelected();
    setDeleteConfirmOpen(false);
    if (deleted) toast.success(`Plot ${deleted.plotNumber} deleted`);
  }, [state, toast]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const toggleRoadLayer = useCallback(() => {
    setShowRoadLayer((prev) => !prev);
  }, []);

  const toggleLayers = useCallback(() => {
    setMapType((prev) => (prev === 'satellite' ? 'roadmap' : 'satellite'));
  }, []);

  const handleMiniMapNavigate = useCallback(
    ({ lat, lng }) => {
      if (!mapRef.current) return;
      mapRef.current.panTo([lat, lng], { animate: true, duration: 0.45 });
    },
    []
  );

  const handleQueryFocus = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select?.();
  }, []);

  const handlePrintPlot = useCallback(() => {
    window.print();
  }, []);

  const handleClosePlotCard = useCallback(() => {
    setForceDetailDrawer(false);
    state.closeDrawers();
  }, [state]);

  const handleViewPlotDetails = useCallback(() => {
    setForceDetailDrawer(true);
  }, []);

  const isPreviewActive = generatedPreviewPlots.length > 0;
  const mapRoads = isPreviewActive ? generatedPreviewRoads : savedLayoutLayers?.roads || [];
  const visibleMapRoads = showRoadLayer ? mapRoads : [];
  const mapAmenities = isPreviewActive ? generatedPreviewAmenities : savedLayoutLayers?.amenities || [];
  const mapBlockLabels = isPreviewActive ? generatedBlockLabels : savedLayoutLayers?.blockLabels || [];
  const showPlotCard = Boolean(state.detailOpen && state.selectedPlot && !forceDetailDrawer);

  if (!layout) {
    return (
      <WorkspaceEmptyState
        className="plot-map-empty ws-p1-empty-page"
        icon="map"
        title="Select a layout"
        description="Open a layout from the inventory to launch the premium map workspace."
      />
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`plot-map-workspace ws-premium ws-p1${
        generatedPreviewPlots.length ? ' plot-map-workspace--gen-preview' : ''
      } ${className}`.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <WorkspaceKPIStrip metrics={workspaceMetrics} />

      <div className="plot-map-workspace__stage">
        <div className="ws-p1-main">
          <WorkspaceTopToolbar
            layoutName={layout.name}
            searchInputRef={searchInputRef}
            searchQuery={state.searchQuery}
            onSearchChange={state.setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            importHref={layout.id ? `/dashboard/plots/import?layout=${layout.id}` : '/dashboard/plots/import'}
            onQueryFocus={handleQueryFocus}
            onGenerate={handleOpenGenerateDrawer}
            onImport={handleOpenImportWizard}
            onAddPlot={state.openAddPlot}
            onSave={handleSaveToolbar}
            onExport={handleExportExcel}
            generatedPreviewCount={generatedPreviewPlots.length}
          />

          <div className="plot-map-workspace__body">
            <div className="plot-map-workspace__map">
              {(isPreviewActive || state.layoutPlots.length > 0) ? (
                <LayoutMapChrome showLegend={getMapRenderLevel(mapZoom) !== ZOOM_LEVEL.OVERVIEW} />
              ) : null}

              <WorkspaceMapControls
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={centerMap}
                onToggleLayers={toggleLayers}
                onToggleRoadLayer={toggleRoadLayer}
                showRoadLayer={showRoadLayer}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                mapType={mapType}
                mapZoom={mapZoom}
                mapCenter={mapView.center}
              />

              <Suspense fallback={<WorkspaceLoadingState label="Loading map canvas…" />}>
              <OpenStreetMapCanvas
                venture={venture}
                layout={layout}
                plots={displayPlots}
                allPlots={state.layoutPlots}
                previewPlot={state.previewPlot}
                generatedPreviewPlots={generatedPreviewPlots}
                generatedPreviewRoads={visibleMapRoads}
                generatedPreviewAmenities={mapAmenities}
                generatedBlockLabels={mapBlockLabels}
                layoutBoundary={effectiveBoundary}
                mapZoom={mapZoom}
                savedLayoutActive={!isPreviewActive && Boolean(savedLayoutLayers)}
                selectedPlotId={state.selectedPlot?.id}
                hoveredPlotId={state.hoveredPlotId}
                highlightedPlotIds={activeHighlightIds}
                focusPlotId={state.focusPlotId}
                focusRequest={state.focusRequest}
                mapType={mapType}
                onMouseMove={state.handleMouseMove}
                onPlotClick={state.handlePlotClick}
                onPlotHover={state.handlePlotHover}
                onBlockClusterClick={handleBlockClusterClick}
                onMapReady={handleMapReady}
                onZoomChange={setMapZoom}
              />
            </Suspense>

            <PlotInfoCard
              open={showPlotCard}
              plot={state.selectedPlot}
              layout={layout}
              onClose={handleClosePlotCard}
              onBook={() => {
                state.bookSelected();
                toast.success('Plot booked');
              }}
              onReserve={() => {
                state.reserveSelected();
                toast.success('Plot reserved');
              }}
              onViewDetails={handleViewPlotDetails}
              onEdit={state.openEditPlot}
              onDelete={() => setDeleteConfirmOpen(true)}
              onPrint={handlePrintPlot}
            />
          </div>
        </div>

          <BottomStatusBar
            layoutName={layout.name}
            plotCount={state.layoutPlots.length}
            mappedCount={mappedCount}
            visibleCount={displayPlots.length}
            mapTypeLabel={getMapTypeLabel(mapType)}
            mapCenter={mapView.center}
            centerSource={mapView.source}
            generatedPreviewCount={generatedPreviewPlots.length}
            liveCoords={state.liveCoords}
            zoom={mapZoom}
          />
        </div>

        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          plots={state.layoutPlots}
          filteredPlots={displayPlots}
          metrics={workspaceMetrics}
          statusFilters={state.statusFilters}
          onToggleStatus={state.toggleStatusFilter}
          onHoverStatus={setLegendHoverStatus}
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          filters={presentationFilters}
          onFiltersChange={setPresentationFilters}
          filterOptions={filterOptions}
          viewport={viewport}
          mapCenter={mapView.center}
          miniMapRoads={visibleMapRoads}
          miniMapAmenities={mapAmenities}
          miniMapBoundary={effectiveBoundary}
          onMiniMapNavigate={handleMiniMapNavigate}
          selectedPlot={state.selectedPlot}
        />
      </div>

      <PlotFormDrawer
        open={state.formOpen}
        onClose={state.closeFormDrawer}
        form={state.form}
        setForm={state.setForm}
        onPreview={handlePreview}
        onSave={handleSavePlot}
        mode={state.formMode}
      />

      <PlotEditDrawer
        open={state.editOpen}
        onClose={state.closeEditDrawer}
        form={state.editForm}
        setForm={state.setEditForm}
        onSave={handleSaveMetadataEdit}
      />

      <PlotDetailDrawer
        open={forceDetailDrawer && state.detailOpen}
        onClose={() => {
          setForceDetailDrawer(false);
          state.closeDrawers();
        }}
        plot={state.selectedPlot}
        layout={layout}
        onReserve={() => {
          state.reserveSelected();
          toast.success('Plot reserved');
        }}
        onBook={() => {
          state.bookSelected();
          toast.success('Plot booked');
        }}
        onPurchase={() => {
          state.purchaseSelected();
          toast.success('Plot marked as sold');
        }}
        onBlock={() => {
          state.blockSelected();
          toast.success('Plot blocked');
        }}
        onRelease={() => {
          state.releaseSelected();
          toast.success('Plot released');
        }}
        onEdit={state.openEditPlot}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      <ConfirmationModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete plot?"
        message={`This will permanently remove plot ${state.selectedPlot?.plotNumber || ''} from the map and inventory.`}
        highlight={state.selectedPlot?.plotNumber}
        confirmLabel="Delete Plot"
        tone="danger"
      />

      <GenerateLayoutDrawer
        open={generateDrawerOpen}
        onClose={() => setGenerateDrawerOpen(false)}
        form={generationForm}
        setForm={setGenerationForm}
        venture={venture}
        layout={layout}
        onGeneratePreview={handleGeneratePreview}
        onResetPreview={handleResetPreview}
        onResetForm={handleResetGenerationForm}
        onRegenerate={handleRegenerate}
        onSaveLayout={handleSaveGeneratedLayout}
        onExportExcel={handleExportExcel}
        plotCount={generatedPreviewPlots.length}
        previewSummary={previewSummary}
        layoutHealth={layoutHealth}
        generationTimeMs={generationTimeMs}
        isGenerating={isGenerating}
        isSaving={isSavingLayout}
        errors={generationErrors}
        fieldErrors={generationFieldErrors}
        onViewHealthIssues={handleHealthViewIssues}
        onHighlightHealthIssue={handleHealthHighlightIssue}
      />

      <ImportLayoutWizard
        open={importLayoutOpen}
        onClose={() => setImportLayoutOpen(false)}
        layout={layout}
        venture={venture}
        onImportComplete={handleImportComplete}
        onOpenWorkspace={() => setImportLayoutOpen(false)}
      />
    </motion.div>
  );
}

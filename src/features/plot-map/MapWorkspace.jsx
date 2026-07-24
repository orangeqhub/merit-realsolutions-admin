import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { useToast } from '../../components/feedback/Toast';
import MapToolbar from './MapToolbar';
import CoordinatePanel from './CoordinatePanel';
import PlotFormDrawer from './PlotFormDrawer';
import PlotEditDrawer from './PlotEditDrawer';
import PlotDetailDrawer from './PlotDetailDrawer';
import GenerateLayoutDrawer from './GenerateLayoutDrawer';
import PlotStatusBar from './PlotStatusBar';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { usePlotWorkspace } from './hooks/usePlotWorkspace';
import { useLeafletMap } from './hooks/useLeafletMap';
import { resolveMapView } from './utils/coordinateUtils';
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
import LayoutMapChrome from './LayoutMapChrome';
import './styles/plot-map.css';

const OpenStreetMapCanvas = lazy(() => import('./OpenStreetMapCanvas'));

function buildDefaultGenerationForm(layout, venture) {
  const mapView = resolveMapView(venture, layout);
  const defaultRate =
    Number(layout?.currentPrice) || Number(layout?.basePrice) || '';
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
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generateDrawerOpen, setGenerateDrawerOpen] = useState(false);
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
  const validationToastIdRef = useRef(null);
  const mapView = useMemo(() => resolveMapView(venture, layout), [venture, layout]);

  const state = usePlotWorkspace({ layout, venture });
  const { zoomIn, zoomOut, centerMap } = useLeafletMap(mapRef, venture, layout, mapType);

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
    return [...ids];
  }, [state.highlightedPlotId, validationHighlightIds]);

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
    },
    [layout, mapType, venture]
  );

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

    const result = LayoutGenerationService.generatePreview({
      ...generationForm,
      currentPrice: layout?.currentPrice,
      basePrice: layout?.basePrice,
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
  }, [generationForm, layout?.basePrice, layout?.currentPrice, toast]);

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

  const handleExportExcel = useCallback(() => {
    if (!generatedPreviewPlots.length) {
      toast.info('Generate a layout preview before exporting');
      return;
    }
    const { rowCount, filename } = LayoutGenerationService.exportPreviewToExcel(
      generatedPreviewPlots,
      layout
    );
    toast.success(`Exported ${rowCount} plots to ${filename}`);
  }, [generatedPreviewPlots, layout, toast]);

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

  const isPreviewActive = generatedPreviewPlots.length > 0;
  const mapRoads = isPreviewActive ? generatedPreviewRoads : savedLayoutLayers?.roads || [];
  const mapAmenities = isPreviewActive ? generatedPreviewAmenities : savedLayoutLayers?.amenities || [];
  const mapBlockLabels = isPreviewActive ? generatedBlockLabels : savedLayoutLayers?.blockLabels || [];

  if (!layout) {
    return <div className="plot-map-empty">Select a layout to open the map workspace.</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      className={`plot-map-workspace ${className}`.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <MapToolbar
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        mapType={mapType}
        onMapTypeChange={setMapType}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onCenter={centerMap}
        onSave={handleSaveToolbar}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        layoutName={layout.name}
        layoutId={layout.id}
        legendPlots={state.filteredPlots}
        statusFilters={state.statusFilters}
        onToggleStatusFilter={state.toggleStatusFilter}
        onAddPlot={state.openAddPlot}
        onGenerateLayout={handleOpenGenerateDrawer}
        generatedPreviewCount={generatedPreviewPlots.length}
      />

      <div className="plot-map-workspace__body">
        <div className="plot-map-workspace__map">
          {(isPreviewActive || state.layoutPlots.length > 0) ? (
            <LayoutMapChrome showLegend={getMapRenderLevel(mapZoom) !== ZOOM_LEVEL.OVERVIEW} />
          ) : null}
          <Suspense fallback={<div className="plot-map-fallback plot-map-fallback--loading">Loading map…</div>}>
            <OpenStreetMapCanvas
              venture={venture}
              layout={layout}
              plots={state.filteredPlots}
              allPlots={state.layoutPlots}
              previewPlot={state.previewPlot}
              generatedPreviewPlots={generatedPreviewPlots}
              generatedPreviewRoads={mapRoads}
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
        </div>

        <CoordinatePanel
          liveCoords={state.liveCoords}
          selectedPlot={state.selectedPlot}
          previewActive={Boolean(state.previewPlot || generatedPreviewPlots.length)}
        />
      </div>

      <PlotStatusBar
        layoutName={layout.name}
        plotCount={state.layoutPlots.length}
        mappedCount={mappedCount}
        mapTypeLabel={getMapTypeLabel(mapType)}
        mapCenter={mapView.center}
        centerSource={mapView.source}
        generatedPreviewCount={generatedPreviewPlots.length}
        generatedRoadCount={generatedPreviewRoads.length}
        generatedAmenityCount={generatedPreviewAmenities.length}
      />

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
        open={state.detailOpen}
        onClose={state.closeDrawers}
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
        onGeneratePreview={handleGeneratePreview}
        onResetPreview={handleResetPreview}
        onRegenerate={handleRegenerate}
        onSaveLayout={handleSaveGeneratedLayout}
        onExportExcel={handleExportExcel}
        plotCount={generatedPreviewPlots.length}
        roadCount={generatedPreviewRoads.length}
        amenityCount={generatedPreviewAmenities.length}
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
    </motion.div>
  );
}

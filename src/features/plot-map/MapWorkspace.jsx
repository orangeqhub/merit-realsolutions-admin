import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/feedback/Toast';
import OpenStreetMapCanvas from './OpenStreetMapCanvas';
import MapToolbar from './MapToolbar';
import CoordinatePanel from './CoordinatePanel';
import PlotFormDrawer from './PlotFormDrawer';
import PlotDetailDrawer from './PlotDetailDrawer';
import PlotStatusBar from './PlotStatusBar';
import { usePlotWorkspace } from './hooks/usePlotWorkspace';
import { useLeafletMap } from './hooks/useLeafletMap';
import { resolveMapCenter } from './utils/coordinateUtils';
import { getMapTypeLabel } from './utils/mapHelpers';
import { filterPlottablePlots } from './utils/overlayUtils';
import './styles/plot-map.css';

export default function MapWorkspace({ layout, venture, className = '' }) {
  const toast = useToast();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const center = resolveMapCenter(venture, layout);

  const state = usePlotWorkspace({ layout, venture });
  const { zoomIn, zoomOut, centerMap } = useLeafletMap(mapRef, center);

  const mappedCount = useMemo(
    () => filterPlottablePlots(state.layoutPlots).length,
    [state.layoutPlots]
  );

  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

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
        plots={state.layoutPlots}
      />

      <div className="plot-map-workspace__body">
        <div className="plot-map-workspace__map">
          <OpenStreetMapCanvas
            venture={venture}
            layout={layout}
            plots={state.filteredPlots}
            selectedPlotId={state.selectedPlot?.id}
            mapType={mapType}
            onMapClick={state.handleMapClick}
            onMouseMove={state.handleMouseMove}
            onPlotClick={state.handlePlotClick}
            onMapReady={handleMapReady}
          />
        </div>

        <CoordinatePanel
          liveCoords={state.liveCoords}
          frozenCoords={state.frozenCoords}
          selectedPlot={state.selectedPlot}
        />
      </div>

      <PlotStatusBar
        layoutName={layout.name}
        plotCount={state.layoutPlots.length}
        mappedCount={mappedCount}
        mapTypeLabel={getMapTypeLabel(mapType)}
      />

      <PlotFormDrawer
        open={state.createOpen}
        onClose={state.closeDrawers}
        form={state.form}
        setForm={state.setForm}
        frozenCoords={state.frozenCoords}
        onSave={() => {
          const saved = state.savePlot();
          if (saved) toast.success(`Plot ${saved.plotNumber} added to map`);
        }}
        mode="create"
      />

      <PlotFormDrawer
        open={state.editOpen}
        onClose={state.closeDrawers}
        form={state.form}
        setForm={state.setForm}
        frozenCoords={state.frozenCoords}
        onSave={() => {
          const saved = state.savePlot();
          if (saved) toast.success(`Plot ${saved.plotNumber} updated`);
        }}
        mode="edit"
      />

      <PlotDetailDrawer
        open={state.detailOpen}
        onClose={state.closeDrawers}
        plot={state.selectedPlot}
        onReserve={() => {
          state.reserveSelected();
          toast.success('Plot reserved (mock)');
        }}
        onPurchase={() => {
          state.purchaseSelected();
          toast.success('Plot marked as sold (mock)');
        }}
        onScheduleVisit={() => {
          state.scheduleVisit();
          toast.success('Site visit scheduled (mock)');
        }}
        onEdit={state.openEditPlot}
      />
    </motion.div>
  );
}

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../../components/feedback/Toast';
import GoogleMapCanvas, { useMapControls } from './GoogleMapCanvas';
import MapToolbar from './MapToolbar';
import CoordinatePanel from './CoordinatePanel';
import PlotFormDrawer from './PlotFormDrawer';
import PlotDetailDrawer from './PlotDetailDrawer';
import { usePlotMapState } from '../hooks/usePlotMapState';
import { resolveMapCenter } from '../utils/coordinates';
import '../styles/plot-map.css';

export default function MapWorkspace({ layout, venture, className = '' }) {
  const toast = useToast();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const center = resolveMapCenter(venture, layout);

  const state = usePlotMapState({ layout, venture });
  const { zoomIn, zoomOut, centerMap } = useMapControls(mapRef, center);

  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleSaveToolbar = useCallback(() => {
    toast.success('Layout map saved locally');
  }, [toast]);

  const handleUndo = useCallback(() => {
    state.undo();
    toast.info('Undid last map change');
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        layoutName={layout.name}
      />

      <div className="plot-map-workspace__body">
        <div className="plot-map-workspace__map">
          <GoogleMapCanvas
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
      />
    </motion.div>
  );
}

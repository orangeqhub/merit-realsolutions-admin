import {
  FiLayers,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiZoomIn,
  FiZoomOut,
} from 'react-icons/fi';
import Button from '../../components/ui/button/Button';
import PlotSearch from './PlotSearch';
import PlotLegend from './PlotLegend';

export default function MapToolbar({
  searchQuery,
  onSearchChange,
  mapType,
  onMapTypeChange,
  onZoomIn,
  onZoomOut,
  onCenter,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isFullscreen,
  onToggleFullscreen,
  layoutName,
  plots = [],
}) {
  return (
    <div className="plot-map-toolbar">
      <div className="plot-map-toolbar__left">
        <PlotSearch value={searchQuery} onChange={onSearchChange} />
        <span className="plot-map-toolbar__layout">
          <FiLayers /> {layoutName}
        </span>
      </div>

      <div className="plot-map-toolbar__center">
        <button type="button" className="plot-map-toolbar__btn" onClick={onZoomOut} aria-label="Zoom out">
          <FiZoomOut />
        </button>
        <button type="button" className="plot-map-toolbar__btn" onClick={onZoomIn} aria-label="Zoom in">
          <FiZoomIn />
        </button>
        <button
          type="button"
          className={`plot-map-toolbar__pill ${mapType === 'satellite' ? 'is-active' : ''}`}
          onClick={() => onMapTypeChange('satellite')}
        >
          Satellite
        </button>
        <button
          type="button"
          className={`plot-map-toolbar__pill ${mapType === 'roadmap' ? 'is-active' : ''}`}
          onClick={() => onMapTypeChange('roadmap')}
        >
          Standard
        </button>
        <button type="button" className="plot-map-toolbar__btn" onClick={onCenter} aria-label="Center layout">
          Center Layout
        </button>
        <button type="button" className="plot-map-toolbar__btn" onClick={onToggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>

      <div className="plot-map-toolbar__right">
        <PlotLegend plots={plots} />
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          <FiRotateCcw /> Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
          <FiRotateCw /> Redo
        </Button>
        <Button variant="accent" size="sm" onClick={onSave}>
          <FiSave /> Save
        </Button>
      </div>
    </div>
  );
}

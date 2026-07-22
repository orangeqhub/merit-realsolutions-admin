import {
  FiLayers,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiSave,
  FiZoomIn,
  FiZoomOut,
} from 'react-icons/fi';
import Button from '../../../components/ui/button/Button';
import PlotSearch from './PlotSearch';
import Legend from './Legend';

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
  isFullscreen,
  onToggleFullscreen,
  layoutName,
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
          Road
        </button>
        <button type="button" className="plot-map-toolbar__btn" onClick={onCenter} aria-label="Center venture">
          Center
        </button>
        <button type="button" className="plot-map-toolbar__btn" onClick={onToggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>

      <div className="plot-map-toolbar__right">
        <Legend />
        <Button variant="ghost" size="sm" onClick={onUndo}>
          <FiRotateCcw /> Undo
        </Button>
        <Button variant="accent" size="sm" onClick={onSave}>
          <FiSave /> Save
        </Button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiMinimize2,
  FiRefreshCw,
  FiGrid,
  FiMap,
} from "react-icons/fi";
import EmptyState from "../layout/EmptyState";
import "./LayoutPlanViewer.css";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 0.4;

/**
 * Professional layout plan preview with zoom, pan, fullscreen and a grid overlay.
 * Designed for future extensibility: pass `plots` (with x/y in %) and `onPlotClick`
 * to render clickable plot hotspots with status colors on top of the plan.
 */
export default function LayoutPlanViewer({
  src,
  title = "Layout Plan",
  plots = [],
  onPlotClick,
  className = "",
}) {
  const containerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const clampScale = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta) => {
    setScale((prev) => {
      const next = clampScale(prev + delta);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? STEP : -STEP);
  }, [zoomBy]);

  const handlePointerDown = (e) => {
    if (scale <= 1) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    setIsPanning(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active) return;
    setOffset({
      x: dragRef.current.baseX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.baseY + (e.clientY - dragRef.current.startY),
    });
  };

  const endPan = () => {
    dragRef.current.active = false;
    setIsPanning(false);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (!src) {
    return (
      <div className={`plan-viewer plan-viewer--empty ${className}`.trim()}>
        <EmptyState
          variant="default"
          title="No layout plan uploaded"
          description="Upload a high-resolution layout plan to enable the interactive preview."
          icon={<FiMap />}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`plan-viewer ${isFullscreen ? "is-fullscreen" : ""} ${className}`.trim()}
    >
      <div className="plan-viewer__toolbar">
        <span className="plan-viewer__title">
          <FiMap /> {title}
        </span>
        <div className="plan-viewer__tools">
          <button type="button" onClick={() => zoomBy(-STEP)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
            <FiZoomOut />
          </button>
          <span className="plan-viewer__zoom" aria-live="polite">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoomBy(STEP)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
            <FiZoomIn />
          </button>
          <span className="plan-viewer__divider" />
          <button
            type="button"
            className={showGrid ? "is-active" : ""}
            onClick={() => setShowGrid((g) => !g)}
            aria-pressed={showGrid}
            aria-label="Toggle grid overlay"
          >
            <FiGrid />
          </button>
          <button type="button" onClick={reset} aria-label="Reset view">
            <FiRefreshCw />
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>

      <div
        className={`plan-viewer__stage ${scale > 1 ? "is-zoomed" : ""} ${isPanning ? "is-panning" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
        onDoubleClick={() => (scale > 1 ? reset() : zoomBy(STEP * 2))}
      >
        <div
          className="plan-viewer__canvas"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <img src={src} alt={title} draggable={false} />

          {showGrid && <div className="plan-viewer__grid" aria-hidden="true" />}

          {plots.map((plot) => (
            <button
              key={plot.id}
              type="button"
              className={`plan-viewer__plot plan-viewer__plot--${plot.status || "available"}`}
              style={{ left: `${plot.x}%`, top: `${plot.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onPlotClick?.(plot);
              }}
              title={plot.title || `Plot ${plot.number}`}
            >
              {plot.number}
            </button>
          ))}
        </div>
      </div>

      <p className="plan-viewer__hint">
        Drag to pan · Ctrl + Scroll or double-click to zoom · Plot booking overlay coming soon
      </p>
    </div>
  );
}

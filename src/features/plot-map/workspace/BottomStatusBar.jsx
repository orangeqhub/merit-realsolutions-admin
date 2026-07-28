import { memo } from 'react';

function BottomStatusBar({
  layoutName,
  plotCount,
  mappedCount,
  visibleCount,
  mapTypeLabel,
  mapCenter,
  centerSource,
  generatedPreviewCount = 0,
  liveCoords,
  zoom,
}) {
  return (
    <footer className="ws-status" role="status" aria-live="polite">
      <span className="ws-status__item ws-status__item--strong">{layoutName || 'Layout'}</span>
      <i className="ws-status__dot" />
      <span className="ws-status__item">{plotCount} plots</span>
      <i className="ws-status__dot" />
      <span className="ws-status__item">{mappedCount} mapped</span>
      <i className="ws-status__dot" />
      <span className="ws-status__item">{visibleCount} visible</span>
      {generatedPreviewCount > 0 ? (
        <>
          <i className="ws-status__dot" />
          <span className="ws-status__item ws-status__item--accent">{generatedPreviewCount} preview</span>
        </>
      ) : null}
      <i className="ws-status__dot" />
      <span className="ws-status__item">{mapTypeLabel}</span>
      {zoom != null ? (
        <>
          <i className="ws-status__dot" />
          <span className="ws-status__item">z{Number(zoom).toFixed(1)}</span>
        </>
      ) : null}
      {liveCoords?.lat != null ? (
        <>
          <i className="ws-status__dot" />
          <span className="ws-status__item">
            {Number(liveCoords.lat).toFixed(5)}, {Number(liveCoords.lng).toFixed(5)}
          </span>
        </>
      ) : mapCenter ? (
        <>
          <i className="ws-status__dot" />
          <span className="ws-status__item">
            {Number(mapCenter.lat).toFixed(5)}, {Number(mapCenter.lng).toFixed(5)}
          </span>
        </>
      ) : null}
      {centerSource ? <span className="ws-status__source">{centerSource}</span> : null}
    </footer>
  );
}

export default memo(BottomStatusBar);

import { memo, useCallback, useMemo } from 'react';
import { Polygon, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { MAP_STATUS_COLORS } from './constants/mapStatus';
import { ROAD_TYPES } from '../../services/layoutGeneration/RoadGenerator.js';
import { getRoadPreviewStyle } from '../../services/layoutGeneration/PreviewRenderer.js';
import { getPolygonPositions, hasPlottablePolygon } from './utils/polygonUtils';
import {
  buildBlockClusters,
  filterPlotLabelsForZoom,
  getMapRenderConfig,
} from './utils/mapZoomRender';

function formatPlotTooltip(plot, full = false) {
  const area = plot.areaSqYards ? `${plot.areaSqYards} Sq.Yds` : '—';
  const status = plot.status || 'Available';

  if (!full) {
    return (
      <>
        <strong>{plot.plotNumber}</strong>
        <span>{status}</span>
      </>
    );
  }

  return (
    <>
      <strong>{plot.plotNumber}</strong>
      <span>{plot.blockName ? `Block ${plot.blockName}` : '—'}</span>
      <span>{area}</span>
      <span>{plot.facing || '—'} · {status}</span>
      {plot.dimensions ? <span>{plot.dimensions}</span> : null}
    </>
  );
}

const PlotLeafletPolygon = memo(function PlotLeafletPolygon({
  plot,
  selected = false,
  hovered = false,
  highlighted = false,
  isPreview = false,
  isGeneratedPreview = false,
  showTooltip = false,
  fullTooltip = false,
  onPlotClick,
  onPlotHover,
}) {
  const positions = getPolygonPositions(plot.polygonPoints);
  if (positions.length < 3) return null;

  const colors = MAP_STATUS_COLORS[plot.status] || MAP_STATUS_COLORS.Available;
  const previewLike = isPreview || isGeneratedPreview;
  const isActive = selected || hovered || highlighted;

  const handleMouseOver = useCallback(() => {
    if (!previewLike) onPlotHover?.(plot.id);
  }, [onPlotHover, plot.id, previewLike]);

  const handleMouseOut = useCallback(() => {
    if (!previewLike) onPlotHover?.(null);
  }, [onPlotHover, previewLike]);

  const handleClick = useCallback(
    (event) => {
      event.originalEvent?.stopPropagation();
      onPlotClick?.(plot);
    },
    [onPlotClick, plot]
  );

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: isGeneratedPreview
          ? '#38bdf8'
          : isPreview
            ? '#ffffff'
            : isActive
              ? '#ffffff'
              : colors.border,
        fillColor: isGeneratedPreview ? '#0ea5e9' : colors.fill,
        fillOpacity: previewLike ? 0.45 : hovered || highlighted ? 0.92 : 0.82,
        weight: previewLike ? 2 : isActive ? 3 : 2,
        dashArray: previewLike ? '6 6' : undefined,
        className: [
          isGeneratedPreview
            ? 'plot-generated-preview-polygon'
            : isPreview
              ? 'plot-preview-polygon'
              : 'plot-saved-polygon',
          highlighted ? 'plot-saved-polygon--highlighted' : '',
          hovered ? 'plot-saved-polygon--hovered' : '',
          selected ? 'plot-saved-polygon--selected' : '',
        ]
          .filter(Boolean)
          .join(' '),
      }}
      eventHandlers={
        previewLike
          ? undefined
          : {
              click: handleClick,
              mouseover: handleMouseOver,
              mouseout: handleMouseOut,
            }
      }
    >
      {showTooltip && !previewLike ? (
        <Tooltip sticky direction="top" className="plot-map-polygon-tooltip">
          {formatPlotTooltip(plot, fullTooltip)}
        </Tooltip>
      ) : previewLike ? (
        <Tooltip sticky direction="top">
          {plot.plotNumber} · Preview
        </Tooltip>
      ) : null}
    </Polygon>
  );
}, (prev, next) =>
  prev.plot.id === next.plot.id
  && prev.plot.status === next.plot.status
  && prev.plot.plotNumber === next.plot.plotNumber
  && prev.plot.areaSqYards === next.plot.areaSqYards
  && prev.selected === next.selected
  && prev.hovered === next.hovered
  && prev.highlighted === next.highlighted
  && prev.isPreview === next.isPreview
  && prev.isGeneratedPreview === next.isGeneratedPreview
  && prev.showTooltip === next.showTooltip
  && prev.fullTooltip === next.fullTooltip
);

const RoadLeafletPolygon = memo(function RoadLeafletPolygon({
  road,
  isSaved = false,
  showLabel = false,
}) {
  const positions = getPolygonPositions(road.polygonPoints || road.coordinates);
  if (positions.length < 3) return null;

  const style = getRoadPreviewStyle(road);
  const label = (road.displayLabel || road.label || road.name || 'Road').replace('\n', ' · ');

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        ...style,
        fillOpacity: isSaved ? 0.82 : style.fillOpacity,
        className: `plot-road-preview-polygon plot-road-preview-polygon--${road.roadType || 'internal'} ${isSaved ? 'plot-road-saved-polygon' : ''}`.trim(),
      }}
    >
      {showLabel ? (
        <Tooltip permanent direction="center" className="plot-road-preview-tooltip">
          {label}
        </Tooltip>
      ) : null}
    </Polygon>
  );
});

const AmenityLeafletPolygon = memo(function AmenityLeafletPolygon({ amenity, isSaved = false }) {
  const positions = getPolygonPositions(amenity.polygonPoints || amenity.coordinates);
  if (positions.length < 3) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: amenity.style?.borderColor || '#059669',
        fillColor: amenity.style?.fillColor || '#86efac',
        fillOpacity: isSaved ? 0.68 : 0.55,
        weight: 2,
        className: isSaved ? 'plot-amenity-saved-polygon' : 'plot-amenity-preview-polygon',
      }}
    >
      <Tooltip permanent direction="center" className="plot-amenity-preview-tooltip">
        {amenity.label || amenity.name}
      </Tooltip>
    </Polygon>
  );
});

const PlotNumberMarker = memo(function PlotNumberMarker({ plot }) {
  if (plot.latitude == null || plot.longitude == null) return null;

  const icon = L.divIcon({
    className: 'plot-number-label-marker',
    html: `<span class="plot-number-label-marker__pill">${plot.plotNumber}</span>`,
    iconSize: [56, 18],
    iconAnchor: [28, 9],
  });

  return <Marker position={[plot.latitude, plot.longitude]} icon={icon} interactive={false} />;
});

function LayoutBoundaryPolygon({ boundary = [] }) {
  const positions = getPolygonPositions(boundary);
  if (positions.length < 3) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#f59e0b',
        fillColor: 'transparent',
        fillOpacity: 0,
        weight: 2,
        dashArray: '8 6',
        className: 'plot-layout-boundary-polygon',
      }}
    />
  );
}

function BlockClusterMarker({ cluster, onClick }) {
  if (cluster.latitude == null || cluster.longitude == null) return null;

  const { Available = 0, Reserved = 0, Sold = 0 } = cluster.statusCounts || {};

  const icon = L.divIcon({
    className: 'plot-block-cluster-marker',
    html: `
      <div class="plot-block-cluster-marker__card">
        <strong>${cluster.label}</strong>
        <span>${cluster.plotCount} plots</span>
        <span class="plot-block-cluster-marker__stats">
          <em class="is-available">${Available} Avail</em>
          <em class="is-reserved">${Reserved} Res</em>
          <em class="is-sold">${Sold} Sold</em>
        </span>
      </div>
    `,
    iconSize: [148, 72],
    iconAnchor: [74, 36],
  });

  return (
    <Marker
      position={[cluster.latitude, cluster.longitude]}
      icon={icon}
      eventHandlers={{
        click: (event) => {
          event.originalEvent?.stopPropagation();
          onClick?.(cluster);
        },
      }}
    />
  );
}

const PlotPolygonsGroup = memo(function PlotPolygonsGroup({
  plots,
  selectedPlotId,
  hoveredPlotId,
  highlightedPlotIds,
  showTooltip,
  fullTooltip,
  onPlotClick,
  onPlotHover,
}) {
  const highlightSet = useMemo(() => new Set(highlightedPlotIds || []), [highlightedPlotIds]);

  return plots.filter(hasPlottablePolygon).map((plot) => (
    <PlotLeafletPolygon
      key={plot.id}
      plot={plot}
      selected={plot.id === selectedPlotId}
      hovered={plot.id === hoveredPlotId}
      highlighted={highlightSet.has(plot.id)}
      showTooltip={showTooltip}
      fullTooltip={fullTooltip}
      onPlotClick={onPlotClick}
      onPlotHover={onPlotHover}
    />
  ));
});

export default memo(function PlotPolygonLayer({
  plots = [],
  previewPlot = null,
  generatedPreviewPlots = [],
  generatedPreviewRoads = [],
  generatedPreviewAmenities = [],
  generatedBlockLabels = [],
  layoutBoundary = [],
  mapZoom = 18,
  savedLayoutActive = false,
  selectedPlotId,
  hoveredPlotId,
  highlightedPlotIds = [],
  onPlotClick,
  onPlotHover,
  onBlockClusterClick,
}) {
  const render = useMemo(() => getMapRenderConfig(mapZoom), [mapZoom]);
  const roadsAreSaved = savedLayoutActive && !generatedPreviewPlots.length;

  const visibleRoads = useMemo(() => {
    if (render.showMainRoadsOnly) {
      return generatedPreviewRoads.filter(
        (road) => road.roadType === ROAD_TYPES.MAIN || road.roadType === 'main'
      );
    }
    return generatedPreviewRoads;
  }, [generatedPreviewRoads, render.showMainRoadsOnly]);

  const allRenderablePlots = useMemo(
    () => [...plots, ...generatedPreviewPlots].filter((plot) => plot.latitude != null),
    [generatedPreviewPlots, plots]
  );

  const blockClusters = useMemo(
    () => (render.showBlockClusters ? buildBlockClusters(allRenderablePlots, generatedBlockLabels) : []),
    [allRenderablePlots, generatedBlockLabels, render.showBlockClusters]
  );

  const labelPlots = useMemo(() => {
    if (!render.showPlotNumberLabels) return [];
    return filterPlotLabelsForZoom(allRenderablePlots, mapZoom, {
      alwaysShowIds: [selectedPlotId, hoveredPlotId, ...(highlightedPlotIds || [])].filter(Boolean),
    });
  }, [
    allRenderablePlots,
    highlightedPlotIds,
    hoveredPlotId,
    mapZoom,
    render.showPlotNumberLabels,
    selectedPlotId,
  ]);

  const showPlotTooltip = render.showBasicPlotTooltip || render.showFullPlotTooltip;

  return (
    <>
      {render.showBoundary ? <LayoutBoundaryPolygon boundary={layoutBoundary} /> : null}

      {visibleRoads.map((road) => (
        <RoadLeafletPolygon
          key={road.id}
          road={road}
          isSaved={roadsAreSaved}
          showLabel={render.showRoadLabels}
        />
      ))}

      {render.showAmenities
        ? generatedPreviewAmenities.map((amenity) => (
            <AmenityLeafletPolygon key={amenity.id} amenity={amenity} isSaved={roadsAreSaved} />
          ))
        : null}

      {render.showPlotPolygons ? (
        <>
          <PlotPolygonsGroup
            plots={plots}
            selectedPlotId={selectedPlotId}
            hoveredPlotId={hoveredPlotId}
            highlightedPlotIds={highlightedPlotIds}
            showTooltip={showPlotTooltip}
            fullTooltip={render.showFullPlotTooltip}
            onPlotClick={onPlotClick}
            onPlotHover={onPlotHover}
          />
          {generatedPreviewPlots.filter(hasPlottablePolygon).map((plot) => (
            <PlotLeafletPolygon
              key={plot.id || plot.plotNumber}
              plot={plot}
              isGeneratedPreview
              showTooltip={showPlotTooltip}
              fullTooltip={render.showFullPlotTooltip}
            />
          ))}
        </>
      ) : null}

      {render.showPlotNumberLabels
        ? labelPlots.map((plot) => (
            <PlotNumberMarker key={`label-${plot.id || plot.plotNumber}`} plot={plot} />
          ))
        : null}

      {render.showBlockClusters
        ? blockClusters.map((cluster) => (
            <BlockClusterMarker
              key={cluster.id}
              cluster={cluster}
              onClick={onBlockClusterClick}
            />
          ))
        : null}

      {previewPlot && hasPlottablePolygon(previewPlot) && render.showPlotPolygons ? (
        <PlotLeafletPolygon key="preview-layer" plot={previewPlot} isPreview />
      ) : null}
    </>
  );
});

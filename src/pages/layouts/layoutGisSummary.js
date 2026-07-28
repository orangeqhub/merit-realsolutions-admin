/**
 * Derive GIS layer counts from layout record + plot stats (read-only, no API changes).
 */
export function getLayoutGisSummary(layout, layoutRecord, plotStats = {}) {
  const snapshot = layoutRecord?.generationSnapshot || {};
  const snapshotPlots = snapshot.plots?.length || 0;
  const savedPlots = plotStats.total || layoutRecord?.plotCount || layout?.plotCount || 0;
  const plots = Math.max(savedPlots, snapshotPlots);

  const roads = snapshot.roads?.length || 0;
  const amenities = snapshot.amenities?.length || 0;
  const blocks =
    snapshot.townshipMetadata?.blocks?.length
    || snapshot.blockNames?.length
    || snapshot.blockLabels?.length
    || 0;
  const utilities = snapshot.utilities?.length || 0;
  const landscaping =
    snapshot.landscape?.length
    || snapshot.landscapeFeatures?.length
    || 0;

  const hasGisData =
    plots > 0
    || roads > 0
    || amenities > 0
    || layoutRecord?.hasGeneratedLayout
    || Boolean(snapshot.metadata?.generator);

  const projectName =
    snapshot.metadata?.layoutName
    || snapshot.configuration?.layoutMeta?.layoutName
    || layout?.name
    || '—';

  return {
    projectName,
    plots,
    roads,
    amenities,
    blocks,
    utilities,
    landscaping,
    hasGisData,
  };
}

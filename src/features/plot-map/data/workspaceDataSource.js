/**
 * Workspace data source contract (UI SSOT boundary).
 *
 * Production MapWorkspace loads data via existing hooks/contexts/services:
 *   usePlotWorkspace → layouts/plots collections → SSOT resolve helpers
 *
 * Do NOT create a parallel screen that swaps this for mocks.
 * To change data origin later, adapt behind the hooks/services layer —
 * MapWorkspace presentation stays the same.
 *
 * Provider shape (future API consolidation):
 *   getWorkspace(layoutId) → { venture, layout, plots, mapView, stats }
 *   reservePlot / bookPlot / releasePlot → mutate via existing engines
 */

export const WORKSPACE_DATA_SOURCE = 'live-hooks';

/**
 * Documents the intended provider interface for future adapters.
 * Live path today: MapWorkspace + usePlotWorkspace (not this function).
 */
export function describeWorkspaceProvider() {
  return {
    mode: WORKSPACE_DATA_SOURCE,
    presentation: 'features/plot-map/MapWorkspace',
    liveHooks: 'features/plot-map/hooks/usePlotWorkspace',
    engines: ['OpenStreetMapCanvas', 'LayoutGenerationService', 'reservation context'],
  };
}

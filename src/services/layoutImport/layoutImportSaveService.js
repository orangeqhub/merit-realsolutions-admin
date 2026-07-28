import { layoutService } from '../../shared/services/layoutService.js';
import { PlotCreationService, PLOT_SOURCES, PLOT_MODES } from '../../shared/services/plotCreation/index.js';
import { RefreshService } from '../layoutSave/RefreshService.js';
import { buildLayoutSavePayload } from '../layoutSave/PlotSaveService.js';
import { getAuthToken } from '../auth/authStorage.js';
import { normalizePreviewPlotsForSave } from './polygonSaveNormalization.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function canUseRemoteSave() {
  return Boolean(getAuthToken());
}

async function postSaveGeneratedLayout(layoutId, payload, token) {
  const response = await fetch(
    `${API_BASE}/v1/admin/plot-inventory/layouts/${layoutId}/save-generated`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Save failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function saveLocally(layout, preview) {
  const plotRecords = PlotCreationService.normalizePlotBatch(
    preview.plots,
    PLOT_SOURCES.LAYOUT_IMPORT
  );

  PlotCreationService.createPlotsLocally({
    layoutId: layout.id,
    plots: plotRecords,
    source: PLOT_SOURCES.LAYOUT_IMPORT,
    mode: PLOT_MODES.REPLACE,
  });

  const snapshot = {
    configuration: preview.configuration,
    blocks: preview.blockLabels || [],
    roads: preview.roads || [],
    amenities: preview.amenities || [],
    blockLabels: preview.blockLabels || [],
    summary: preview.summary,
    savedAt: new Date().toISOString(),
    importSource: 'layout-import',
  };

  layoutService.saveGenerationSnapshot(layout.id, snapshot);

  if (preview.layoutMeta) {
    layoutService.updateLayout(layout.id, {
      code: preview.layoutMeta.code || layout.code,
      name: preview.layoutMeta.name || layout.name,
      surveyNumber: preview.layoutMeta.surveyNumber || layout.surveyNumber,
      plotCount: preview.plots.length,
      totalArea: Number(preview.layoutMeta.totalAreaAcres) || layout.totalArea,
      hasGeneratedLayout: true,
    });
  }

  return {
    ...snapshot,
    plots: plotRecords,
    source: 'local',
  };
}

export const LayoutImportSaveService = {
  async saveImportedLayout({ layout, venture, preview }) {
    if (!layout?.id) throw new Error('Layout is required.');
    if (!preview?.plots?.length) throw new Error('Import preview is empty.');

    const { plots: plotsForBackendSave, normalizedCount } = normalizePreviewPlotsForSave(
      preview.plots
    );

    const payload = buildLayoutSavePayload({
      layout,
      venture,
      preview: {
        plots: plotsForBackendSave,
        roads: preview.roads,
        amenities: preview.amenities,
        blockLabels: preview.blockLabels || [],
        configuration: preview.configuration,
      },
      generationForm: preview.configuration,
    });

    if (typeof console !== 'undefined' && console.info) {
      console.info('LAYOUT_IMPORT_POLYGON_NORMALIZATION_COMPLETE', {
        totalPlots: preview.plots.length,
        normalizedCount,
      });
    }

    let result;
    let source = 'local';

    if (await canUseRemoteSave()) {
      try {
        const token = getAuthToken();
        const apiResult = await postSaveGeneratedLayout(layout.id, payload, token);
        if (apiResult?.success) {
          const data = apiResult.data || {};
          PlotCreationService.createPlotsLocally({
            layoutId: layout.id,
            plots: data.plots || preview.plots,
            source: PLOT_SOURCES.LAYOUT_IMPORT,
            mode: PLOT_MODES.REPLACE,
          });
          layoutService.saveGenerationSnapshot(layout.id, {
            configuration: data.configuration || preview.configuration,
            blocks: data.blocks || [],
            roads: data.roads || preview.roads,
            amenities: data.amenities || preview.amenities,
            blockLabels: data.blocks || [],
            summary: data.summary || preview.summary,
            savedAt: new Date().toISOString(),
            importSource: 'layout-import',
          }, { source: 'api' });
          layoutService.updateLayout(layout.id, {
            plotCount: (data.plots || preview.plots).length,
            hasGeneratedLayout: true,
            surveyNumber: preview.layoutMeta?.surveyNumber || layout.surveyNumber,
          });
          result = { ...data, source: 'api' };
          source = 'api';
        }
      } catch (error) {
        if (error.status !== 401 && error.status !== 403) throw error;
        result = saveLocally(layout, preview);
      }
    }

    if (!result) {
      result = saveLocally(layout, preview);
    }

    RefreshService.refreshAfterSave({
      layoutId: layout.id,
      ventureId: layout.ventureId || venture?.id,
      summary: result.summary || preview.summary,
      plots: result.plots || preview.plots,
      source,
    });

    return result;
  },
};

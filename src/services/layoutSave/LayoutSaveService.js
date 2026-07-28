import { layoutService } from '../../shared/services/layoutService.js';
import { PlotCreationService } from '../../shared/services/plotCreation/index.js';
import { getAuthToken } from '../auth/authStorage.js';
import { buildLayoutSavePayload } from './PlotSaveService.js';
import { RefreshService } from './RefreshService.js';
import { prepareVentureForCatalogSync } from '../../shared/services/ventureCatalogSync.js';

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

async function getSavedGeneratedLayout(layoutId, token) {
  const response = await fetch(
    `${API_BASE}/v1/admin/plot-inventory/layouts/${layoutId}/generated`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Load failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  const body = await response.json();
  return body.data || null;
}

function saveLocally(layout, payload, apiData = null) {
  const plotRecords = apiData?.plots || payload.plots;
  PlotCreationService.createPlotsLocally({
    layoutId: layout.id,
    plots: plotRecords,
    source: PlotCreationService.SOURCES.GENERATOR,
    mode: PlotCreationService.MODES.REPLACE,
  });

  const snapshot = {
    configuration: apiData?.configuration || payload.configuration,
    blocks: apiData?.blocks || payload.blockLabels,
    roads: apiData?.roads || payload.roads,
    amenities: apiData?.amenities || payload.amenities,
    blockLabels: apiData?.blocks || payload.blockLabels,
    summary: apiData?.summary || {
      plots: plotRecords.length,
      roads: payload.roads.length,
      amenities: payload.amenities.length,
      blocks: payload.blockLabels.length,
    },
    savedAt: new Date().toISOString(),
  };

  layoutService.saveGenerationSnapshot(layout.id, snapshot);

  return {
    ...snapshot,
    plots: plotRecords,
    source: 'local',
  };
}

export const LayoutSaveService = {
  async saveGeneratedLayout({ layout, venture, preview, generationForm }) {
    if (!layout?.id) throw new Error('Layout is required.');
    if (!preview?.plots?.length) throw new Error('Generate a preview before saving.');

    const preparedVenture = venture
      ? (await prepareVentureForCatalogSync(venture).catch(() => venture))
      : null;
    const payload = buildLayoutSavePayload({
      layout,
      venture: preparedVenture || venture,
      preview,
      generationForm,
    });
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
            plots: data.plots || [],
            source: PlotCreationService.SOURCES.GENERATOR,
            mode: PlotCreationService.MODES.REPLACE,
          });
          layoutService.saveGenerationSnapshot(layout.id, {
            configuration: data.configuration,
            blocks: data.blocks,
            roads: data.roads,
            amenities: data.amenities,
            blockLabels: data.blocks,
            summary: data.summary,
            savedAt: new Date().toISOString(),
          }, { source: 'api' });
          result = { ...data, source: 'api' };
          source = 'api';
        }
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          result = saveLocally(layout, payload);
          source = 'local';
        } else {
          throw error;
        }
      }
    }

    if (!result) {
      result = saveLocally(layout, payload);
      source = 'local';
    }

    RefreshService.refreshAfterSave({
      layoutId: layout.id,
      ventureId: layout.ventureId || venture?.id,
      summary: result.summary,
      plots: result.plots,
      source,
    });

    return result;
  },

  async loadSavedLayout(layoutId) {
    if (!layoutId) return null;

    const localLayout = layoutService.getById(layoutId);
    if (localLayout?.generationSnapshot) {
      return {
        ...localLayout.generationSnapshot,
        source: 'local',
      };
    }

    if (!(await canUseRemoteSave())) return null;

    try {
      const token = getAuthToken();
      const remote = await getSavedGeneratedLayout(layoutId, token);
      if (!remote) return null;

      PlotCreationService.createPlotsLocally({
        layoutId,
        plots: remote.plots || [],
        source: PlotCreationService.SOURCES.GENERATOR,
        mode: PlotCreationService.MODES.REPLACE,
      });
      layoutService.saveGenerationSnapshot(layoutId, {
        configuration: remote.configuration,
        blocks: remote.blocks,
        roads: remote.roads,
        amenities: remote.amenities,
        blockLabels: remote.blocks,
        summary: remote.summary,
        savedAt: new Date().toISOString(),
      });

      return { ...remote, source: 'api' };
    } catch {
      return null;
    }
  },
};

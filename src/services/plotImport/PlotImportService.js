import { PlotCreationService } from '../../shared/services/plotCreation/index.js';

import { getAuthToken } from '../auth/authStorage.js';

import { MapRefreshService } from './MapRefreshService.js';



const API_BASE = import.meta.env.VITE_API_URL || '/api';



async function canUseRemoteImport() {
  return Boolean(getAuthToken());
}



async function postBulkImport(layoutId, rows, layoutMeta, token) {

  // layoutName / ventureName are TRANSPORT METADATA for the backend only.
  // Local inventory persistence never stores these parent fields (SSOT Phase 2).
  const response = await fetch(`${API_BASE}/v1/admin/plot-inventory/bulk-import`, {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${token}`,

    },

    body: JSON.stringify({

      layoutId,

      layoutName: layoutMeta?.name,

      ventureId: layoutMeta?.ventureId,

      ventureName: layoutMeta?.ventureName,

      rows: PlotCreationService.toImportPayloadRows(rows, PlotCreationService.SOURCES.EXCEL),

    }),

  });



  if (!response.ok) {

    const body = await response.json().catch(() => ({}));

    const error = new Error(body.message || `Import failed (${response.status})`);

    error.status = response.status;

    throw error;

  }



  return response.json();

}



function importLocally(validRows, layoutId) {

  const localResult = PlotCreationService.createPlotsLocally({

    layoutId,

    plots: validRows,

    source: PlotCreationService.SOURCES.EXCEL,

    mode: PlotCreationService.MODES.APPEND,

  });

  return {

    summary: localResult.summary,

    plots: localResult.plots,

    statistics: localResult.statistics,

    source: 'local',

  };

}



export const PlotImportService = {

  /**

   * Persist validated rows. Uses PostgreSQL API when backend is ready and user is logged in;

   * otherwise saves to local plot inventory (localStorage).

   */

  async importPlots(validRows, { layoutId, layout } = {}) {

    if (!layoutId) throw new Error('Layout is required for import.');

    if (!validRows?.length) throw new Error('No valid rows to import.');



    let result;



    if (await canUseRemoteImport()) {

      try {

        const token = getAuthToken();

        const apiResult = await postBulkImport(layoutId, validRows, layout, token);

        if (apiResult?.success) {

          const records = apiResult.data?.plots || apiResult.plots || [];

          PlotCreationService.syncApiPlots(records);

          result = {

            summary: apiResult.data?.summary || apiResult.summary,

            plots: records,

            statistics: apiResult.data?.statistics || apiResult.statistics,

            source: 'api',

          };

        }

      } catch (error) {

        if (error.status === 401 || error.status === 403) {

          result = importLocally(validRows, layoutId);

        } else {

          throw error;

        }

      }

    }



    if (!result) {

      result = importLocally(validRows, layoutId);

    }



    MapRefreshService.refreshAfterImport({

      layoutId,

      imported: result.summary?.imported ?? result.plots.length,

      failed: result.summary?.failed ?? 0,

      duplicates: result.summary?.duplicates ?? 0,

      source: result.source,

    });



    return result;

  },

};



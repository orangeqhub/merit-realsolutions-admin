import { LayoutGenerationService } from '../layoutGeneration/index.js';
import { PlotCreationService } from '../../shared/services/plotCreation/index.js';
import { resolveLayoutView } from '../../shared/services/layoutView.js';

/**
 * Build plot rows for local/API save.
 * Pricing comes from generation form + Venture SSOT defaults (via LayoutGenerationService).
 * Rows contain Plot-owned fields only — no ventureName/layoutName/city/etc.
 */
export function buildPlotSaveRows(previewPlots, generationForm, layout, venture) {
  const rows = LayoutGenerationService.buildPlotRecordsForSave(
    previewPlots,
    generationForm,
    layout,
    venture
  ).map((row) => ({
    ...row,
    blockName: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.blockName || null,
    row: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.row ?? null,
    col: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.col ?? null,
  }));

  return PlotCreationService.toGeneratorPayloadRows(rows);
}

/**
 * Backend / transport payload for generated layout save.
 *
 * TRANSPORT METADATA ONLY (not merged into local Plot records):
 * - layoutName, ventureName — display labels for API payloads
 *
 * Local persistence goes through PlotCreationService → plotService.persistPlots,
 * which strips parent inherited fields (SSOT Phase 2).
 */
export function buildLayoutSavePayload({
  layout,
  venture,
  preview,
  generationForm,
}) {
  const configuration =
    preview.configuration ||
    LayoutGenerationService.getLastConfiguration() ||
    generationForm;

  // Prefer live Venture/Layout names for transport; do not require denormalized layout.ventureName.
  const layoutView = resolveLayoutView(layout, venture);

  return {
    layoutId: layout?.id,
    layoutName: layout?.name || layoutView?.name || '',
    ventureId: layout?.ventureId || venture?.id,
    ventureName: venture?.name || layoutView?.ventureName || '',
    venture: venture
      ? {
          ...venture,
          id: venture.id,
          refId: venture.id,
          village: venture.village || venture.locality,
          locality: venture.village || venture.locality,
          approvalType: venture.approvalType || venture.approval,
          reraNumber: venture.reraNumber || venture.rera,
          dtcpNumber: venture.dtcpNumber || venture.dtcp,
        }
      : null,
    configuration,
    plots: buildPlotSaveRows(preview.plots || [], generationForm, layout, venture),
    roads: preview.roads || [],
    amenities: preview.amenities || [],
    blockLabels: preview.blockLabels || [],
  };
}

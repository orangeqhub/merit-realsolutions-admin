import { LayoutGenerationService } from '../layoutGeneration';
import { PlotCreationService } from '../../shared/services/plotCreation/index.js';

export function buildPlotSaveRows(previewPlots, generationForm, layout) {
  const rows = LayoutGenerationService.buildPlotRecordsForSave(
    previewPlots,
    generationForm,
    layout
  ).map((row) => ({
    ...row,
    blockName: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.blockName || null,
    row: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.row ?? null,
    col: previewPlots.find((plot) => plot.plotNumber === row.plotNumber)?.col ?? null,
  }));

  return PlotCreationService.toGeneratorPayloadRows(rows);
}

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

  return {
    layoutId: layout?.id,
    layoutName: layout?.name,
    ventureId: layout?.ventureId || venture?.id,
    ventureName: layout?.ventureName || venture?.name,
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
    plots: buildPlotSaveRows(preview.plots || [], generationForm, layout),
    roads: preview.roads || [],
    amenities: preview.amenities || [],
    blockLabels: preview.blockLabels || [],
  };
}

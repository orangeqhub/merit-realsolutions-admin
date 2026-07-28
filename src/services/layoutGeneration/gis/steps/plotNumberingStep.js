/**
 * STEP 9 — Plot numbering: block-wise (A101…) or sequential (1, 2, 3…).
 */
export function applyPlotNumbering(plots, config) {
  const mode = config.plotNumbering || 'block-wise';
  const start = config.startingPlotNumber || 101;

  if (mode === 'sequential') {
    plots.forEach((plot, index) => {
      plot.plotNumber = String(start + index);
      plot.id = `generated-${plot.plotNumber}`;
    });
    return plots;
  }

  const byBlock = new Map();
  plots.forEach((plot) => {
    if (!byBlock.has(plot.blockName)) byBlock.set(plot.blockName, []);
    byBlock.get(plot.blockName).push(plot);
  });

  byBlock.forEach((blockPlots) => {
    blockPlots.sort((a, b) => (a.row - b.row) || (a.col - b.col));
    blockPlots.forEach((plot, index) => {
      plot.plotNumber = `${plot.blockName}${start + index}`;
      plot.id = `generated-${plot.blockName}-${plot.plotNumber}`;
    });
  });

  return plots;
}

/**
 * Build plot numbers in row-major order with block prefix: A101, A102, B101…
 */
export function generatePlotNumbers({
  blockName = 'A',
  rows = 1,
  columns = 1,
  startingPlotNumber = 101,
}) {
  const block = String(blockName || 'A').trim().toUpperCase();
  const start = Number(startingPlotNumber);
  const totalRows = Math.max(1, Math.floor(Number(rows) || 1));
  const totalCols = Math.max(1, Math.floor(Number(columns) || 1));

  if (!Number.isFinite(start) || start < 0) {
    throw new Error('Starting plot number must be a valid non-negative number.');
  }

  const numbers = [];
  for (let row = 0; row < totalRows; row += 1) {
    for (let col = 0; col < totalCols; col += 1) {
      const serial = start + row * totalCols + col;
      numbers.push(`${block}${serial}`);
    }
  }

  return numbers;
}

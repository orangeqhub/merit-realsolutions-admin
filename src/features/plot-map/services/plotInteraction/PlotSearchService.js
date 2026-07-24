const SEARCH_FIELDS = [
  (plot) => plot.plotNumber,
  (plot) => plot.blockName,
  (plot) => plot.status,
  (plot) => plot.facing,
  (plot) => plot.areaSqYards,
  (plot) => plot.ratePerSqYard,
  (plot) => plot.finalPrice,
  (plot) => plot.totalPrice,
  (plot) => plot.customer,
  (plot) => plot.dimensions,
];

function normalize(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

export const PlotSearchService = {
  matchesPlot(plot, query) {
    const q = normalize(query);
    if (!q) return true;
    return SEARCH_FIELDS.some((pick) => normalize(pick(plot)).includes(q));
  },

  filterPlots(plots = [], query = '') {
    const q = query.trim();
    if (!q) return plots;
    return plots.filter((plot) => this.matchesPlot(plot, q));
  },

  findBestMatch(plots = [], query = '') {
    const matches = this.filterPlots(plots, query);
    if (!matches.length) return null;

    const q = normalize(query);
    const exact = matches.find((plot) => normalize(plot.plotNumber) === q);
    if (exact) return exact;

    const prefix = matches.find((plot) => normalize(plot.plotNumber).startsWith(q));
    return prefix || matches[0];
  },
};

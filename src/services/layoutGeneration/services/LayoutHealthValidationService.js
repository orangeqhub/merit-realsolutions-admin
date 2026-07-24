import {
  allPointsInsideBBox,
  bboxesOverlap,
  coordKey,
  getItemBBox,
  getItemPoints,
  isValidPolygon,
} from '../layoutGeometryUtils.js';

const REQUIRED_PLOT_FIELDS = [
  'plotNumber',
  'blockName',
  'areaSqYards',
  'dimensions',
  'facing',
  'latitude',
  'longitude',
];

function buildIssue(type, rule, message, refs = {}) {
  return { type, rule, message, ...refs };
}

function computeHealthScore(errors, warnings) {
  const penalty = errors.length * 12 + warnings.length * 3;
  return Math.max(0, Math.min(100, 100 - penalty));
}

export const LayoutHealthValidationService = {
  validateGeneratedLayout({ plots = [], roads = [], amenities = [], boundary = null } = {}) {
    const errors = [];
    const warnings = [];
    const boundaryBBox = boundary ? getItemBBox({ polygonPoints: boundary }) : null;

    const plotNumberMap = new Map();
    plots.forEach((plot) => {
      const key = String(plot.plotNumber || '').trim().toLowerCase();
      if (!key) {
        errors.push(buildIssue('error', 'missing-metadata', 'Plot missing plot number', { plotIds: [plot.id] }));
        return;
      }
      if (plotNumberMap.has(key)) {
        errors.push(buildIssue(
          'error',
          'duplicate-plot-number',
          `Duplicate plot number "${plot.plotNumber}"`,
          { plotIds: [plot.id, plotNumberMap.get(key)] }
        ));
      } else {
        plotNumberMap.set(key, plot.id);
      }
    });

    const coordMap = new Map();
    plots.forEach((plot) => {
      if (!isValidPolygon(plot)) {
        errors.push(buildIssue(
          'error',
          'invalid-polygon',
          `Plot ${plot.plotNumber} has an invalid polygon`,
          { plotIds: [plot.id] }
        ));
        return;
      }

      const anchor = { lat: plot.latitude, lng: plot.longitude };
      const key = coordKey(anchor);
      if (coordMap.has(key)) {
        warnings.push(buildIssue(
          'warning',
          'duplicate-coordinates',
          `Plot ${plot.plotNumber} shares coordinates with another plot`,
          { plotIds: [plot.id, coordMap.get(key)] }
        ));
      } else {
        coordMap.set(key, plot.id);
      }

      const missing = REQUIRED_PLOT_FIELDS.filter((field) => {
        const value = plot[field];
        return value == null || value === '';
      });
      if (missing.length) {
        warnings.push(buildIssue(
          'warning',
          'missing-metadata',
          `Plot ${plot.plotNumber} missing: ${missing.join(', ')}`,
          { plotIds: [plot.id], fields: missing }
        ));
      }

      if (boundaryBBox && !allPointsInsideBBox(getItemPoints(plot), boundaryBBox)) {
        warnings.push(buildIssue(
          'warning',
          'plot-outside-boundary',
          `Plot ${plot.plotNumber} extends outside the layout boundary`,
          { plotIds: [plot.id] }
        ));
      }
    });

    for (let i = 0; i < plots.length; i += 1) {
      const bboxA = getItemBBox(plots[i]);
      for (let j = i + 1; j < plots.length; j += 1) {
        const bboxB = getItemBBox(plots[j]);
        if (bboxesOverlap(bboxA, bboxB, 0.000001)) {
          warnings.push(buildIssue(
            'warning',
            'overlapping-plots',
            `Plots ${plots[i].plotNumber} and ${plots[j].plotNumber} overlap`,
            { plotIds: [plots[i].id, plots[j].id] }
          ));
        }
      }
    }

    roads.forEach((road) => {
      if (!isValidPolygon(road)) {
        errors.push(buildIssue('error', 'invalid-polygon', `Road "${road.name}" has an invalid polygon`, { roadIds: [road.id] }));
        return;
      }

      if (boundaryBBox && !allPointsInsideBBox(getItemPoints(road), boundaryBBox)) {
        warnings.push(buildIssue(
          'warning',
          'road-outside-boundary',
          `Road "${road.name}" extends outside the layout boundary`,
          { roadIds: [road.id] }
        ));
      }

      plots.forEach((plot) => {
        if (bboxesOverlap(getItemBBox(road), getItemBBox(plot), 0.000001)) {
          const roadLabel = road.roadName || road.name || 'Road';
          warnings.push(buildIssue(
            'warning',
            'road-overlaps-plot',
            `${roadLabel} overlaps plot ${plot.plotNumber}`,
            { plotIds: [plot.id], roadIds: [road.id] }
          ));
        }
      });
    });

    amenities.forEach((amenity) => {
      plots.forEach((plot) => {
        if (bboxesOverlap(getItemBBox(amenity), getItemBBox(plot), 0.000001)) {
          warnings.push(buildIssue(
            'warning',
            'amenity-overlaps-plot',
            `${amenity.name || 'Amenity'} overlaps plot ${plot.plotNumber}`,
            { plotIds: [plot.id], amenityIds: [amenity.id] }
          ));
        }
      });
    });

    const dedupedErrors = dedupeIssues(errors);
    const dedupedWarnings = dedupeIssues(warnings);
    const score = computeHealthScore(dedupedErrors, dedupedWarnings);

    return {
      score,
      healthPercent: score,
      errors: dedupedErrors,
      warnings: dedupedWarnings,
      errorCount: dedupedErrors.length,
      warningCount: dedupedWarnings.length,
    };
  },

  collectHighlightPlotIds(health) {
    const ids = new Set();
    [...(health?.errors || []), ...(health?.warnings || [])].forEach((issue) => {
      (issue.plotIds || []).forEach((id) => ids.add(id));
    });
    return [...ids];
  },
};

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    const key = `${issue.rule}:${(issue.plotIds || []).join(',')}:${(issue.roadIds || []).join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

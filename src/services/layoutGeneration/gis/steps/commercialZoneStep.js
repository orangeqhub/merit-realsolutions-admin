/**
 * STEP 8 — Commercial plots prefer entrance, main roads, corners.
 */
export function assignCommercialZone(plots, entrance, roads, config) {
  const threshold = config.commercialPercent / 100;
  const candidates = plots.filter((plot) => {
    const c = plot.center;
    const distEntrance = Math.hypot(c.x - entrance.connectPoint.x, c.y - entrance.connectPoint.y);
    const nearMain = roads.some(
      (r) => (r.roadType === 'main' || r.hierarchy === 'primary')
        && rectsTouch(plot.rect, r.rect, 40)
    );
    const isCorner = plot.cornerPlot;
    return distEntrance < 400 || nearMain || isCorner;
  });

  const count = Math.max(1, Math.floor(plots.length * threshold));
  config.rng.shuffle(candidates).slice(0, count).forEach((p) => {
    p.category = 'commercial';
    p.plotType = 'Commercial';
  });
}

function rectsTouch(a, b, margin = 0) {
  return !(
    a.x + a.w + margin <= b.x
    || b.x + b.w + margin <= a.x
    || a.y + a.h + margin <= b.y
    || b.y + b.h + margin <= a.y
  );
}

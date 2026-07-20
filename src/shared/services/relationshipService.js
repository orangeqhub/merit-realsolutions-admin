import { dataStore } from "../repositories/dataStore.js";

export function getVentureOrThrow(ventureId) {
  const venture = dataStore.getList("ventures").find((v) => v.id === ventureId);
  if (!venture) throw new Error("Venture not found");
  return venture;
}

export function getLayoutOrThrow(layoutId) {
  const layout = dataStore.getList("layouts").find((l) => l.id === layoutId);
  if (!layout) throw new Error("Layout not found");
  return layout;
}

export function getPlotOrThrow(plotId) {
  const plot = dataStore.getList("plots").find((p) => p.id === plotId);
  if (!plot) throw new Error("Plot not found");
  return plot;
}

export function getCompanyOrThrow(companyId) {
  const company = dataStore.getList("companies").find((c) => c.id === companyId);
  if (!company) throw new Error("Company not found");
  return company;
}

/** Ensure layout belongs to venture and plot belongs to layout */
export function assertPlotHierarchy({ ventureId, layoutId, plotId }) {
  if (layoutId) {
    const layout = getLayoutOrThrow(layoutId);
    if (ventureId && layout.ventureId !== ventureId) {
      throw new Error("Layout does not belong to the selected venture");
    }
  }
  if (plotId) {
    const plot = getPlotOrThrow(plotId);
    if (layoutId && plot.layoutId !== layoutId) {
      throw new Error("Plot does not belong to the selected layout");
    }
    if (ventureId && plot.ventureId !== ventureId) {
      throw new Error("Plot does not belong to the selected venture");
    }
  }
}

export function cascadeDeleteVenture(ventureId) {
  const layoutIds = dataStore
    .getList("layouts")
    .filter((l) => l.ventureId === ventureId)
    .map((l) => l.id);

  dataStore.updateList("plots", (plots) =>
    plots.filter((p) => p.ventureId !== ventureId)
  );
  dataStore.updateList("layouts", (layouts) =>
    layouts.filter((l) => l.ventureId !== ventureId)
  );
  dataStore.updateList("properties", (props) =>
    props.filter((p) => p.ventureId !== ventureId)
  );
  dataStore.updateList("ventures", (ventures) =>
    ventures.filter((v) => v.id !== ventureId)
  );

  return { ventureId, layoutIds };
}

export function cascadeDeleteLayout(layoutId) {
  dataStore.updateList("plots", (plots) =>
    plots.filter((p) => p.layoutId !== layoutId)
  );
  dataStore.updateList("layouts", (layouts) =>
    layouts.filter((l) => l.id !== layoutId)
  );
  return { layoutId };
}

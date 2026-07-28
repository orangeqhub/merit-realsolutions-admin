export const ZOOM_LEVEL = { OVERVIEW: 'overview', BLOCK: 'block', DETAIL: 'detail' };
export function getMapRenderLevel(zoom = 18) {
  const value = Number(zoom) || 18;
  return value <= 15 ? ZOOM_LEVEL.OVERVIEW : value <= 17 ? ZOOM_LEVEL.BLOCK : ZOOM_LEVEL.DETAIL;
}
export function computeBoundaryFromPlots() {
  return [];
}
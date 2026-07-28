/** Premium road rendering is temporarily disabled. */
export const ROAD_RENDER_ZOOM = {};
export const PREMIUM_ROAD_THEME = {};
export const normalizeRoadType = (roadType) => String(roadType || 'internal').toLowerCase();
export const getPremiumRoadTheme = () => ({});
export const getPremiumRoadPathOptions = () => ({});
export const getRoadMarkingOptions = () => null;
export const getRoadEdgeOutlineOptions = () => null;
export const formatRoadWidthLabel = (road = {}) => {
  const width = Math.round(Number(road.widthFeet ?? road.roadWidth) || 0);
  return width ? `${width} FT` : '';
};
export const formatRoadDisplayName = (road = {}) => String(road.roadName || road.name || road.label || 'Road');
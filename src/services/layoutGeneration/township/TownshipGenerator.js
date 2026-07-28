import { generateGisTownshipLayout, estimateGisTownshipStatistics } from '../gis/GisTownshipEngine.js';

/** @deprecated — use GIS engine via generatePremiumTownshipLayout */
export function generatePremiumTownshipLayout(params, originLat, originLng) {
  return generateGisTownshipLayout(params, originLat, originLng);
}

export function estimateTownshipStatistics(params) {
  return estimateGisTownshipStatistics(params);
}

import { haversineDistanceMeters } from '../../../shared/utils/geoValidation.js';

export const OFF_SITE_THRESHOLD_METERS = 150;

const validationCache = new Map();
const shownNotificationKeys = new Set();

function buildPlotFingerprint(plots = []) {
  if (!plots.length) return 'empty';
  return `${plots.length}:${plots
    .map((plot) => plot.id)
    .sort()
    .join(',')}`;
}

function getPlotAnchor(plot) {
  const lat = plot.latitude ?? plot.polygonPoints?.[0]?.lat;
  const lng = plot.longitude ?? plot.polygonPoints?.[0]?.lng;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function findOffSitePlots(plots, center, thresholdMeters = OFF_SITE_THRESHOLD_METERS) {
  if (!center) return [];

  return plots.filter((plot) => {
    const anchor = getPlotAnchor(plot);
    if (!anchor) return false;
    return haversineDistanceMeters(center, anchor) > thresholdMeters;
  });
}

export const LayoutValidationService = {
  OFF_SITE_THRESHOLD_METERS,

  validateLayoutPlots(plots = [], center, layoutId) {
    const fingerprint = buildPlotFingerprint(plots);
    const cacheKey = layoutId || 'unknown';
    const cached = validationCache.get(cacheKey);

    if (cached?.fingerprint === fingerprint) {
      return cached.result;
    }

    const offSitePlots = findOffSitePlots(plots, center);
    const issues = [];

    if (offSitePlots.length) {
      issues.push({
        rule: 'off-site-distance',
        count: offSitePlots.length,
        plotIds: offSitePlots.map((plot) => plot.id),
        thresholdMeters: OFF_SITE_THRESHOLD_METERS,
        message: `${offSitePlots.length} plot${offSitePlots.length === 1 ? '' : 's'} are more than ${OFF_SITE_THRESHOLD_METERS} meters from the layout center.`,
      });
    }

    const result = { fingerprint, issues, offSitePlots };
    validationCache.set(cacheKey, { fingerprint, result });
    return result;
  },

  getNotificationKey(layoutId, rule, fingerprint) {
    return `${layoutId}:${rule}:${fingerprint}`;
  },

  hasShownNotification(key) {
    return shownNotificationKeys.has(key);
  },

  markNotificationShown(key) {
    shownNotificationKeys.add(key);
  },

  clearNotificationTracking(layoutId) {
    if (!layoutId) return;
    [...shownNotificationKeys].forEach((key) => {
      if (key.startsWith(`${layoutId}:`)) shownNotificationKeys.delete(key);
    });
  },

  invalidateLayout(layoutId) {
    if (layoutId) validationCache.delete(layoutId);
  },
};

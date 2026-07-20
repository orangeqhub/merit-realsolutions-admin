import { getSiteVisit } from '../services/sales/salesCrmApi.js';
import { readSiteVisitIdFromSearch } from './siteVisitNavigation.js';

export const SITE_VISIT_NOT_FOUND_MESSAGE = 'The requested Site Visit could not be found.';

export function extractSiteVisitIdFromActionUrl(actionUrl) {
  if (!actionUrl) return null;
  try {
    const parsed = new URL(actionUrl, 'http://localhost');
    return readSiteVisitIdFromSearch(parsed.searchParams);
  } catch {
    return null;
  }
}

export function isSiteVisitActionUrl(actionUrl) {
  if (!actionUrl) return false;
  return actionUrl.includes('site-visits') || actionUrl.includes('siteVisitId=');
}

export async function prefetchSiteVisitFromActionUrl(actionUrl) {
  const id = extractSiteVisitIdFromActionUrl(actionUrl);
  if (!id) {
    return { ok: false, id: null, error: SITE_VISIT_NOT_FOUND_MESSAGE };
  }
  try {
    await getSiteVisit(id);
    return { ok: true, id };
  } catch {
    return { ok: false, id, error: SITE_VISIT_NOT_FOUND_MESSAGE };
  }
}

export async function prefetchAdminSiteVisit(id) {
  if (!id) {
    return { ok: false, error: SITE_VISIT_NOT_FOUND_MESSAGE };
  }
  try {
    await getSiteVisit(id);
    return { ok: true, id: String(id) };
  } catch {
    return { ok: false, error: SITE_VISIT_NOT_FOUND_MESSAGE };
  }
}

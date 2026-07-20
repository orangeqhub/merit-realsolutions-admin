export function readSiteVisitIdFromSearch(searchParams) {
  if (!searchParams) return null;
  return searchParams.get('siteVisitId')
    || searchParams.get('open')
    || searchParams.get('highlight');
}

export function buildAdminSiteVisitUrl(siteVisitId, tab = 'visits') {
  if (siteVisitId == null || siteVisitId === '') {
    return `/dashboard/sales-crm/site-visits?tab=${tab}`;
  }
  const params = new URLSearchParams({ tab, siteVisitId: String(siteVisitId) });
  return `/dashboard/sales-crm/site-visits?${params.toString()}`;
}

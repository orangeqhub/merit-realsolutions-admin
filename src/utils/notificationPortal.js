'use strict';

export const RECORD_UNAVAILABLE_MESSAGE = 'This record no longer exists.';

export function detectPortalKind() {
  return 'admin';
}

function readQueryParam(url, key) {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.searchParams.get(key);
  } catch {
    return null;
  }
}

function withHighlight(base, value) {
  if (!value) return base;
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}highlight=${encodeURIComponent(value)}`;
}

function withSiteVisitId(base, value) {
  if (!value) return base;
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}siteVisitId=${encodeURIComponent(value)}`;
}

export function rewriteActionUrlForPortal(url) {
  if (!url || typeof url !== 'string') return url;

  let path = url.trim();
  if (!path.startsWith('/')) return path;
  if (path.startsWith('/admin/')) path = path.replace(/^\/admin\//, '/dashboard/');
  if (path.startsWith('/dashboard/')) return path;

  const siteVisitId = readQueryParam(path, 'siteVisitId') || readQueryParam(path, 'open');
  const highlight = readQueryParam(path, 'highlight');

  if (path.startsWith('/sales/meetings')) {
    if (siteVisitId) {
      return withSiteVisitId('/dashboard/sales-crm/site-visits?tab=visits', siteVisitId);
    }
    if (highlight) return withHighlight('/dashboard/sales-crm/meetings', highlight);
    return '/dashboard/sales-crm/meetings';
  }
  if (path.startsWith('/sales/customers/')) {
    const userId = path.match(/\/customers\/(\d+)/)?.[1];
    return userId ? `/dashboard/users/${userId}` : '/dashboard/sales-crm/customer-assignment';
  }
  if (path.startsWith('/sales/bookings')) {
    return highlight ? `/dashboard/property-bookings/${highlight}` : '/dashboard/property-bookings';
  }
  if (path.startsWith('/sales/payments')) {
    return highlight ? `/dashboard/property-payments/${highlight}` : '/dashboard/property-payments';
  }
  if (path.startsWith('/sales/properties/')) {
    const propertyRef = path.match(/\/properties\/([^/?]+)/)?.[1];
    return propertyRef ? `/dashboard/properties/${propertyRef}` : '/dashboard/properties';
  }
  if (path.startsWith('/customer/')) {
    return '/dashboard/sales-crm/notifications';
  }

  return path;
}

export function isCrossPortalUrl(url) {
  if (!url) return false;
  if (url.includes('/login')) return true;
  return (url.startsWith('/sales/') || url.startsWith('/customer/')) && !url.startsWith('/dashboard/');
}

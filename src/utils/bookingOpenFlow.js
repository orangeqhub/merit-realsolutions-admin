import { getBookingDetail } from '../services/booking/bookingApi.js';

export const BOOKING_NOT_FOUND_MESSAGE = 'This booking is no longer available or could not be found.';

export function extractBookingIdFromActionUrl(actionUrl) {
  if (!actionUrl) return null;
  try {
    const parsed = new URL(actionUrl, 'http://localhost');
    const match = parsed.pathname.match(/\/dashboard\/property-bookings\/([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function isPropertyBookingActionUrl(actionUrl) {
  if (!actionUrl) return false;
  return /\/dashboard\/property-bookings\//.test(actionUrl);
}

export async function prefetchBookingFromActionUrl(actionUrl) {
  const bookingKey = extractBookingIdFromActionUrl(actionUrl);
  if (!bookingKey) return { ok: true };

  try {
    await getBookingDetail(bookingKey);
    return { ok: true };
  } catch {
    return { ok: false, error: BOOKING_NOT_FOUND_MESSAGE };
  }
}

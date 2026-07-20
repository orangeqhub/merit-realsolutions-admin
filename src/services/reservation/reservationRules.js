import { ignoresExpiry, isExpirable } from "./reservationStatus.js";

const MS_DAY = 86400000;

export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function isWorkingDay(dateStr, settings) {
  if (!settings?.workingDaysOnly) return true;
  const day = new Date(dateStr).getDay();
  const allowed = settings.workingDays || [1, 2, 3, 4, 5, 6];
  return allowed.includes(day);
}

export function computeExpiryDate(reservationDate, settings, extensions = 0) {
  const baseDays = (settings?.validityDays || 15) + extensions;
  let expiry = reservationDate;
  let added = 0;
  while (added < baseDays) {
    expiry = addDays(expiry, 1);
    if (isWorkingDay(expiry, settings)) added += 1;
  }
  return expiry;
}

export function computeMinimumAmount(plotPrice, settings) {
  const price = Number(plotPrice) || 0;
  const pct = Number(settings?.minimumReservationPercent) || 10;
  const flat = Number(settings?.minimumReservationFlat) || 0;
  const fromPct = Math.round((price * pct) / 100);
  return Math.max(fromPct, flat);
}

export function computeRemainingTime(expiryDate, now = new Date()) {
  if (!expiryDate) {
    return { days: 0, hours: 0, totalHours: 0, expired: true };
  }
  const end = new Date(`${expiryDate}T23:59:59`);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, totalHours: 0, expired: true };
  }
  const totalHours = Math.floor(diff / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { days, hours, totalHours, expired: false };
}

export function isPastExpiry(expiryDate, now = new Date()) {
  return computeRemainingTime(expiryDate, now).expired;
}

export function isInGracePeriod(reservation, settings, now = new Date()) {
  if (!reservation?.expiryDate) return false;
  const grace = Number(settings?.gracePeriodDays) || 0;
  if (!grace) return false;
  const expiry = new Date(`${reservation.expiryDate}T23:59:59`);
  const graceEnd = expiry.getTime() + grace * MS_DAY;
  return now.getTime() > expiry.getTime() && now.getTime() <= graceEnd;
}

export function shouldAutoRelease(reservation, settings, now = new Date()) {
  if (!settings?.autoReleaseEnabled || !reservation?.autoReleaseEnabled) return false;
  if (!isExpirable(reservation.status)) return false;
  if (ignoresExpiry(reservation.status)) return false;
  if (!isPastExpiry(reservation.expiryDate, now)) return false;
  if (isInGracePeriod(reservation, settings, now)) return false;
  return true;
}

export function hasActiveReservationForPlot(reservations, plotId, excludeId) {
  return reservations.some(
    (r) =>
      r.plotId === plotId &&
      r.id !== excludeId &&
      ["Reserved", "Confirmed", "Registered"].includes(r.status)
  );
}

export function canReservePlot(plotStatus, reservations, plotId) {
  if (plotStatus !== "Available") return false;
  return !hasActiveReservationForPlot(reservations, plotId);
}

export function validateNoOverlap(reservations, plotId, excludeId) {
  return !hasActiveReservationForPlot(reservations, plotId, excludeId);
}

export function canExtend(reservation, settings) {
  const max = Number(settings?.maxExtensions) || 3;
  const count = Number(reservation?.extensionsCount) || 0;
  return count < max && ["Reserved", "Confirmed"].includes(reservation?.status);
}

export function getDueReminders(reservation, settings, now = new Date()) {
  if (!isExpirable(reservation.status)) return [];
  const remaining = computeRemainingTime(reservation.expiryDate, now);
  if (remaining.expired) return [{ type: "expired", label: "Expired", daysLeft: 0 }];
  const sent = new Set((reservation.reminders || []).map((r) => r.type));
  const due = [];
  (settings?.reminderFrequencyDays || [5, 2, 1]).forEach((days) => {
    const type = `${days}-days`;
    if (remaining.days <= days && !sent.has(type)) {
      due.push({
        type,
        label: days === 1 ? "Final Reminder" : `${days} Days Remaining`,
        daysLeft: remaining.days,
      });
    }
  });
  return due;
}

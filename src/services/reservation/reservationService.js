import {
  computeMinimumAmount,
  computeRemainingTime,
  shouldAutoRelease,
} from "./reservationRules.js";
import { getStatusMeta, isActiveReservation } from "./reservationStatus.js";

const TODAY = () => new Date().toISOString().split("T")[0];
const MS_DAY = 86400000;

export function getPriority(reservation) {
  if (reservation.status !== "Reserved") return "Normal";
  if (reservation.isExpired) return "High";
  if (reservation.remainingDays <= 2) return "High";
  if (reservation.remainingDays <= 5) return "Medium";
  return "Normal";
}

function rangeKey(dateStr) {
  return dateStr ? new Date(dateStr).getTime() : 0;
}

export function computeAverageAgeDays(reservations) {
  const today = new Date(`${TODAY()}T00:00:00`).getTime();
  const active = reservations.filter((r) => ["Reserved", "Confirmed", "Registered"].includes(r.status));
  if (!active.length) return 0;
  const total = active.reduce((s, r) => {
    const start = new Date(`${r.reservationDate}T00:00:00`).getTime();
    return s + Math.max(0, Math.floor((today - start) / MS_DAY));
  }, 0);
  return Math.round(total / active.length);
}

export function getProcessingKpis(reservations, settings) {
  const today = TODAY();
  const enriched = enrichReservations(reservations, settings);
  const active = enriched.filter((r) => ["Reserved", "Confirmed", "Registered"].includes(r.status));
  const reserved = enriched.filter((r) => r.status === "Reserved");
  const pendingVerification = reserved.filter((r) => !r.verification?.completed).length;
  const expiringToday = reserved.filter((r) => r.expiryDate === today && !r.isExpired).length;
  const expiringThisWeek = reserved.filter((r) => !r.isExpired && r.remainingDays <= 7).length;
  const confirmedToday = enriched.filter((r) => r.status === "Confirmed" && r.timeline?.some((t) => t.type === "confirmed" && t.date === today)).length;
  const released = enriched.filter((r) => r.status === "Released").length;
  const cancelled = enriched.filter((r) => r.status === "Cancelled").length;
  const reservationValue = active.reduce((s, r) => s + (Number(r.reservationAmount) || 0), 0);
  const avgAge = computeAverageAgeDays(enriched);

  // Simple trend: compare last 7 days vs previous 7 days (reservationDate)
  const end = new Date(`${today}T00:00:00`).getTime();
  const start7 = end - 7 * MS_DAY;
  const start14 = end - 14 * MS_DAY;
  const prev7 = enriched.filter((r) => rangeKey(r.reservationDate) >= start14 && rangeKey(r.reservationDate) < start7).length;
  const trend = (cur, prev) => ({
    direction: cur >= prev ? "up" : "down",
    value: prev ? `${Math.round(((cur - prev) / prev) * 100)}%` : cur ? "+100%" : "0%",
  });

  return {
    totalActive: active.length,
    pendingVerification,
    expiringToday,
    expiringThisWeek,
    confirmedToday,
    releasedReservations: released,
    cancelledReservations: cancelled,
    reservationValue,
    averageReservationAge: avgAge,
    trends: {
      totalActive: trend(active.length, prev7),
      pendingVerification: trend(pendingVerification, Math.max(0, prev7 - 1)),
      reservationValue: trend(Math.round(reservationValue / 100000), Math.max(1, Math.round((reservationValue / 100000) * 0.9))),
    },
  };
}

export function enrichReservation(reservation, settings) {
  const remaining = computeRemainingTime(reservation.expiryDate);
  return {
    ...reservation,
    remainingDays: remaining.days,
    remainingHours: remaining.hours,
    remainingTotalHours: remaining.totalHours,
    isExpired: remaining.expired,
    minimumReservationAmount:
      reservation.minimumReservationAmount ||
      computeMinimumAmount(reservation.totalValue, settings),
  };
}

export function enrichReservations(reservations, settings) {
  return reservations.map((r) => enrichReservation(r, settings));
}

export function getDashboardStats(reservations, settings) {
  const today = TODAY();
  const enriched = enrichReservations(reservations, settings);

  const active = enriched.filter((r) => isActiveReservation(r.status));
  const reserved = enriched.filter((r) => r.status === "Reserved");
  const confirmed = enriched.filter((r) => r.status === "Confirmed");
  const cancelled = enriched.filter((r) => r.status === "Cancelled");
  const released = enriched.filter((r) => r.status === "Released");
  const todays = enriched.filter((r) => r.reservationDate === today);
  const expiringToday = reserved.filter((r) => r.expiryDate === today && !r.isExpired);
  const expired = reserved.filter((r) => r.isExpired);

  const totalValue = active.reduce((s, r) => s + (Number(r.totalValue) || 0), 0);
  const pipeline = active.reduce((s, r) => s + (Number(r.reservationAmount) || 0), 0);
  const conversionBase = enriched.filter((r) => !["Released"].includes(r.status)).length;
  const converted = enriched.filter((r) =>
    ["Confirmed", "Registered", "Completed"].includes(r.status)
  ).length;
  const conversionRate = conversionBase ? Math.round((converted / conversionBase) * 100) : 0;

  return {
    total: enriched.length,
    active: active.length,
    reserved: reserved.length,
    confirmed: confirmed.length,
    cancelled: cancelled.length,
    released: released.length,
    todays: todays.length,
    expiringToday: expiringToday.length,
    expired: expired.length,
    totalValue,
    pipeline,
    conversionRate,
  };
}

export function getTrendData(reservations) {
  const months = {};
  reservations.forEach((r) => {
    const key = (r.reservationDate || "").slice(0, 7);
    if (!key) return;
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, value]) => ({
      label: new Date(`${month}-01`).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      value,
    }));
}

export function getStatusDistribution(reservations) {
  const counts = {};
  reservations.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  return Object.entries(counts).map(([status, value]) => ({
    label: getStatusMeta(status).label,
    value,
    status,
  }));
}

export function getExpiryAnalysis(reservations, settings) {
  const enriched = enrichReservations(reservations, settings);
  const buckets = [
    { label: "0–3 days", value: 0 },
    { label: "4–7 days", value: 0 },
    { label: "8–15 days", value: 0 },
    { label: "Expired", value: 0 },
  ];
  enriched
    .filter((r) => r.status === "Reserved")
    .forEach((r) => {
      if (r.isExpired) buckets[3].value += 1;
      else if (r.remainingDays <= 3) buckets[0].value += 1;
      else if (r.remainingDays <= 7) buckets[1].value += 1;
      else buckets[2].value += 1;
    });
  return buckets;
}

export function getRecentActivities(reservations, limit = 12) {
  const items = [];
  reservations.forEach((r) => {
    (r.timeline || []).forEach((t) => {
      items.push({
        ...t,
        reservationId: r.id,
        reservationRef: r.reference || r.id,
        customerName: r.customerName,
        plotNumber: r.plotNumber,
        ventureName: r.ventureName,
      });
    });
  });
  return items
    .sort((a, b) => `${b.date} ${b.time || ""}`.localeCompare(`${a.date} ${a.time || ""}`))
    .slice(0, limit);
}

export function aggregateActivityLogs(reservations) {
  const logs = [];
  reservations.forEach((r) => {
    (r.activityLog || []).forEach((entry) => {
      logs.push({
        ...entry,
        reservationId: r.id,
        reservationRef: r.reference || r.id,
        customerName: r.customerName,
        plotNumber: r.plotNumber,
      });
    });
  });
  return logs.sort((a, b) => `${b.timestamp}`.localeCompare(`${a.timestamp}`));
}

export function assignPlotGridPositions(plots, cols = 5) {
  return plots.map((plot, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cellW = 100 / cols;
    const rows = Math.ceil(plots.length / cols);
    const cellH = 100 / rows;
    return {
      id: plot.id,
      number: plot.plotNumber,
      status: (plot.status || "available").toLowerCase(),
      x: col * cellW + cellW * 0.15,
      y: row * cellH + cellH * 0.15,
      plot,
    };
  });
}

export function findAutoReleaseCandidates(reservations, settings, now = new Date()) {
  return reservations.filter((r) => shouldAutoRelease(r, settings, now));
}

export function filterReservations(reservations, { status, ventureId, layoutId, search }) {
  let list = [...reservations];
  if (status && status !== "all") list = list.filter((r) => r.status === status);
  if (ventureId) list = list.filter((r) => r.ventureId === ventureId);
  if (layoutId) list = list.filter((r) => r.layoutId === layoutId);
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((r) =>
      [
        r.id,
        r.reference,
        r.customerName,
        r.partnerName,
        r.plotNumber,
        r.ventureName,
        r.layoutName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  return list;
}

export function getReservationForPlot(reservations, plotId) {
  return (
    reservations.find(
      (r) => r.plotId === plotId && isActiveReservation(r.status)
    ) || null
  );
}

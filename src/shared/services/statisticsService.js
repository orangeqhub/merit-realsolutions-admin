/**
 * Dynamic statistics engine — all KPIs computed from live records.
 * Never hardcode counts or monetary totals.
 */

import { dataStore } from "../repositories/dataStore.js";
import { indexById } from "../utils/indexById.js";
import {
  enrichReservations,
  computeAverageAgeDays,
} from "../../services/reservation/reservationService.js";
import { isActiveReservation } from "../../services/reservation/reservationStatus.js";
import { computePartnerPerformance } from "../../utils/partnerPerformance.js";

const ACTIVE_LEAD_STATUSES = new Set(["New", "Contacted", "Qualified", "Negotiation", "Site Visit"]);
const PLOT_STATUSES = ["Available", "Reserved", "Confirmed", "Registered", "Sold", "Blocked", "Booked"];

function countByStatus(plots, status) {
  return plots.filter((p) => p.status === status).length;
}

function sumPlotValue(plots, statusFilter) {
  const filtered = statusFilter ? plots.filter((p) => statusFilter.includes(p.status)) : plots;
  return filtered.reduce((s, p) => s + (Number(p.finalPrice || p.totalPrice || p.offerPrice) || 0), 0);
}

function getCtx() {
  const plots = dataStore.getList("plots");
  const layouts = dataStore.getList("layouts");
  const ventures = dataStore.getList("ventures");
  const properties = dataStore.getList("properties");
  const customers = dataStore.getList("customers");
  const bookings = dataStore.getList("bookings");
  const payments = dataStore.getList("payments");
  const leads = dataStore.getList("leads");
  const followups = dataStore.getList("followups");
  const channelPartners = dataStore.getList("channelPartners");
  const reservationsData = dataStore.getObject("reservations") || { reservations: [] };
  const settings = dataStore.getObject("reservationSettings") || {};
  const partnerAssignments = dataStore.getObject("partnerAssignments") || { assignments: {} };
  const reservations = enrichReservations(reservationsData.reservations || [], settings);

  return {
    plots,
    layouts,
    ventures,
    properties,
    customers,
    bookings,
    payments,
    leads,
    followups,
    channelPartners,
    reservations,
    settings,
    partnerAssignments,
    venturesById: indexById(ventures),
    layoutsById: indexById(layouts),
    plotsById: indexById(plots),
    propertiesById: indexById(properties),
    customersById: indexById(customers),
    partnersById: indexById(channelPartners),
    leadsById: indexById(leads),
  };
}

/** Plot inventory statistics from plot records only */
export function getPlotInventoryStatistics(plots = dataStore.getList("plots")) {
  return {
    total: plots.length,
    available: countByStatus(plots, "Available"),
    reserved: countByStatus(plots, "Reserved"),
    confirmed: countByStatus(plots, "Confirmed"),
    registered: countByStatus(plots, "Registered"),
    sold: countByStatus(plots, "Sold"),
    blocked: countByStatus(plots, "Blocked"),
    booked: countByStatus(plots, "Booked"),
    inventoryValue: sumPlotValue(plots, ["Available", "Reserved", "Confirmed", "Registered"]),
    reservedValue: sumPlotValue(plots, ["Reserved", "Confirmed"]),
    soldValue: sumPlotValue(plots, ["Sold", "Registered"]),
  };
}

/** Venture-level statistics derived from layouts + plots */
export function getVentureStatistics(ventureId, ctx = getCtx()) {
  const ventureLayouts = ctx.layouts.filter((l) => l.ventureId === ventureId);
  const venturePlots = ctx.plots.filter((p) => p.ventureId === ventureId);
  const plotStats = getPlotInventoryStatistics(venturePlots);
  const ventureBookings = ctx.bookings.filter(
    (b) => b.ventureId === ventureId && b.status !== "Cancelled"
  );
  const revenue = ventureBookings.reduce((s, b) => s + (Number(b.advancePaid) || 0), 0);
  const activeLeads = ctx.leads.filter(
    (l) => l.interestedVentureId === ventureId && ACTIVE_LEAD_STATUSES.has(l.status)
  ).length;

  return {
    totalLayouts: ventureLayouts.length,
    totalPlots: plotStats.total,
    availablePlots: plotStats.available,
    reservedPlots: plotStats.reserved,
    confirmedPlots: plotStats.confirmed,
    registeredPlots: plotStats.registered,
    soldPlots: plotStats.sold,
    blockedPlots: plotStats.blocked,
    bookedPlots: plotStats.booked,
    inventoryValue: plotStats.inventoryValue,
    reservedValue: plotStats.reservedValue,
    soldValue: plotStats.soldValue,
    revenue,
    activeLeads,
    activeBookings: ventureBookings.filter((b) => b.status === "Active").length,
    totalBookings: ventureBookings.length,
  };
}

/** Venture analytics charts — derived from bookings + plots */
export function getVentureAnalytics(ventureId, ctx = getCtx()) {
  const venturePlots = ctx.plots.filter((p) => p.ventureId === ventureId);
  const plotStats = getPlotInventoryStatistics(venturePlots);
  const ventureBookings = ctx.bookings.filter(
    (b) => b.ventureId === ventureId && b.status !== "Cancelled"
  );

  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const month = d.getMonth();
    const year = d.getFullYear();
    const count = ventureBookings.filter((b) => {
      const bd = new Date(b.bookingDate || b.createdDate);
      return bd.getMonth() === month && bd.getFullYear() === year;
    }).length;
    return { label, value: count };
  });

  const plotStatus = [
    { label: "Available", value: plotStats.available, color: "#059669" },
    { label: "Reserved", value: plotStats.reserved, color: "#7c3aed" },
    { label: "Booked", value: plotStats.booked, color: "#d97706" },
    { label: "Sold", value: plotStats.sold, color: "#2563eb" },
  ].filter((d) => d.value > 0);

  return { monthlySales, plotStatus, plotStats };
}

/** Layout-level statistics derived from plots */
export function getLayoutStatistics(layoutId, ctx = getCtx()) {
  const layout = ctx.layoutsById[layoutId];
  const layoutPlots = ctx.plots.filter((p) => p.layoutId === layoutId);
  const plotStats = getPlotInventoryStatistics(layoutPlots);
  const layoutBookings = ctx.bookings.filter(
    (b) => b.layoutId === layoutId && b.status !== "Cancelled"
  );

  return {
    totalPlots: plotStats.total,
    available: plotStats.available,
    reserved: plotStats.reserved,
    confirmed: plotStats.confirmed,
    registered: plotStats.registered,
    sold: plotStats.sold,
    blocked: plotStats.blocked,
    booked: plotStats.booked,
    totalArea: Number(layout?.totalArea) || layoutPlots.reduce((s, p) => s + (Number(p.areaSqYards) || 0), 0),
    totalValue: plotStats.inventoryValue + plotStats.soldValue,
    revenue: layoutBookings.reduce((s, b) => s + (Number(b.advancePaid) || 0), 0),
    bookingStats: {
      total: layoutBookings.length,
      active: layoutBookings.filter((b) => b.status === "Active").length,
      completed: layoutBookings.filter((b) => b.status === "Completed").length,
    },
  };
}

/** Aggregate venture list statistics */
export function getVenturesAggregateStatistics(ventures = dataStore.getList("ventures"), ctx = getCtx()) {
  const active = ventures.filter((v) => v.status === "Active").length;
  const upcoming = ventures.filter((v) => v.status === "Upcoming").length;
  const completed = ventures.filter((v) => v.status === "Completed").length;

  const allStats = ventures.map((v) => getVentureStatistics(v.id, ctx));

  return {
    total: ventures.length,
    active,
    upcoming,
    completed,
    totalLayouts: allStats.reduce((s, x) => s + x.totalLayouts, 0),
    totalPlots: allStats.reduce((s, x) => s + x.totalPlots, 0),
    availablePlots: allStats.reduce((s, x) => s + x.availablePlots, 0),
    reservedPlots: allStats.reduce((s, x) => s + x.reservedPlots, 0),
    confirmedPlots: allStats.reduce((s, x) => s + x.confirmedPlots, 0),
    registeredPlots: allStats.reduce((s, x) => s + x.registeredPlots, 0),
    soldPlots: allStats.reduce((s, x) => s + x.soldPlots, 0),
    bookedPlots: allStats.reduce((s, x) => s + x.bookedPlots, 0),
    inventoryValue: allStats.reduce((s, x) => s + x.inventoryValue, 0),
    reservedValue: allStats.reduce((s, x) => s + x.reservedValue, 0),
    soldValue: allStats.reduce((s, x) => s + x.soldValue, 0),
    revenue: allStats.reduce((s, x) => s + x.revenue, 0),
  };
}

/** Aggregate layout list statistics */
export function getLayoutsAggregateStatistics(layouts = dataStore.getList("layouts"), ctx = getCtx()) {
  const allStats = layouts.map((l) => getLayoutStatistics(l.id, ctx));
  return {
    total: layouts.length,
    totalArea: allStats.reduce((s, x) => s + x.totalArea, 0),
    totalPlots: allStats.reduce((s, x) => s + x.totalPlots, 0),
    available: allStats.reduce((s, x) => s + x.available, 0),
    reserved: allStats.reduce((s, x) => s + x.reserved, 0),
    confirmed: allStats.reduce((s, x) => s + x.confirmed, 0),
    registered: allStats.reduce((s, x) => s + x.registered, 0),
    sold: allStats.reduce((s, x) => s + x.sold, 0),
    booked: allStats.reduce((s, x) => s + x.booked, 0),
    totalValue: allStats.reduce((s, x) => s + x.totalValue, 0),
    revenue: allStats.reduce((s, x) => s + x.revenue, 0),
  };
}

/** Reservation dashboard statistics */
export function getReservationDashboardStatistics(ctx = getCtx()) {
  const { reservations } = ctx;
  const active = reservations.filter((r) => isActiveReservation(r.status));
  const reserved = reservations.filter((r) => r.status === "Reserved");
  const confirmed = reservations.filter((r) => r.status === "Confirmed");
  const released = reservations.filter((r) => r.status === "Released");
  const cancelled = reservations.filter((r) => r.status === "Cancelled");
  const expired = reserved.filter((r) => r.isExpired);

  return {
    totalReservations: reservations.length,
    activeReservations: active.length,
    expired: expired.length,
    confirmed: confirmed.length,
    released: released.length,
    cancelled: cancelled.length,
    reservationValue: active.reduce((s, r) => s + (Number(r.reservationAmount) || 0), 0),
    averageReservationAge: computeAverageAgeDays(reservations),
  };
}

/** Customer dashboard statistics */
export function getCustomerDashboardStatistics(customerId, ctx = getCtx()) {
  const customer = ctx.customersById[customerId];
  if (!customer) return null;

  const customerReservations = ctx.reservations.filter((r) => r.customerId === customerId);
  const activeReservations = customerReservations.filter((r) => isActiveReservation(r.status)).length;
  const customerBookings = ctx.bookings.filter(
    (b) => b.customerId === customerId && b.status !== "Cancelled"
  );
  const confirmedBookings = customerBookings.filter((b) =>
    ["Active", "Completed"].includes(b.status)
  ).length;
  const purchasedProperties = ctx.properties.filter(
    (p) => p.customerId === customerId && ["Sold", "Registered"].includes(p.status)
  ).length;
  const customerPayments = ctx.payments.filter((p) => p.customerId === customerId);
  const totalPayments = customerPayments
    .filter((p) => p.status === "Completed")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const pendingPayments = customerPayments
    .filter((p) => p.status === "Pending")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return {
    activeReservations,
    confirmedBookings,
    purchasedProperties,
    totalPayments,
    pendingPayments,
    customer,
  };
}

/** Property dashboard statistics */
export function getPropertyDashboardStatistics(properties = dataStore.getList("properties")) {
  return {
    total: properties.length,
    available: properties.filter((p) => p.status === "Available").length,
    reserved: properties.filter((p) => p.status === "Reserved").length,
    sold: properties.filter((p) => p.status === "Sold").length,
    underRegistration: properties.filter((p) => p.status === "Under Registration").length,
  };
}

/** Channel partner dashboard statistics */
export function getPartnerDashboardStatistics(partnerId, ctx = getCtx()) {
  const assignment = ctx.partnerAssignments.assignments?.[partnerId] || {};
  const assignedVentures = (assignment.ventures || []).length;
  const assignedLayouts = (assignment.layouts || []).length;
  const assignedPlots = (assignment.plots || []).length;
  const assignedCustomers = (assignment.customers || []).length;

  const partnerReservations = ctx.reservations.filter((r) => r.partnerId === partnerId);
  const activeReservations = partnerReservations.filter((r) => isActiveReservation(r.status)).length;
  const partnerBookings = ctx.bookings.filter(
    (b) => b.partnerId === partnerId && b.status !== "Cancelled"
  );
  const confirmedBookings = partnerBookings.filter((b) =>
    ["Active", "Completed"].includes(b.status)
  ).length;
  const revenue = partnerBookings.reduce((s, b) => s + (Number(b.advancePaid) || 0), 0);
  const partnerLeads = ctx.leads.filter(
    (l) => l.assignedPartnerId === partnerId && ACTIVE_LEAD_STATUSES.has(l.status)
  );
  const converted = partnerBookings.length;
  const conversionBase = partnerLeads.length + converted;
  const conversionRate = conversionBase ? Math.round((converted / conversionBase) * 100) : 0;

  return {
    assignedVentures,
    assignedLayouts,
    assignedPlots,
    assignedCustomers,
    activeReservations,
    confirmedBookings,
    revenue,
    conversionRate,
    activeLeads: partnerLeads.length,
  };
}

function formatINRShort(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Main ERP dashboard metrics */
export function getDashboardMetrics(ctx = getCtx()) {
  const plotStats = getPlotInventoryStatistics(ctx.plots);
  const propertyStats = getPropertyDashboardStatistics(ctx.properties);
  const activeBookings = ctx.bookings.filter((b) => b.status === "Active");
  const completedPayments = ctx.payments.filter((p) => p.status === "Completed");
  const pendingPayments = ctx.payments.filter((p) => p.status === "Pending");
  const totalRevenue = completedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const pendingAmount = pendingPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const activeLeads = ctx.leads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status)).length;
  const approvedPartners = ctx.channelPartners.filter((p) => p.status === "Approved");

  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthPayments = completedPayments.filter((p) => {
      const pd = new Date(p.paidDate || p.createdDate);
      return pd.getMonth() === month && pd.getFullYear() === year;
    });
    const value = Math.round(monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) / 100000);
    return { month: label, value };
  });

  const recentActivity = [
    ...ctx.bookings
      .slice(-3)
      .reverse()
      .map((b) => ({
        time: b.bookingDate,
        text: `Booking ${b.bookingNumber} — ${b.plotNumber || b.propertyName} (${b.status})`,
        type: "booking",
      })),
    ...ctx.payments
      .slice(-2)
      .reverse()
      .map((p) => ({
        time: p.paidDate || p.createdDate,
        text: `Payment ${formatINRShort(p.amount)} from ${p.customerName}`,
        type: "payment",
      })),
  ].slice(0, 5);

  const getAssignment = (partnerId) =>
    ctx.partnerAssignments.assignments?.[partnerId] || { metrics: {} };

  return {
    properties: propertyStats.total,
    totalVentures: ctx.ventures.length,
    ventures: ctx.ventures.filter((v) => v.status === "Active").length,
    totalLayouts: ctx.layouts.length,
    totalPlots: plotStats.total,
    totalReservations: ctx.reservations.length,
    customers: ctx.customers.length,
    pendingPayments: pendingAmount,
    activeLeads,
    activeBookings: activeBookings.length,
    soldPlots: plotStats.sold,
    availablePlots: plotStats.available,
    reservedPlots: plotStats.reserved,
    totalRevenue,
    monthlyRevenue,
    recentVentures: ctx.ventures.slice(0, 5).map((v) => {
      const stats = getVentureStatistics(v.id, ctx);
      return {
        id: v.id,
        name: v.name,
        location: v.city,
        plots: stats.totalPlots,
        sold: stats.soldPlots,
        status: v.status,
      };
    }),
    recentActivity,
    partnerRevenue: approvedPartners.reduce((s, p) => {
      const perf = computePartnerPerformance(p.id, {
        ...ctx,
        getAssignment,
        partnersById: ctx.partnersById,
      });
      return s + (perf?.kpi?.revenueGenerated || 0);
    }, 0),
  };
}

export { getCtx, ACTIVE_LEAD_STATUSES, PLOT_STATUSES };

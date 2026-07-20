/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { PlotsProvider } from "./PlotsContext";
import { useCollection, useStoreObject } from "../shared/hooks/useDataStore.js";
import { dataStore } from "../shared/repositories/dataStore.js";
import { plotService } from "../shared/services/plotService.js";
import { indexById } from "../shared/utils/indexById.js";
import {
  canExtend,
  canReservePlot,
  computeExpiryDate,
  computeMinimumAmount,
  computeRemainingTime,
  getDueReminders,
  shouldAutoRelease,
  validateNoOverlap,
} from "../services/reservation/reservationRules";
import {
  canTransition,
  isActiveReservation,
} from "../services/reservation/reservationStatus";
import {
  aggregateActivityLogs,
  enrichReservation,
  enrichReservations,
  filterReservations,
  findAutoReleaseCandidates,
  getDashboardStats,
  getExpiryAnalysis,
  getRecentActivities,
  getReservationForPlot,
  getStatusDistribution,
  getTrendData,
} from "../services/reservation/reservationService";

const ReservationContext = createContext(null);
const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().split("T")[0];

function appendTimeline(reservation, event) {
  return {
    ...reservation,
    timeline: [...(reservation.timeline || []), event],
  };
}

function appendActivity(reservation, entry) {
  return {
    ...reservation,
    activityLog: [...(reservation.activityLog || []), entry],
  };
}

function makeLog(reservation, user, role, action, remarks, meta = {}) {
  const seq = (reservation.activityLog?.length || 0) + 1;
  return {
    id: `LOG-${reservation.id.replace("RSV-", "")}-${String(seq).padStart(2, "0")}`,
    user,
    role,
    action,
    previousStatus: meta.previousStatus,
    newStatus: meta.newStatus,
    timestamp: nowIso(),
    remarks,
  };
}

function normalizeVerification(reservation) {
  if (reservation?.verification) return reservation;
  const completed = ["Confirmed", "Registered", "Completed"].includes(reservation.status);
  return {
    ...reservation,
    verification: {
      status: completed ? "Completed" : "Not Started",
      startedAt: null,
      completedAt: completed ? reservation.reservationDate : null,
      checklist: {
        customerDetails: completed,
        identityDocs: completed,
        reservationAmount: completed,
        channelPartner: completed,
        plotAvailability: completed,
      },
      remarks: "",
      completed,
    },
    extensions: reservation.extensions || [],
  };
}

export function ReservationProvider({ children }) {
  const data = useStoreObject("reservations") || { reservations: [] };
  const settings = useStoreObject("reservationSettings") || {};
  const rules = useStoreObject("reservationRules") || [];
  const customersList = useCollection("customers");
  const partnersList = useCollection("channelPartners");
  const venturesList = useCollection("ventures");
  const layoutsList = useCollection("layouts");
  const plotsList = useCollection("plots");

  const value = useMemo(() => {
    const normalized = (data.reservations || []).map(normalizeVerification);
    const reservations = enrichReservations(normalized, settings);
    const customersById = indexById(customersList);
    const partnersById = indexById(partnersList);
    const venturesById = indexById(venturesList);
    const layoutsById = indexById(layoutsList);
    const plotsById = indexById(plotsList);

    const getPlotState = (plotId) => plotsById[plotId] || null;

    const syncPlotOverride = (plotId, patch) => {
      plotService.setStatus(plotId, patch.status || plotsById[plotId]?.status, patch);
    };

    const getReservation = (id) => reservations.find((r) => r.id === id) || null;

    const getByCustomer = (customerId) =>
      reservations.filter((r) => r.customerId === customerId);

    const getByPartner = (partnerId) =>
      reservations.filter((r) => r.partnerId === partnerId);

    const getByVenture = (ventureId) =>
      reservations.filter((r) => r.ventureId === ventureId);

    const getByLayout = (layoutId) =>
      reservations.filter((r) => r.layoutId === layoutId);

    const getByPlot = (plotId) => reservations.filter((r) => r.plotId === plotId);

    const getActiveForPlot = (plotId) => getReservationForPlot(reservations, plotId);

    const updateReservation = (id, updater) => {
      dataStore.updateObject("reservations", (prev) => ({
        ...prev,
        reservations: (prev.reservations || []).map((r) =>
          r.id === id ? (typeof updater === "function" ? updater(r) : { ...r, ...updater }) : r
        ),
      }));
    };

    const assignPartnerToReservation = (
      id,
      partnerId,
      { user = "Administrator", role = "Administrator", remarks = "" } = {}
    ) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current) return { ok: false, error: "Reservation not found" };
      const partner = partnerId ? partnersById[partnerId] : null;
      const partnerName = partner?.personal
        ? `${partner.personal.firstName} ${partner.personal.lastName}`
        : partner?.companyName || null;

      const event = {
        type: "partner-assigned",
        title: "Partner Assigned",
        description: partnerName ? `Assigned to ${partnerName}` : "Partner removed",
        date: today(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        tone: "accent",
        actor: user,
      };

      let next = { ...current, partnerId: partnerId || null, partnerName };
      next = appendTimeline(next, event);
      next = appendActivity(
        next,
        makeLog(next, user, role, "PARTNER_ASSIGNED", remarks || event.description)
      );
      updateReservation(id, next);
      return { ok: true, reservation: enrichReservation(next, settings) };
    };

    const transitionReservation = (id, nextStatus, { user = "Administrator", role = "Administrator", remarks = "" } = {}) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current || !canTransition(current.status, nextStatus)) {
        return { ok: false, error: `Cannot transition from ${current?.status} to ${nextStatus}` };
      }

      const event = {
        type: nextStatus.toLowerCase(),
        title: `Reservation ${nextStatus}`,
        description: remarks || `Status changed to ${nextStatus}`,
        date: today(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        tone: nextStatus === "Cancelled" || nextStatus === "Released" ? "danger" : "success",
        actor: user,
      };

      let next = appendTimeline(current, event);
      next = appendActivity(
        next,
        makeLog(
          next,
          user,
          role,
          `RESERVATION_${nextStatus.toUpperCase()}`,
          remarks || event.description,
          { previousStatus: current.status, newStatus: nextStatus }
        )
      );
      next = { ...next, status: nextStatus };

      if (nextStatus === "Released" || nextStatus === "Cancelled") {
        syncPlotOverride(next.plotId, {
          status: "Available",
          customer: null,
          customerId: null,
          reservationExpiry: null,
        });
      } else if (nextStatus === "Confirmed") {
        syncPlotOverride(next.plotId, {
          status: "Booked",
          customer: next.customerName,
          customerId: next.customerId,
        });
      } else if (nextStatus === "Registered") {
        syncPlotOverride(next.plotId, {
          status: "Registered",
          customer: next.customerName,
          customerId: next.customerId,
        });
      } else if (nextStatus === "Completed") {
        syncPlotOverride(next.plotId, {
          status: "Sold",
          customer: next.customerName,
          customerId: next.customerId,
        });
      }

      updateReservation(id, next);
      return { ok: true, reservation: enrichReservation(next, settings) };
    };

    const setVerification = (id, patch, { user = "Administrator", role = "Administrator" } = {}) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current) return { ok: false, error: "Reservation not found" };
      const next = {
        ...current,
        verification: {
          ...current.verification,
          ...patch,
          checklist: {
            ...(current.verification?.checklist || {}),
            ...(patch.checklist || {}),
          },
        },
      };
      updateReservation(id, next);
      const log = makeLog(next, user, role, "VERIFICATION_UPDATED", "Verification checklist updated");
      updateReservation(id, (r) => appendActivity(r, log));
      return { ok: true, reservation: enrichReservation(next, settings) };
    };

    const startVerification = (id, opts) =>
      setVerification(
        id,
        {
          status: "In Progress",
          startedAt: nowIso(),
        },
        opts
      );

    const updateVerificationChecklist = (id, key, checked, opts) =>
      setVerification(
        id,
        {
          checklist: { [key]: checked },
        },
        opts
      );

    const completeVerification = (id, opts) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current) return { ok: false, error: "Reservation not found" };
      const checklist = current.verification?.checklist || {};
      const allDone = ["customerDetails", "identityDocs", "reservationAmount", "channelPartner", "plotAvailability"].every(
        (k) => Boolean(checklist[k])
      );
      if (!allDone) return { ok: false, error: "Complete all verification checklist items before finishing verification" };
      return setVerification(
        id,
        {
          status: "Completed",
          completedAt: nowIso(),
          completed: true,
        },
        opts
      );
    };

    const canConfirmReservation = (reservation) => {
      if (!reservation) return false;
      if (reservation.status !== "Reserved") return false;
      if (!reservation.verification?.completed) return false;
      const plot = getPlotState(reservation.plotId);
      if (!plot) return false;
      if (plot.status && !["Available", "Reserved"].includes(plot.status)) return false;
      return true;
    };

    const createReservation = (payload) => {
      const plot = getPlotState(payload.plotId);
      if (!plot) return { ok: false, error: "Plot not found" };

      if (!canReservePlot(plot.status, data.reservations || [], payload.plotId)) {
        return { ok: false, error: "Plot is not available for reservation" };
      }

      if (!validateNoOverlap(data.reservations || [], payload.plotId)) {
        return { ok: false, error: "An active reservation already exists for this plot" };
      }

      const customer = customersById[payload.customerId];
      const partner = payload.partnerId ? partnersById[payload.partnerId] : null;
      const layout = layoutsById[payload.layoutId || plot.layoutId];
      const venture = venturesById[payload.ventureId || plot.ventureId];
      const totalValue = plot.finalPrice || plot.totalPrice || 0;
      const reservationAmount =
        Number(payload.reservationAmount) || computeMinimumAmount(totalValue, settings);
      const reservationDate = today();
      const expiryDate = computeExpiryDate(reservationDate, settings);
      const seq = 10001 + (data.reservations?.length || 0);
      const id = `RSV-${seq}`;
      const admin = payload.createdBy || "Administrator";

      const record = {
        id,
        reference: id,
        status: "Reserved",
        customerId: customer?.id || payload.customerId,
        customerName: customer?.name || payload.customerName,
        customerPhone: customer?.phone || payload.customerPhone,
        customerEmail: customer?.email || payload.customerEmail,
        partnerId: partner?.id || payload.partnerId || null,
        partnerName:
          partner?.personal
            ? `${partner.personal.firstName} ${partner.personal.lastName}`
            : payload.partnerName || null,
        ventureId: venture?.id || plot.ventureId,
        ventureName: venture?.name || plot.ventureName,
        layoutId: layout?.id || plot.layoutId,
        layoutName: layout?.name || plot.layoutName,
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        inventory: {
          facing: plot.facing,
          areaSqYards: plot.areaSqYards,
          dimensions: plot.dimensions,
          totalPrice: plot.totalPrice,
          finalPrice: plot.finalPrice || plot.totalPrice,
          block: plot.block,
        },
        reservationAmount,
        minimumReservationAmount: reservationAmount,
        totalValue,
        reservationDate,
        expiryDate,
        validityDays: settings.validityDays,
        autoReleaseEnabled: settings.autoReleaseEnabled,
        extensionsCount: 0,
        maxExtensions: settings.maxExtensions,
        source: payload.source || "ERP",
        createdBy: admin,
        createdByRole: payload.createdByRole || "Administrator",
        timeline: [
          {
            type: "created",
            title: "Reservation Created",
            description: "Customer paid minimum reservation amount. Inventory locked.",
            date: reservationDate,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
            tone: "accent",
            actor: admin,
          },
        ],
        reminders: [],
        activityLog: [
          makeLog({ id }, admin, payload.createdByRole || "Administrator", "RESERVATION_CREATED", "Inventory locked after minimum payment", { previousStatus: "Available", newStatus: "Reserved" }),
        ],
        documents: [],
        verification: {
          status: "Not Started",
          startedAt: null,
          completedAt: null,
          checklist: {
            customerDetails: false,
            identityDocs: false,
            reservationAmount: true,
            channelPartner: Boolean(payload.partnerId),
            plotAvailability: true,
          },
          remarks: "",
          completed: false,
        },
        extensions: [],
      };

      dataStore.updateObject("reservations", (prev) => ({
        ...prev,
        reservations: [record, ...(prev.reservations || [])],
      }));

      syncPlotOverride(plot.id, {
        status: "Reserved",
        customer: record.customerName,
        customerId: record.customerId,
        reservationExpiry: expiryDate,
      });

      return { ok: true, reservation: enrichReservation(record, settings) };
    };

    const extendReservation = (id, days, { user = "Administrator", role = "Administrator" } = {}) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current) return { ok: false, error: "Reservation not found" };
      if (!canExtend(current, settings)) return { ok: false, error: "Extension not allowed" };

      const extraDays = Number(days) || 7;
      const newExpiry = computeExpiryDate(current.expiryDate, { ...settings, validityDays: extraDays }, 0);
      const event = {
        type: "extended",
        title: "Reservation Extended",
        description: `Extended by ${extraDays} days. New expiry: ${newExpiry}`,
        date: today(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        tone: "warning",
        actor: user,
      };

      let next = appendTimeline(current, event);
      next = appendActivity(
        next,
        makeLog(next, user, role, "RESERVATION_EXTENDED", `Extended by ${extraDays} days`)
      );
      next = {
        ...next,
        expiryDate: newExpiry,
        extensionsCount: (next.extensionsCount || 0) + 1,
        extensions: [
          ...(next.extensions || []),
          {
            extendedAt: nowIso(),
            by: user,
            role,
            days: extraDays,
            previousExpiry: current.expiryDate,
            newExpiry,
            reason: "Extension applied",
            remarks: "",
          },
        ],
      };

      updateReservation(id, next);
      syncPlotOverride(next.plotId, { reservationExpiry: newExpiry });
      return { ok: true, reservation: enrichReservation(next, settings) };
    };

    const extendReservationWithDetails = (
      id,
      { days, reason, remarks },
      { user = "Administrator", role = "Administrator" } = {}
    ) => {
      const currentRaw = (data.reservations || []).find((r) => r.id === id);
      const current = currentRaw ? normalizeVerification(currentRaw) : null;
      if (!current) return { ok: false, error: "Reservation not found" };
      if (!canExtend(current, settings)) return { ok: false, error: "Extension not allowed" };
      const extraDays = Number(days) || 7;
      const newExpiry = computeExpiryDate(current.expiryDate, { ...settings, validityDays: extraDays }, 0);

      const event = {
        type: "extended",
        title: "Extension Applied",
        description: `${reason || "Extension applied"} · +${extraDays} days · New expiry: ${newExpiry}`,
        date: today(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        tone: "warning",
        actor: user,
      };

      let next = appendTimeline(current, event);
      next = appendActivity(
        next,
        makeLog(next, user, role, "RESERVATION_EXTENDED", remarks || reason || `Extended by ${extraDays} days`)
      );
      next = {
        ...next,
        expiryDate: newExpiry,
        extensionsCount: (next.extensionsCount || 0) + 1,
        extensions: [
          ...(next.extensions || []),
          {
            extendedAt: nowIso(),
            by: user,
            role,
            days: extraDays,
            previousExpiry: current.expiryDate,
            newExpiry,
            reason: reason || "",
            remarks: remarks || "",
          },
        ],
      };

      updateReservation(id, next);
      syncPlotOverride(next.plotId, { reservationExpiry: newExpiry });
      return { ok: true, reservation: enrichReservation(next, settings) };
    };

    const runReminderSweep = ({ user = "Reminder Service", role = "System" } = {}) => {
      const list = (data.reservations || []).map(normalizeVerification);
      let created = 0;
      list.forEach((r) => {
        const due = getDueReminders(r, settings);
        if (!due.length) return;
        const updated = due.reduce((acc, reminder) => {
          const entry = {
            type: reminder.type,
            label: reminder.label,
            sentAt: today(),
            channel: "SMS + Email",
          };
          const timelineEvent = {
            type: "reminder",
            title: "Reminder Sent",
            description: `${reminder.label} reminder sent`,
            date: today(),
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
            tone: "warning",
            actor: user,
          };
          let next = { ...acc, reminders: [entry, ...(acc.reminders || [])] };
          next = appendTimeline(next, timelineEvent);
          next = appendActivity(
            next,
            makeLog(next, user, role, "REMINDER_SENT", reminder.label)
          );
          created += 1;
          return next;
        }, r);
        updateReservation(r.id, updated);
      });
      return created;
    };

    const runAutoRelease = () => {
      const candidates = findAutoReleaseCandidates(data.reservations || [], settings);
      candidates.forEach((r) => {
        transitionReservation(r.id, "Released", {
          user: "Auto Release Service",
          role: "System",
          remarks: "Automatically released — reservation expired",
        });
      });
      dataStore.updateObject("reservations", (prev) => ({ ...prev, lastAutoReleaseRun: nowIso() }));
      return candidates.length;
    };

    const updateSettings = (patch) => {
      dataStore.setObject("reservationSettings", {
        ...settings,
        ...patch,
        updatedAt: today(),
        updatedBy: patch.updatedBy || "Administrator",
      });
    };

    const updateRule = (ruleId, patch) => {
      dataStore.setObject(
        "reservationRules",
        (Array.isArray(rules) ? rules : []).map((rule) =>
          rule.id === ruleId ? { ...rule, ...patch } : rule
        )
      );
    };

    const getStats = () => getDashboardStats(data.reservations || [], settings);
    const getCharts = () => ({
      trends: getTrendData(data.reservations || []),
      statusDistribution: getStatusDistribution(data.reservations || []),
      expiryAnalysis: getExpiryAnalysis(data.reservations || [], settings),
    });

    return {
      reservations,
      settings,
      rules,
      customers: customersList,
      partners: partnersList.filter((p) => p.status === "Approved"),
      ventures: venturesList,
      layouts: layoutsList,
      plots: plotsList,
      lastAutoReleaseRun: data.lastAutoReleaseRun,
      autoReleaseSchedule: data.autoReleaseSchedule,
      getReservation,
      getByCustomer,
      getByPartner,
      getByVenture,
      getByLayout,
      getByPlot,
      getActiveForPlot,
      getPlotState,
      filterReservations: (filters) => filterReservations(reservations, filters),
      getStats,
      getCharts,
      getRecentActivities: (limit) => getRecentActivities(data.reservations || [], limit),
      getActivityLogs: () => aggregateActivityLogs(data.reservations || []),
      createReservation,
      transitionReservation,
        extendReservation,
        extendReservationWithDetails,
        assignPartnerToReservation,
        startVerification,
        updateVerificationChecklist,
        completeVerification,
        canConfirmReservation,
        runReminderSweep,
        confirmReservation: (id, opts) => {
          const r = getReservation(id);
          if (!canConfirmReservation(r)) return { ok: false, error: "Verification must be completed before confirming reservation" };
          return transitionReservation(id, "Confirmed", opts);
        },
      cancelReservation: (id, opts) => transitionReservation(id, "Cancelled", opts),
      releaseReservation: (id, opts) => transitionReservation(id, "Released", opts),
      registerReservation: (id, opts) => transitionReservation(id, "Registered", opts),
      completeReservation: (id, opts) => transitionReservation(id, "Completed", opts),
      runAutoRelease,
      updateSettings,
      updateRule,
      computeMinimumAmount: (price) => computeMinimumAmount(price, settings),
      computeRemainingTime: (expiryDate) => computeRemainingTime(expiryDate),
      shouldAutoRelease: (reservation) => shouldAutoRelease(reservation, settings),
      isActiveReservation,
    };
  }, [data, settings, rules, customersList, partnersList, venturesList, layoutsList, plotsList]);

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function ReservationLayout() {
  return (
    <ReservationProvider>
      <PlotsProvider>
        <Outlet />
      </PlotsProvider>
    </ReservationProvider>
  );
}

export function useReservations() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationProvider");
  return ctx;
}

export function useReservationsOptional() {
  return useContext(ReservationContext);
}

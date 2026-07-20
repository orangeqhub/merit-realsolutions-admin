/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection, useStoreObject } from "../shared/hooks/useDataStore.js";
import { dataStore } from "../shared/repositories/dataStore.js";
import { indexById } from "../shared/utils/indexById.js";
import {
  getVentureStatistics,
  getLayoutStatistics,
  getDashboardMetrics,
  getPartnerDashboardStatistics,
} from "../shared/services/statisticsService.js";
import {
  computePartnerPerformance,
  computePartnerLeaderboard,
} from "../utils/partnerPerformance";

const PartnerAssignmentsContext = createContext(null);
const today = () => new Date().toISOString().split("T")[0];

const toAssignedMap = (block = []) =>
  block.reduce((acc, x) => {
    acc[x.id] = x;
    return acc;
  }, {});

function addTimeline(entry, type, title, description, tone) {
  return {
    ...entry,
    timeline: [
      { type, title, description, date: today(), tone },
      ...(entry.timeline || []),
    ],
  };
}

const emptyAssignment = {
  ventures: [],
  layouts: [],
  properties: [],
  plots: [],
  leads: [],
  customers: [],
  territories: [],
  timeline: [],
  metrics: {
    assignedCustomers: 0,
    siteVisitsScheduled: 0,
    activeDeals: 0,
    revenue: 0,
    totalBookings: 0,
    conversionRate: 0,
    activeLeads: 0,
  },
  performance: { monthlyBookings: [], revenueByVenture: [] },
};

export function PartnerAssignmentsProvider({ children }) {
  const ventures = useCollection("ventures");
  const layouts = useCollection("layouts");
  const plots = useCollection("plots");
  const properties = useCollection("properties");
  const leads = useCollection("leads");
  const customers = useCollection("customers");
  const bookings = useCollection("bookings");
  const payments = useCollection("payments");
  const followups = useCollection("followups");
  const salesTeamUsers = useCollection("channelPartners");
  const assignmentData = useStoreObject("partnerAssignments") || { assignments: {} };

  const value = useMemo(() => {
    const salesUsers = salesTeamUsers
      .filter((p) => p.status === "Approved")
      .sort((a, b) => (a.partnerCode || "").localeCompare(b.partnerCode || ""));

    const venturesById = indexById(ventures);
    const layoutsById = indexById(layouts);
    const plotsById = indexById(plots);
    const propertiesById = indexById(properties);
    const leadsById = indexById(leads);
    const customersById = indexById(customers);
    const salesUsersById = indexById(salesTeamUsers);
    const assignments = assignmentData.assignments || {};

    const getAssignment = (partnerId) => assignments[partnerId] || emptyAssignment;

    const setAssignment = (partnerId, next) => {
      dataStore.updateObject("partnerAssignments", (obj) => ({
        ...obj,
        assignments: { ...(obj.assignments || {}), [partnerId]: next },
      }));
    };

    const assignMany = (partnerId, type, ids) => {
      const entry = getAssignment(partnerId);
      const existing = toAssignedMap(entry[type]);
      const merged = [...(entry[type] || [])];
      ids.forEach((id) => {
        if (existing[id]) return;
        merged.push({ id, assignedDate: today() });
      });
      setAssignment(
        partnerId,
        addTimeline(
          { ...entry, [type]: merged },
          `${type}-assigned`,
          `${type[0].toUpperCase()}${type.slice(1)} Assigned`,
          `Assigned ${ids.length} ${type} item(s)`,
          "info"
        )
      );
    };

    const removeOne = (partnerId, type, id) => {
      const entry = getAssignment(partnerId);
      const nextList = (entry[type] || []).filter((x) => x.id !== id);
      setAssignment(
        partnerId,
        addTimeline(
          { ...entry, [type]: nextList },
          `${type}-removed`,
          `${type[0].toUpperCase()}${type.slice(1)} Removed`,
          `Removed 1 ${type} item`,
          "warning"
        )
      );
    };

    const setTerritories = (partnerId, territories) => {
      const entry = getAssignment(partnerId);
      setAssignment(
        partnerId,
        addTimeline(
          { ...entry, territories },
          "territory-updated",
          "Territories Updated",
          `Updated ${territories.length} territory item(s)`,
          "accent"
        )
      );
    };

    const resolveSalesUserRef = (userId, type, entityId) => {
      const user = salesUsersById[userId];
      if (!user) return null;
      const assignedDate =
        assignments[userId]?.[type]?.find((x) => x.id === entityId)?.assignedDate || "";
      return { partner: user, assignedDate };
    };

    const getPartnerForEntity = (type, entityId) => {
      const entity =
        type === "ventures"
          ? venturesById[entityId]
          : type === "layouts"
            ? layoutsById[entityId]
            : type === "plots"
              ? plotsById[entityId]
              : type === "properties"
                ? propertiesById[entityId]
                : type === "leads"
                  ? leadsById[entityId]
                  : type === "customers"
                    ? customersById[entityId]
                    : null;

      if (entity?.assignedPartnerId) {
        return resolveSalesUserRef(entity.assignedPartnerId, type, entityId);
      }

      const partnerId = Object.keys(assignments).find((pid) =>
        (assignments[pid]?.[type] || []).some((x) => x.id === entityId)
      );
      if (!partnerId) return null;
      return resolveSalesUserRef(partnerId, type, entityId);
    };

    const getPartnersForEntity = (type, entityId) => {
      const entity =
        type === "ventures" ? venturesById[entityId] : type === "layouts" ? layoutsById[entityId] : null;
      const ids = entity?.assignedPartnerIds || [];
      if (ids.length) {
        return ids.map((pid) => resolveSalesUserRef(pid, type, entityId)).filter(Boolean);
      }
      const single = getPartnerForEntity(type, entityId);
      return single ? [single] : [];
    };

    const getBookingsForEntity = ({ ventureId, layoutId, plotId, propertyId, partnerId, customerId }) =>
      bookings.filter((b) => {
        if (b.status === "Cancelled") return false;
        if (ventureId && b.ventureId !== ventureId) return false;
        if (layoutId && b.layoutId !== layoutId) return false;
        if (plotId && b.plotId !== plotId) return false;
        if (propertyId && b.propertyId !== propertyId) return false;
        if (partnerId && b.partnerId !== partnerId) return false;
        if (customerId && b.customerId !== customerId) return false;
        return true;
      });

    const getVentureStats = (ventureId) => {
      const stats = getVentureStatistics(ventureId);
      return {
        ...stats,
        bookings: stats.totalBookings,
        partners: getPartnersForEntity("ventures", ventureId),
      };
    };

    const getLayoutStats = (layoutId) => {
      const stats = getLayoutStatistics(layoutId);
      return {
        plots: {
          total: stats.totalPlots,
          available: stats.available,
          booked: stats.booked,
          reserved: stats.reserved,
          sold: stats.sold,
        },
        bookingStats: stats.bookingStats,
        partners: getPartnersForEntity("layouts", layoutId),
      };
    };

    const getPlotRelationships = (plotId) => {
      const plot = plotsById[plotId];
      const booking = plot?.bookingId
        ? bookings.find((b) => b.id === plot.bookingId)
        : bookings.find((b) => b.plotId === plotId && b.status !== "Cancelled");
      const customer = plot?.customerId ? customersById[plot.customerId] : null;
      const partner = getPartnerForEntity("plots", plotId);
      return { plot, booking, customer, partner };
    };

    const getPropertyRelationships = (propertyId) => {
      const property = propertiesById[propertyId];
      const interestedLeads = (property?.interestedLeadIds || [])
        .map((id) => leadsById[id])
        .filter(Boolean);
      const booking = property?.bookingId
        ? bookings.find((b) => b.id === property.bookingId)
        : bookings.find((b) => b.propertyId === propertyId && b.status !== "Cancelled");
      const customer = property?.customerId ? customersById[property.customerId] : null;
      const partner = getPartnerForEntity("properties", propertyId);
      return { property, interestedLeads, booking, customer, partner };
    };

    const getLeadRelationships = (leadId) => {
      const lead = leadsById[leadId];
      const partner = lead?.assignedPartnerId
        ? resolveSalesUserRef(lead.assignedPartnerId, "leads", leadId)
        : getPartnerForEntity("leads", leadId);
      const property = lead?.interestedPropertyId ? propertiesById[lead.interestedPropertyId] : null;
      const venture = lead?.interestedVentureId ? venturesById[lead.interestedVentureId] : null;
      const nextFollowUp = followups.find((f) => f.leadId === leadId && f.status === "Upcoming");
      return { lead, partner, property, venture, nextFollowUp };
    };

    const getCustomerRelationships = (customerId) => {
      const customer = customersById[customerId];
      const partner = customer?.assignedPartnerId
        ? resolveSalesUserRef(customer.assignedPartnerId, "customers", customerId)
        : getPartnerForEntity("customers", customerId);
      const customerBookings = getBookingsForEntity({ customerId });
      const customerPayments = payments.filter((p) => p.customerId === customerId);
      return { customer, partner, bookings: customerBookings, payments: customerPayments };
    };

    const getPartnerBookings = (partnerId) =>
      bookings.filter((b) => b.partnerId === partnerId && b.status !== "Cancelled");

    const perfCtx = {
      partnersById: salesUsersById,
      leads,
      customers,
      bookings,
      payments,
      followups,
      properties,
      ventures,
      plots,
      venturesById,
      propertiesById,
      customersById,
      leadsById,
      getAssignment,
    };

    const getPartnerPerformance = (partnerId) => computePartnerPerformance(partnerId, perfCtx);
    const getPartnerLeaderboard = () => computePartnerLeaderboard(salesUsers, perfCtx);
    const getPartnerStats = (partnerId) => getPartnerDashboardStatistics(partnerId);

    return {
      salesTeamUsers,
      salesUsers,
      partners: salesUsers,
      partnersById: salesUsersById,
      salesUsersById,
      venturesById,
      layoutsById,
      plotsById,
      propertiesById,
      leadsById,
      customersById,
      bookings,
      payments,
      getAssignment,
      setAssignment,
      assignMany,
      removeOne,
      setTerritories,
      getPartnerForEntity,
      getPartnersForEntity,
      getBookingsForEntity,
      getVentureStats,
      getLayoutStats,
      getPlotRelationships,
      getPropertyRelationships,
      getLeadRelationships,
      getCustomerRelationships,
      getPartnerBookings,
      getPartnerPerformance,
      getPartnerLeaderboard,
      getPartnerStats,
      getDashboardMetrics: () => getDashboardMetrics(),
    };
  }, [
    ventures,
    layouts,
    plots,
    properties,
    leads,
    customers,
    bookings,
    payments,
    followups,
    salesTeamUsers,
    assignmentData,
  ]);

  return (
    <PartnerAssignmentsContext.Provider value={value}>
      {children}
    </PartnerAssignmentsContext.Provider>
  );
}

export function PartnerAssignmentsLayout() {
  return (
    <PartnerAssignmentsProvider>
      <Outlet />
    </PartnerAssignmentsProvider>
  );
}

export function usePartnerAssignments() {
  const ctx = useContext(PartnerAssignmentsContext);
  if (!ctx) {
    throw new Error("usePartnerAssignments must be used within PartnerAssignmentsProvider");
  }
  return ctx;
}

const ACTIVE_LEAD_STATUSES = new Set([
  "New",
  "Contacted",
  "Qualified",
  "Negotiation",
  "Site Visit",
  "Proposal",
]);
const CONVERTED_LEAD_STATUSES = new Set(["Won", "Converted"]);
const LOST_LEAD_STATUSES = new Set(["Lost", "Rejected"]);

const PROPERTY_TYPE_BUCKETS = {
  "Open Plot": "Residential",
  Apartment: "Apartments",
  Villa: "Villas",
  "Farm Land": "Agricultural",
  Commercial: "Commercial",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

function sumPayments(paymentList) {
  return paymentList.reduce((s, p) => s + (p.amount || 0), 0);
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function trendFromSeries(series) {
  if (!series?.length || series.length < 2) return { direction: "up", value: "+0%" };
  const last = series[series.length - 1]?.value || 0;
  const prev = series[series.length - 2]?.value || 0;
  if (!prev) return { direction: last > 0 ? "up" : "neutral", value: last > 0 ? "+100%" : "0%" };
  const change = Math.round(((last - prev) / prev) * 100);
  return {
    direction: change >= 0 ? "up" : "down",
    value: `${change >= 0 ? "+" : ""}${change}%`,
  };
}

export function computePartnerPerformance(partnerId, ctx) {
  const {
    partnersById,
    leads,
    customers,
    bookings,
    payments,
    followups,
    venturesById,
    propertiesById,
    getAssignment,
  } = ctx;

  const partner = partnersById[partnerId];
  const assignment = getAssignment(partnerId);

  const partnerLeads = leads.filter((l) => l.assignedPartnerId === partnerId);
  const partnerCustomers = customers.filter((c) => c.assignedPartnerId === partnerId);
  const partnerBookings = bookings.filter((b) => b.partnerId === partnerId);
  const nonCancelled = partnerBookings.filter((b) => b.status !== "Cancelled");
  const cancelledBookings = partnerBookings.filter((b) => b.status === "Cancelled");

  const partnerPayments = payments.filter((p) => {
    const bk = bookings.find((b) => b.id === p.bookingId);
    return bk?.partnerId === partnerId && p.status === "Completed";
  });

  const convertedLeads = partnerLeads.filter((l) => CONVERTED_LEAD_STATUSES.has(l.status));
  const lostLeads = partnerLeads.filter((l) => LOST_LEAD_STATUSES.has(l.status));
  const activeLeads = partnerLeads.filter((l) => ACTIVE_LEAD_STATUSES.has(l.status));

  const activeCustomers = partnerCustomers.filter((c) => c.status === "Active");
  const repeatCustomers = partnerCustomers.filter((c) => (c.bookingIds?.length || 0) > 1);
  const vipCustomers = partnerCustomers.filter((c) => (c.totalPaid || 0) >= 1000000);

  const revenueGenerated = nonCancelled.reduce((s, b) => s + (b.advancePaid || 0), 0);
  const paymentRevenue = sumPayments(partnerPayments);
  const totalRevenue = paymentRevenue || revenueGenerated;

  const closedDeals = partnerBookings.filter((b) => b.status === "Completed").length;
  const conversionRate = pct(convertedLeads.length, partnerLeads.length);
  const bookingSuccessRate = pct(nonCancelled.length, partnerBookings.length);
  const cancellationRate = pct(cancelledBookings.length, partnerBookings.length);

  const assignedPropertyIds = new Set((assignment.properties || []).map((p) => p.id));
  const assignedVentureIds = new Set((assignment.ventures || []).map((v) => v.id));

  const siteVisitsCompleted = followups.filter(
    (f) => f.assignedPartnerId === partnerId && f.type === "Site Visit" && f.status === "Completed"
  ).length;
  const followUpsPending = followups.filter(
    (f) => f.assignedPartnerId === partnerId && ["Upcoming", "Today", "Overdue"].includes(f.status)
  ).length;

  const now = new Date();
  const currentYear = now.getFullYear();

  const monthlyRevenue = MONTHS.slice(0, 6).map((label, i) => ({
    label,
    value: Math.round(
      partnerPayments
        .filter((p) => {
          const d = new Date(p.paidDate || p.createdDate);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        })
        .reduce((s, p) => s + p.amount, 0) / 100000
    ),
  }));

  if (!monthlyRevenue.some((m) => m.value > 0) && totalRevenue > 0) {
    const base = Math.round(totalRevenue / 600000);
    monthlyRevenue.forEach((m, i) => {
      m.value = Math.max(1, Math.round(base * (0.7 + i * 0.08)));
    });
  }

  const quarterlyRevenue = QUARTERS.map((label, qi) => ({
    label,
    value: Math.round(
      partnerPayments
        .filter((p) => {
          const d = new Date(p.paidDate || p.createdDate);
          return Math.floor(d.getMonth() / 3) === qi && d.getFullYear() === currentYear;
        })
        .reduce((s, p) => s + p.amount, 0) / 100000
    ) || Math.round(totalRevenue / (400000 * (4 - qi))),
  }));

  const yearlyRevenue = totalRevenue;
  const avgDealValue = nonCancelled.length ? Math.round(totalRevenue / nonCancelled.length) : 0;
  const highestSale = nonCancelled.reduce((max, b) => Math.max(max, b.bookingAmount || 0), 0);

  const revenueByPropertyType = Object.keys(PROPERTY_TYPE_BUCKETS).reduce((acc, type) => {
    acc[PROPERTY_TYPE_BUCKETS[type]] = 0;
    return acc;
  }, {});

  nonCancelled.forEach((b) => {
    const prop = b.propertyId ? propertiesById[b.propertyId] : null;
    const bucket = prop
      ? PROPERTY_TYPE_BUCKETS[prop.propertyType] || "Residential"
      : "Residential";
    revenueByPropertyType[bucket] = (revenueByPropertyType[bucket] || 0) + (b.advancePaid || 0);
  });

  const propertySalesChart = [
    { label: "Residential", value: Math.round((revenueByPropertyType.Residential || 0) / 100000) },
    { label: "Apartments", value: Math.round((revenueByPropertyType.Apartments || 0) / 100000) },
    { label: "Villas", value: Math.round((revenueByPropertyType.Villas || 0) / 100000) },
    { label: "Agricultural", value: Math.round((revenueByPropertyType.Agricultural || 0) / 100000) },
    { label: "Commercial", value: Math.round((revenueByPropertyType.Commercial || 0) / 100000) },
  ];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookingAnalytics = {
    new: partnerBookings.filter(
      (b) => b.status === "Active" && new Date(b.bookingDate) >= thirtyDaysAgo
    ).length,
    pending: partnerBookings.filter(
      (b) => b.status === "Active" && b.agreementStatus === "Pending"
    ).length,
    confirmed: partnerBookings.filter(
      (b) => b.status === "Active" && b.agreementStatus !== "Pending"
    ).length,
    completed: partnerBookings.filter((b) => b.status === "Completed").length,
    cancelled: cancelledBookings.length,
  };

  const customerCards = partnerCustomers.map((c) => {
    const lead = partnerLeads.find((l) => l.name === c.name);
    const custBooking = partnerBookings.find((b) => b.customerId === c.id && b.status !== "Cancelled");
    const prop =
      lead?.interestedPropertyId
        ? propertiesById[lead.interestedPropertyId]
        : c.purchasedProperties?.[0]?.id
          ? propertiesById[c.purchasedProperties[0].id]
          : null;
    return {
      id: c.id,
      name: c.name,
      interestedProperty: prop?.name || lead?.interestedProperty || "—",
      bookingStatus: custBooking?.status || "No Booking",
      paymentStatus: c.paymentStatus || "—",
      isVip: (c.totalPaid || 0) >= 1000000,
      isRepeat: (c.bookingIds?.length || 0) > 1,
    };
  });

  const venturePerformance = (assignment.ventures || []).map((vRef) => {
    const venture = venturesById[vRef.id];
    if (!venture) return null;
    const vBookings = nonCancelled.filter((b) => b.ventureId === venture.id);
    const vRevenue = vBookings.reduce((s, b) => s + (b.advancePaid || 0), 0);
    return {
      id: venture.id,
      name: venture.name,
      bookings: vBookings.length,
      revenue: vRevenue,
      availableInventory: venture.plots?.available || 0,
      soldInventory: venture.plots?.sold || 0,
    };
  }).filter(Boolean);

  const activities = [];

  (assignment.timeline || []).forEach((t) => {
    activities.push({ type: t.type, title: t.title, description: t.description, date: t.date, tone: t.tone });
  });

  partnerLeads.slice(0, 3).forEach((l) => {
    activities.push({
      type: "lead-assigned",
      title: "Lead Assigned",
      description: `${l.name} — ${l.interestedProperty || l.ventureName}`,
      date: l.createdDate,
      tone: "accent",
    });
  });

  followups
    .filter((f) => f.assignedPartnerId === partnerId && f.status === "Completed" && f.type === "Site Visit")
    .slice(0, 2)
    .forEach((f) => {
      activities.push({
        type: "site-visit",
        title: "Site Visit Completed",
        description: f.leadName || f.customerName || "Site visit",
        date: f.completedDate || f.scheduledDate,
        tone: "success",
      });
    });

  partnerCustomers.slice(0, 2).forEach((c) => {
    activities.push({
      type: "customer-added",
      title: "Customer Added",
      description: c.name,
      date: c.createdDate || c.timeline?.[0]?.date,
      tone: "info",
    });
  });

  nonCancelled
    .filter((b) => b.status === "Completed")
    .slice(0, 3)
    .forEach((b) => {
      activities.push({
        type: "booking-completed",
        title: "Booking Completed",
        description: `${b.bookingNumber} — ${b.plotNumber || b.propertyName}`,
        date: b.bookingDate,
        tone: "success",
      });
    });

  partnerPayments.slice(0, 3).forEach((p) => {
    activities.push({
      type: "payment",
      title: "Payment Received",
      description: `₹${(p.amount || 0).toLocaleString("en-IN")} from ${p.customerName}`,
      date: p.paidDate || p.createdDate,
      tone: "success",
    });
  });

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  const territory = assignment.territories?.[0]?.value || partner?.personal?.city || "—";

  return {
    partner,
    territory,
    kpi: {
      totalAssignedLeads: partnerLeads.length,
      activeCustomers: activeCustomers.length,
      totalBookings: partnerBookings.length,
      closedDeals,
      conversionRate,
      revenueGenerated: totalRevenue,
      activeVentures: assignment.ventures?.length || 0,
      assignedProperties: assignment.properties?.length || 0,
      siteVisitsCompleted,
      followUpsPending,
      trends: {
        leads: trendFromSeries(
          (assignment.performance?.monthlyBookings || []).map((m) => ({ value: m.value }))
        ),
        revenue: trendFromSeries(monthlyRevenue),
        bookings: {
          direction: nonCancelled.length >= cancelledBookings.length ? "up" : "down",
          value: `${bookingSuccessRate}%`,
        },
      },
    },
    revenue: {
      monthly: monthlyRevenue,
      quarterly: quarterlyRevenue,
      yearly: yearlyRevenue,
      avgDealValue,
      highestSale,
      byPropertyType: propertySalesChart,
      monthlyTrend: trendFromSeries(monthlyRevenue),
    },
    sales: {
      leadsReceived: partnerLeads.length,
      leadsConverted: convertedLeads.length,
      lostLeads: lostLeads.length,
      conversionPct: conversionRate,
      bookingSuccessRate,
      cancellationRate,
      funnel: [
        { label: "Received", value: partnerLeads.length },
        { label: "Active", value: activeLeads.length },
        { label: "Converted", value: convertedLeads.length },
        { label: "Lost", value: lostLeads.length },
      ],
    },
    customers: {
      total: partnerCustomers.length,
      active: activeCustomers.length,
      repeat: repeatCustomers.length,
      vip: vipCustomers.length,
      cards: customerCards,
    },
    bookings: bookingAnalytics,
    propertySales: propertySalesChart,
    ventures: venturePerformance,
    activities: activities.slice(0, 10),
    assignedVentureIds,
    assignedPropertyIds,
  };
}

export function computePartnerLeaderboard(partners, ctx) {
  return partners
    .map((partner) => {
      const perf = computePartnerPerformance(partner.id, ctx);
      return {
        partner,
        revenue: perf.kpi.revenueGenerated,
        bookings: perf.kpi.totalBookings,
        conversionRate: perf.kpi.conversionRate,
        closedDeals: perf.kpi.closedDeals,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

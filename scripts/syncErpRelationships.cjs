/**
 * Syncs cross-module ERP relationships without changing record counts.
 * Run: node scripts/syncErpRelationships.cjs
 */
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "../src/data");
const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
const write = (name, data) => {
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(data, null, 2));
};

let seed = 20260701;
const rng = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const daysAgo = (d) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().split("T")[0];
};
const today = () => new Date().toISOString().split("T")[0];
const assignBlock = (ids, offset = 30) =>
  ids.map((id) => ({ id, assignedDate: daysAgo(Math.floor(rng() * offset) + 1) }));

const partners = read("channelPartners.json").filter((p) => p.status === "Approved");
const ventures = read("ventures.json");
const layouts = read("layouts.json");
const plots = read("plots.json");
const properties = read("properties.json");
const leads = read("leads.json");
const customers = read("customers.json");
const bookings = read("bookings.json");
const followups = read("followups.json");
const payments = read("payments.json");

const ventureById = Object.fromEntries(ventures.map((v) => [v.id, v]));
const layoutById = Object.fromEntries(layouts.map((l) => [l.id, l]));
const plotById = Object.fromEntries(plots.map((p) => [p.id, p]));
const propertyById = Object.fromEntries(properties.map((p) => [p.id, p]));
const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));
const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]));

// ── 1. Assign partners to ventures (2 per venture, 1–3 ventures per partner) ──
const venturePartners = {};
const partnerVentures = Object.fromEntries(partners.map((p) => [p.id, []]));

ventures.forEach((v, i) => {
  const p1 = partners[i % partners.length];
  const p2 = partners[(i + 7) % partners.length];
  const ids = [...new Set([p1.id, p2.id])];
  venturePartners[v.id] = ids;
  ids.forEach((pid) => {
    if (!partnerVentures[pid].includes(v.id)) partnerVentures[pid].push(v.id);
  });
});

// ── 2. Propagate partner → layout → plot → property ──
const layoutPartners = {};
const plotPartners = {};
const propertyPartners = {};

layouts.forEach((l) => {
  const vPartners = venturePartners[l.ventureId] || [];
  layoutPartners[l.id] = [...vPartners];
});

plots.forEach((pl) => {
  const lPartners = layoutPartners[pl.layoutId] || [];
  plotPartners[pl.id] = pick(lPartners.length ? lPartners : partners.map((p) => p.id));
});

properties.forEach((pr) => {
  const vPartners = venturePartners[pr.ventureId] || [];
  propertyPartners[pr.id] = pick(vPartners.length ? vPartners : partners.map((p) => p.id));
});

// ── 3. Fix booking ↔ plot ↔ customer conflicts ──
const STATUS_PRIORITY = { Completed: 3, Active: 2, Cancelled: 1 };
const plotClaims = new Map();

const sortedBookings = [...bookings].sort((a, b) => {
  const d = (STATUS_PRIORITY[b.status] || 0) - (STATUS_PRIORITY[a.status] || 0);
  return d !== 0 ? d : a.id.localeCompare(b.id);
});

const findAvailablePlot = (layoutId, excludeIds = new Set()) => {
  const pool = plots.filter(
    (p) =>
      p.layoutId === layoutId &&
      !plotClaims.has(p.id) &&
      !excludeIds.has(p.id) &&
      (p.status === "Available" || !p.customerId)
  );
  return pool[0] || plots.find((p) => p.layoutId === layoutId && !plotClaims.has(p.id));
};

sortedBookings.forEach((bk) => {
  if (bk.status === "Cancelled") return;

  let plot = plotById[bk.plotId];
  if (!plot) {
    const layout = layouts.find((l) => l.ventureName === bk.ventureName);
    plot = layout ? findAvailablePlot(layout.id) : plots.find((p) => !plotClaims.has(p.id));
    if (plot) {
      bk.plotId = plot.id;
      bk.plotNumber = plot.plotNumber;
      bk.layoutName = plot.layoutName;
      bk.ventureName = plot.ventureName;
    }
  }

  if (plot && plotClaims.has(plot.id) && plotClaims.get(plot.id) !== bk.id) {
    const replacement = findAvailablePlot(plot.layoutId);
    if (replacement) {
      plot = replacement;
      bk.plotId = plot.id;
      bk.plotNumber = plot.plotNumber;
      bk.layoutName = plot.layoutName;
      bk.ventureName = plot.ventureName;
    }
  }

  if (!plot) return;

  plotClaims.set(plot.id, bk.id);
  const customer = customerById[bk.customerId];
  if (customer) bk.customerName = customer.name;

  bk.ventureId = plot.ventureId;
  bk.layoutId = plot.layoutId;
  bk.partnerId = plotPartners[plot.id];

  const plotStatus =
    bk.status === "Completed" ? "Sold" : bk.status === "Active" ? "Booked" : plot.status;
  plot.status = plotStatus;
  plot.customerId = bk.customerId;
  plot.customer = bk.customerName;
  plot.bookingId = bk.id;
  plot.assignedPartnerId = bk.partnerId;
  plot.lastUpdated = today();

  if (bk.propertyId && propertyById[bk.propertyId]) {
    const pr = propertyById[bk.propertyId];
    pr.status = plotStatus === "Sold" ? "Sold" : "Booked";
    pr.customerId = bk.customerId;
    pr.bookingId = bk.id;
    pr.assignedPartnerId = bk.partnerId;
    pr.owner = {
      name: bk.customerName,
      phone: customer?.phone || pr.owner?.phone,
      email: customer?.email || pr.owner?.email,
      address: customer?.address || pr.owner?.address,
      pan: customer?.pan || pr.owner?.pan,
      aadhar: customer?.aadhar || pr.owner?.aadhar,
    };
  }
});

// ── 4. Assign leads to partners + link property/venture IDs ──
const leadPartners = {};
const propertyLeads = Object.fromEntries(properties.map((p) => [p.id, []]));
const ACTIVE_LEAD_STATUSES = new Set(["New", "Contacted", "Qualified", "Negotiation", "Site Visit"]);

leads.forEach((lead, i) => {
  const partner = partners[i % partners.length];
  leadPartners[lead.id] = partner.id;
  lead.assignedPartnerId = partner.id;

  const matchedProperty =
    properties.find((p) => lead.interestedProperty && p.name.includes(lead.interestedProperty.split(" ")[0])) ||
    properties.find((p) => p.ventureName === lead.ventureName) ||
    properties[i % properties.length];

  if (matchedProperty) {
    lead.interestedPropertyId = matchedProperty.id;
    lead.interestedProperty = matchedProperty.name;
    lead.interestedVentureId = matchedProperty.ventureId;
    lead.ventureName = matchedProperty.ventureName;
    propertyLeads[matchedProperty.id].push(lead.id);
  } else {
    const venture = ventures.find((v) => v.name === lead.ventureName) || ventures[i % ventures.length];
    lead.interestedVentureId = venture.id;
    lead.ventureName = venture.name;
  }

  const fu = followups.find((f) => f.leadId === lead.id && f.status === "Upcoming");
  lead.followUpDate = fu?.scheduledDate || lead.expectedCloseDate;
});

// ── 5. Sync customers from bookings ──
customers.forEach((c) => {
  c.bookingIds = [];
  c.purchasedProperties = [];
});

sortedBookings.forEach((bk) => {
  if (bk.status === "Cancelled") return;
  const c = customerById[bk.customerId];
  if (!c) return;
  if (!c.bookingIds.includes(bk.id)) c.bookingIds.push(bk.id);
  c.assignedPartnerId = bk.partnerId;
  if (bk.propertyId && propertyById[bk.propertyId]) {
    const pr = propertyById[bk.propertyId];
    if (!c.purchasedProperties.some((p) => p.id === pr.id)) {
      c.purchasedProperties.push({
        id: pr.id,
        name: pr.name,
        plotId: bk.plotId,
        bookingId: bk.id,
        purchaseDate: bk.bookingDate,
      });
    }
  } else if (bk.plotId) {
    const pl = plotById[bk.plotId];
    if (pl && !c.purchasedProperties.some((p) => p.plotId === pl.id)) {
      c.purchasedProperties.push({
        id: pl.id,
        name: `${pl.plotNumber} — ${pl.layoutName}`,
        plotId: pl.id,
        bookingId: bk.id,
        purchaseDate: bk.bookingDate,
      });
    }
  }
  const paid = payments
    .filter((p) => p.bookingId === bk.id && p.status === "Completed")
    .reduce((s, p) => s + p.amount, 0);
  const total = bk.bookingAmount || 0;
  c.paymentStatus =
    paid >= total ? "Paid" : paid >= (bk.advancePaid || 0) ? "Partial" : "Pending";
  c.totalPaid = paid || c.totalPaid;
  c.outstanding = Math.max(0, total - paid);
});

// Assign remaining customers to partners round-robin
customers.forEach((c, i) => {
  if (!c.assignedPartnerId) c.assignedPartnerId = partners[i % partners.length].id;
});

// ── 6. Apply partner IDs on entities ──
plots.forEach((pl) => {
  if (!pl.assignedPartnerId) pl.assignedPartnerId = plotPartners[pl.id];
});

properties.forEach((pr) => {
  if (!pr.assignedPartnerId) pr.assignedPartnerId = propertyPartners[pr.id];
  pr.interestedLeadIds = propertyLeads[pr.id] || [];
});

ventures.forEach((v) => {
  v.assignedPartnerIds = venturePartners[v.id] || [];
  v.activeLeads = leads.filter(
    (l) => l.interestedVentureId === v.id && ACTIVE_LEAD_STATUSES.has(l.status)
  ).length;
  const vBookings = bookings.filter(
    (b) => b.ventureId === v.id && b.status !== "Cancelled"
  );
  v.bookings = vBookings.length;
  v.revenue = Math.round(
    vBookings.reduce((s, b) => s + (b.advancePaid || 0), 0) / 10000000
  ) / 10 || v.revenue;
});

layouts.forEach((l) => {
  l.assignedPartnerIds = layoutPartners[l.id] || [];
  const layoutPlots = plots.filter((p) => p.layoutId === l.id);
  const stats = { total: layoutPlots.length, available: 0, booked: 0, reserved: 0, sold: 0 };
  layoutPlots.forEach((p) => {
    const key = (p.status || "available").toLowerCase();
    if (stats[key] !== undefined) stats[key]++;
    else stats.available++;
  });
  l.plots = stats;
  l.bookingStats = {
    total: bookings.filter((b) => b.layoutId === l.id && b.status !== "Cancelled").length,
    active: bookings.filter((b) => b.layoutId === l.id && b.status === "Active").length,
    completed: bookings.filter((b) => b.layoutId === l.id && b.status === "Completed").length,
  };
});

followups.forEach((fu) => {
  const lead = leads.find((l) => l.id === fu.leadId);
  if (lead?.assignedPartnerId) fu.assignedPartnerId = lead.assignedPartnerId;
});

payments.forEach((pay) => {
  const bk = bookings.find((b) => b.id === pay.bookingId);
  if (bk) {
    pay.customerId = bk.customerId;
    pay.customerName = bk.customerName;
    pay.partnerId = bk.partnerId;
  }
});

// ── 7. Rebuild partnerAssignments.json from relationships ──
const assignments = {};

partners.forEach((p) => {
  const ventureIds = partnerVentures[p.id] || [];
  const layoutIds = layouts.filter((l) => ventureIds.includes(l.ventureId)).map((l) => l.id);
  const plotIds = plots.filter((pl) => pl.assignedPartnerId === p.id).map((pl) => pl.id).slice(0, 20);
  const propertyIds = properties.filter((pr) => pr.assignedPartnerId === p.id).map((pr) => pr.id);
  const leadIds = leads.filter((l) => l.assignedPartnerId === p.id).map((l) => l.id);
  const customerIds = customers.filter((c) => c.assignedPartnerId === p.id).map((c) => c.id);
  const partnerBookings = bookings.filter((b) => b.partnerId === p.id && b.status !== "Cancelled");
  const revenue = partnerBookings.reduce((s, b) => s + (b.advancePaid || 0), 0);

  const city = p.personal?.city || "Hyderabad";
  assignments[p.id] = {
    ventures: assignBlock(ventureIds),
    layouts: assignBlock(layoutIds),
    properties: assignBlock(propertyIds),
    plots: assignBlock(plotIds),
    leads: assignBlock(leadIds),
    customers: assignBlock(customerIds),
    territories: [{ type: "City", value: city, assignedDate: daysAgo(60) }],
    timeline: [
      {
        type: "application-submitted",
        title: "Application Submitted",
        description: "Application received via website form",
        date: p.appliedDate,
        tone: "accent",
      },
      {
        type: "approved",
        title: "Partner Approved",
        description: "Partner activated for assignments",
        date: p.approvalDate || daysAgo(30),
        tone: "success",
      },
    ],
    metrics: {
      assignedCustomers: customerIds.length,
      siteVisitsScheduled: followups.filter(
        (f) => f.assignedPartnerId === p.id && f.type === "Site Visit" && f.status === "Upcoming"
      ).length,
      activeDeals: partnerBookings.filter((b) => b.status === "Active").length,
      revenue,
      totalBookings: partnerBookings.length,
      conversionRate: leadIds.length
        ? Math.round((customerIds.length / leadIds.length) * 100)
        : 0,
      activeLeads: leads.filter(
        (l) => l.assignedPartnerId === p.id && ACTIVE_LEAD_STATUSES.has(l.status)
      ).length,
    },
    performance: {
      monthlyBookings: [
        { label: "Jan", value: Math.max(0, Math.floor(partnerBookings.length * 0.1)) },
        { label: "Feb", value: Math.max(0, Math.floor(partnerBookings.length * 0.15)) },
        { label: "Mar", value: Math.max(0, Math.floor(partnerBookings.length * 0.12)) },
        { label: "Apr", value: Math.max(0, Math.floor(partnerBookings.length * 0.18)) },
        { label: "May", value: Math.max(0, Math.floor(partnerBookings.length * 0.22)) },
        { label: "Jun", value: Math.max(0, Math.floor(partnerBookings.length * 0.23)) },
      ],
      revenueByVenture: ventureIds.map((vid) => ({
        ventureId: vid,
        ventureName: ventureById[vid]?.name,
        amount: bookings
          .filter((b) => b.ventureId === vid && b.partnerId === p.id && b.status !== "Cancelled")
          .reduce((s, b) => s + (b.advancePaid || 0), 0),
      })),
    },
  };
});

// ── Write all files ──
write("ventures.json", ventures);
write("layouts.json", layouts);
write("plots.json", plots);
write("properties.json", properties);
write("leads.json", leads);
write("customers.json", customers);
write("bookings.json", bookings);
write("followups.json", followups);
write("payments.json", payments);
write("partnerAssignments.json", {
  version: 2,
  generatedDate: today(),
  synced: true,
  assignments,
});

console.log("ERP relationship sync complete:");
console.log(`  Partners: ${partners.length}`);
console.log(`  Active/Completed bookings synced: ${sortedBookings.filter((b) => b.status !== "Cancelled").length}`);
console.log(`  Leads with partner: ${leads.filter((l) => l.assignedPartnerId).length}`);
console.log(`  Customers with partner: ${customers.filter((c) => c.assignedPartnerId).length}`);

/**
 * Generates reservation domain data linked to existing ERP entities.
 * Run: node scripts/genReservations.cjs
 */
const fs = require("fs");
const path = require("path");

const plots = require("../src/data/plots.json");
const customers = require("../src/data/customers.json");
const partners = require("../src/data/channelPartners.json").filter((p) => p.status === "Approved");
const ventures = require("../src/data/ventures.json");
const layouts = require("../src/data/layouts.json");

const TODAY = "2026-07-01";
const OUT = path.join(__dirname, "../src/data");

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const settings = {
  validityDays: 15,
  minimumReservationPercent: 10,
  minimumReservationFlat: 50000,
  autoReleaseEnabled: true,
  reminderFrequencyDays: [5, 2, 1],
  gracePeriodDays: 2,
  maxExtensions: 3,
  workingDaysOnly: true,
  workingDays: [1, 2, 3, 4, 5, 6],
  extensionOptions: [7, 15, 30],
  currency: "INR",
  updatedAt: TODAY,
  updatedBy: "System Administrator",
};

const rules = [
  {
    id: "RULE-001",
    name: "Reservation Expiry",
    description: "Reservation expires after the configured validity duration from reservation date.",
    enabled: true,
    category: "expiry",
    configurable: true,
    parameter: "validityDays",
  },
  {
    id: "RULE-002",
    name: "No Overlapping Reservations",
    description: "A plot cannot have more than one active reservation at the same time.",
    enabled: true,
    category: "inventory",
    configurable: false,
  },
  {
    id: "RULE-003",
    name: "Reserved Inventory Lock",
    description: "Reserved inventory cannot be reserved again until released or cancelled.",
    enabled: true,
    category: "inventory",
    configurable: false,
  },
  {
    id: "RULE-004",
    name: "Confirmed Ignores Expiry",
    description: "Confirmed reservations are exempt from automatic expiry and release.",
    enabled: true,
    category: "expiry",
    configurable: true,
    parameter: "autoReleaseEnabled",
  },
  {
    id: "RULE-005",
    name: "Auto Release on Expiry",
    description: "Expired Reserved status reservations are automatically released and inventory returns to Available.",
    enabled: true,
    category: "automation",
    configurable: true,
    parameter: "autoReleaseEnabled",
  },
  {
    id: "RULE-006",
    name: "Status Transition Audit",
    description: "Every reservation status transition must be recorded in timeline and activity log.",
    enabled: true,
    category: "audit",
    configurable: false,
  },
  {
    id: "RULE-007",
    name: "Minimum Reservation Payment",
    description: "Reservation is created only after customer pays the configured minimum reservation amount.",
    enabled: true,
    category: "payment",
    configurable: true,
    parameter: "minimumReservationPercent",
  },
  {
    id: "RULE-008",
    name: "Extension Limit",
    description: "Administrator extensions are limited to the configured maximum count.",
    enabled: true,
    category: "extension",
    configurable: true,
    parameter: "maxExtensions",
  },
];

const STATUS_PLAN = [
  { status: "Reserved", count: 10 },
  { status: "Confirmed", count: 6 },
  { status: "Registered", count: 4 },
  { status: "Completed", count: 3 },
  { status: "Cancelled", count: 3 },
  { status: "Released", count: 4 },
];

const ADMINS = [
  { name: "Priya Sharma", role: "Administrator" },
  { name: "Rahul Verma", role: "Sales Manager" },
  { name: "Anita Reddy", role: "CRM Executive" },
];

let rsvId = 10001;

function makeTimeline(status, reservationDate, expiryDate) {
  const events = [
    {
      type: "created",
      title: "Reservation Created",
      description: "Customer paid minimum reservation amount. Inventory locked.",
      date: reservationDate,
      time: "10:30",
      tone: "accent",
      actor: "System",
    },
  ];
  const reminderDate = addDays(reservationDate, 5);
  if (["Reserved", "Confirmed", "Registered", "Completed", "Cancelled", "Released"].includes(status)) {
    events.push({
      type: "reminder",
      title: "Reservation Reminder",
      description: "5 days remaining before expiry",
      date: reminderDate,
      time: "09:00",
      tone: "warning",
      actor: "System",
    });
  }
  if (["Confirmed", "Registered", "Completed"].includes(status)) {
    events.push({
      type: "confirmed",
      title: "Reservation Confirmed",
      description: "Administrator verified payment requirements",
      date: addDays(reservationDate, 3),
      time: "14:15",
      tone: "success",
      actor: pick(ADMINS).name,
    });
  }
  if (["Registered", "Completed"].includes(status)) {
    events.push({
      type: "registered",
      title: "Legal Registration Completed",
      description: "Property registration documents submitted",
      date: addDays(reservationDate, 20),
      time: "11:00",
      tone: "accent",
      actor: pick(ADMINS).name,
    });
  }
  if (status === "Completed") {
    events.push({
      type: "completed",
      title: "Property Delivered",
      description: "Transaction finished successfully",
      date: addDays(reservationDate, 45),
      time: "16:30",
      tone: "success",
      actor: pick(ADMINS).name,
    });
  }
  if (status === "Cancelled") {
    events.push({
      type: "cancelled",
      title: "Reservation Cancelled",
      description: "Cancelled by administrator",
      date: addDays(reservationDate, 7),
      time: "12:00",
      tone: "danger",
      actor: pick(ADMINS).name,
    });
  }
  if (status === "Released") {
    events.push({
      type: "released",
      title: "Reservation Released",
      description: "Automatically released — reservation expired",
      date: expiryDate,
      time: "00:01",
      tone: "muted",
      actor: "Auto Release Service",
    });
  }
  return events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function makeActivityLog(status, reservationDate, expiryDate, admin) {
  const logs = [
    {
      id: `LOG-${rsvId}-01`,
      user: "System",
      role: "System",
      action: "RESERVATION_CREATED",
      timestamp: `${reservationDate}T10:30:00`,
      remarks: "Minimum reservation amount received. Inventory locked.",
    },
    {
      id: `LOG-${rsvId}-02`,
      user: admin.name,
      role: admin.role,
      action: "STATUS_LOGGED",
      timestamp: `${reservationDate}T10:31:00`,
      remarks: `Reservation initiated with status Reserved`,
    },
  ];
  if (["Confirmed", "Registered", "Completed"].includes(status)) {
    logs.push({
      id: `LOG-${rsvId}-03`,
      user: admin.name,
      role: admin.role,
      action: "RESERVATION_CONFIRMED",
      timestamp: `${addDays(reservationDate, 3)}T14:15:00`,
      remarks: "Payment verification completed",
    });
  }
  if (status === "Cancelled") {
    logs.push({
      id: `LOG-${rsvId}-04`,
      user: admin.name,
      role: admin.role,
      action: "RESERVATION_CANCELLED",
      timestamp: `${addDays(reservationDate, 7)}T12:00:00`,
      remarks: "Customer requested cancellation",
    });
  }
  if (status === "Released") {
    logs.push({
      id: `LOG-${rsvId}-04`,
      user: "Auto Release Service",
      role: "System",
      action: "AUTO_RELEASE",
      timestamp: `${expiryDate}T00:01:00`,
      remarks: "Reservation expired and inventory released",
    });
  }
  return logs;
}

function makeReminders(status, reservationDate, expiryDate) {
  if (!["Reserved"].includes(status)) {
    if (status === "Released") {
      return [
        {
          type: "expired",
          label: "Expired",
          sentAt: expiryDate,
          channel: "SMS + Email",
        },
      ];
    }
    return [];
  }
  const remaining = Math.max(1, Math.floor((new Date(expiryDate) - new Date(TODAY)) / 86400000));
  const sent = [];
  if (remaining <= 5) {
    sent.push({ type: "5-days", label: "5 Days Remaining", sentAt: addDays(TODAY, -2), channel: "SMS" });
  }
  if (remaining <= 2) {
    sent.push({ type: "2-days", label: "2 Days Remaining", sentAt: addDays(TODAY, -1), channel: "Email" });
  }
  return sent;
}

const reservedPlots = plots.filter((p) => p.status === "Reserved");
const availablePlots = plots.filter((p) => p.status === "Available");
const usedPlotIds = new Set();
const reservations = [];

STATUS_PLAN.forEach(({ status, count }) => {
  for (let i = 0; i < count; i += 1) {
    let plot;
    if (status === "Reserved" && reservedPlots.length) {
      plot = reservedPlots.find((p) => !usedPlotIds.has(p.id)) || pick(reservedPlots);
    } else {
      plot = availablePlots.find((p) => !usedPlotIds.has(p.id)) || pick(availablePlots);
    }
    if (!plot) continue;
    usedPlotIds.add(plot.id);

    const customer = plot.customerId
      ? customers.find((c) => c.id === plot.customerId) || pick(customers)
      : pick(customers);
    const partner = pick(partners);
    const layout = layouts.find((l) => l.id === plot.layoutId) || pick(layouts);
    const venture = ventures.find((v) => v.id === plot.ventureId) || pick(ventures);
    const admin = pick(ADMINS);

    const daysAgo = status === "Released" ? 20 : Math.floor(Math.random() * 14) + 1;
    const reservationDate = addDays(TODAY, -daysAgo);
    const expiryDate =
      status === "Released"
        ? addDays(TODAY, -3)
        : addDays(reservationDate, settings.validityDays);
    const totalValue = plot.finalPrice || plot.totalPrice || 0;
    const reservationAmount = Math.max(
      Math.round((totalValue * settings.minimumReservationPercent) / 100),
      settings.minimumReservationFlat
    );
    const id = `RSV-${rsvId}`;
    rsvId += 1;

    reservations.push({
      id,
      reference: id,
      status,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      partnerId: partner.id,
      partnerName: partner.personal
        ? `${partner.personal.firstName} ${partner.personal.lastName}`
        : partner.companyName || "Channel Partner",
      ventureId: venture.id,
      ventureName: venture.name,
      layoutId: layout.id,
      layoutName: layout.name,
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
      extensionsCount: status === "Reserved" && Math.random() > 0.7 ? 1 : 0,
      maxExtensions: settings.maxExtensions,
      source: Math.random() > 0.3 ? "ERP" : "Website",
      createdBy: admin.name,
      createdByRole: admin.role,
      timeline: makeTimeline(status, reservationDate, expiryDate),
      reminders: makeReminders(status, reservationDate, expiryDate),
      activityLog: makeActivityLog(status, reservationDate, expiryDate, admin),
      documents: [],
    });
  }
});

const payload = {
  reservations,
  lastAutoReleaseRun: addDays(TODAY, -1),
  autoReleaseSchedule: "0 */6 * * *",
};

fs.writeFileSync(path.join(OUT, "reservations.json"), JSON.stringify(payload, null, 2));
fs.writeFileSync(path.join(OUT, "reservationSettings.json"), JSON.stringify(settings, null, 2));
fs.writeFileSync(path.join(OUT, "reservationRules.json"), JSON.stringify(rules, null, 2));

console.log(`Generated ${reservations.length} reservations`);
console.log("Status breakdown:", STATUS_PLAN.map((s) => `${s.status}: ${s.count}`).join(", "));

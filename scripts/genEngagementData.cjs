/**
 * Generates engagement & communication dummy data linked to existing ERP entities.
 * Run: node scripts/genEngagementData.cjs
 */
const fs = require("fs");
const path = require("path");

const partners = require("../src/data/channelPartners.json").filter((p) => p.status === "Approved");
const customers = require("../src/data/customers.json");
const properties = require("../src/data/properties.json");
const ventures = require("../src/data/ventures.json");
const layouts = require("../src/data/layouts.json");
const plots = require("../src/data/plots.json");

const TODAY = "2026-07-01";
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const MEETING_TYPES = ["Partner Review", "Sales Discussion", "Customer Introduction", "Project Briefing", "Training"];
const MEETING_MODES = ["Office", "Site Visit", "Online"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const EVENT_TYPES = ["Open House", "Project Launch", "Investor Meeting", "Partner Conference", "Training Session"];
const NOTIF_TYPES = ["Scrolling Header", "Website Popup", "Homepage Banner", "Announcement Card", "Ticker"];
const AUDIENCES = ["Website Visitors", "All Channel Partners", "Selected Partners", "Customers"];
const REMINDER_TYPES = ["Meeting", "Follow-up", "Site Visit", "Customer Call", "Property Visit"];
const COMM_TYPES = [
  "meeting-scheduled",
  "meeting-cancelled",
  "reminder-sent",
  "notification-published",
  "customer-assigned",
  "site-visit-completed",
  "event-created",
  "partner-confirmed",
];

let id = 1;
const nextId = (prefix) => `${prefix}-${String(id++).padStart(4, "0")}`;

const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "17:00"];
const dates = [
  "2026-06-28", "2026-06-29", "2026-06-30", TODAY,
  "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06",
  "2026-07-08", "2026-07-10", "2026-07-12", "2026-07-15", "2026-07-18",
];

function entityRefs() {
  const partner = pick(partners);
  const customer = pick(customers);
  const property = pick(properties);
  const venture = ventures.find((v) => v.id === property.ventureId) || pick(ventures);
  const layout = layouts.find((l) => l.id === property.layoutId) || pick(layouts);
  const plot = plots.find((p) => p.id === property.plotId) || pick(plots);
  return { partner, customer, property, venture, layout, plot };
}

const meetings = Array.from({ length: 28 }, (_, i) => {
  const { partner, customer, property, venture, layout, plot } = entityRefs();
  const date = dates[i % dates.length];
  const isToday = date === TODAY;
  const status =
    date < TODAY ? (Math.random() > 0.15 ? "Completed" : "Missed") :
    isToday ? (Math.random() > 0.5 ? "Scheduled" : "In Progress") :
    Math.random() > 0.2 ? "Scheduled" : "Draft";
  const mode = pick(MEETING_MODES);
  return {
    id: `MTG-${9000 + i}`,
    title: `${pick(MEETING_TYPES)} — ${venture.name.split(" ")[0]}`,
    type: pick(MEETING_TYPES),
    description: `Discussion regarding ${property.name} and customer requirements.`,
    partnerId: partner.id,
    partnerName: partner.personal?.name,
    customerId: customer.id,
    customerName: customer.name,
    propertyId: property.id,
    propertyName: property.name,
    ventureId: venture.id,
    ventureName: venture.name,
    layoutId: layout.id,
    layoutName: layout.name,
    plotId: plot.id,
    plotNumber: plot.plotNumber,
    date,
    time: pick(times),
    duration: pick([30, 45, 60, 90]),
    mode,
    location: mode === "Online" ? "Google Meet" : `${venture.city} Office`,
    meetLink: mode === "Online" ? "https://meet.google.com/abc-defg-hij" : "",
    priority: pick(PRIORITIES),
    notes: "Coordinate documents before meeting.",
    status,
    invitationStatus: status === "Scheduled" ? pick(["Pending", "Accepted", "Accepted"]) : "Accepted",
    createdDate: "2026-06-15",
  };
});

const siteVisits = Array.from({ length: 20 }, (_, i) => {
  const { partner, customer, property, venture } = entityRefs();
  const date = dates[(i + 3) % dates.length];
  const status =
    date < TODAY ? "Completed" :
    date === TODAY ? pick(["Scheduled", "In Progress"]) :
    "Scheduled";
  return {
    id: `SV-${9100 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    propertyId: property.id,
    propertyName: property.name,
    ventureId: venture.id,
    ventureName: venture.name,
    partnerId: partner.id,
    partnerName: partner.personal?.name,
    date,
    time: pick(times),
    siteAddress: `${venture.city}, ${venture.district} — ${venture.name}`,
    remarks: pick(["Bring ID proof", "Family visit", "Plot selection", "Document verification"]),
    status,
    createdDate: "2026-06-10",
  };
});

const events = [
  {
    id: "EVT-9201",
    name: "Green Valley Open House",
    type: "Open House",
    description: "Weekend open house at Green Valley Township with guided plot tours.",
    venue: "Green Valley Township, Shamshabad",
    date: "2026-07-06",
    time: "10:00",
    endTime: "17:00",
    ventureId: "VNT-2001",
    ventureName: "Green Valley Township",
    participants: pickN(partners, 5).map((p) => p.id),
    registrationRequired: true,
    registrations: 42,
    status: "Upcoming",
    createdDate: "2026-06-01",
  },
  {
    id: "EVT-9202",
    name: "Lakeview Residency Launch",
    type: "Project Launch",
    description: "Official launch of Lakeview Residency pre-launch block.",
    venue: "Lakeview Convention Hall, Shankarpally",
    date: "2026-07-12",
    time: "11:00",
    endTime: "14:00",
    ventureId: "VNT-2009",
    ventureName: "Lakeview Residency",
    participants: pickN(partners, 8).map((p) => p.id),
    registrationRequired: true,
    registrations: 68,
    status: "Upcoming",
    createdDate: "2026-06-05",
  },
  {
    id: "EVT-9203",
    name: "Partner Sales Conference 2026",
    type: "Partner Conference",
    description: "Annual channel partner conference with training and networking.",
    venue: "Hyderabad International Convention Centre",
    date: "2026-07-20",
    time: "09:00",
    endTime: "18:00",
    ventureId: null,
    ventureName: null,
    participants: partners.slice(0, 15).map((p) => p.id),
    registrationRequired: true,
    registrations: 22,
    status: "Upcoming",
    createdDate: "2026-05-20",
  },
  {
    id: "EVT-9204",
    name: "CRM & Lead Management Training",
    type: "Training Session",
    description: "Hands-on ERP training for channel partners.",
    venue: "Merit Real Solutions HQ",
    date: "2026-07-04",
    time: "14:00",
    endTime: "17:00",
    ventureId: null,
    ventureName: null,
    participants: pickN(partners, 10).map((p) => p.id),
    registrationRequired: false,
    registrations: 10,
    status: "Upcoming",
    createdDate: "2026-06-18",
  },
  {
    id: "EVT-9205",
    name: "Urban Heights Investor Meet",
    type: "Investor Meeting",
    description: "Exclusive investor briefing for Urban Heights venture.",
    venue: "Urban Heights Site Office",
    date: "2026-06-28",
    time: "16:00",
    endTime: "18:00",
    ventureId: "VNT-2004",
    ventureName: "Urban Heights",
    participants: pickN(partners, 4).map((p) => p.id),
    registrationRequired: true,
    registrations: 15,
    status: "Completed",
    createdDate: "2026-06-01",
  },
  {
    id: "EVT-9206",
    name: "Sunrise Farms Plot Fair",
    type: "Open House",
    description: "Special plot fair with weekend discounts.",
    venue: "Sunrise Farms, Medchal",
    date: "2026-07-08",
    time: "10:30",
    endTime: "16:30",
    ventureId: "VNT-2006",
    ventureName: "Sunrise Farms",
    participants: pickN(partners, 6).map((p) => p.id),
    registrationRequired: true,
    registrations: 35,
    status: "Upcoming",
    createdDate: "2026-06-22",
  },
];

const announcements = [
  {
    id: "ANN-9301",
    title: "Green Valley Township Site Visit",
    message: "Sunday 10:30 AM — Limited Seats. Register Now for a guided tour of premium open plots near Shamshabad Airport.",
    notificationType: "Scrolling Header",
    priority: "High",
    startDate: "2026-06-28",
    endDate: "2026-07-08",
    targetAudience: "Website Visitors",
    targetPartnerIds: [],
    enabled: true,
    pinned: true,
    status: "Published",
    scheduledPublish: null,
    ctaLabel: "Register Now",
    ctaLink: "/site-visit/green-valley",
    createdDate: "2026-06-25",
    publishedDate: "2026-06-28",
  },
  {
    id: "ANN-9302",
    title: "New DTCP Approved Venture Launched",
    message: "Lakeview Residency is now DTCP approved. Book your plot today with early-bird pricing.",
    notificationType: "Homepage Banner",
    priority: "High",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    targetAudience: "Website Visitors",
    targetPartnerIds: [],
    enabled: true,
    pinned: false,
    status: "Published",
    scheduledPublish: null,
    ctaLabel: "Book Today",
    ctaLink: "/ventures/lakeview",
    createdDate: "2026-06-30",
    publishedDate: "2026-07-01",
  },
  {
    id: "ANN-9303",
    title: "Special Discount — Only This Weekend",
    message: "Get 5% off on selected plots at Urban Heights. Offer valid July 5–6 only.",
    notificationType: "Website Popup",
    priority: "Urgent",
    startDate: "2026-07-05",
    endDate: "2026-07-06",
    targetAudience: "Website Visitors",
    targetPartnerIds: [],
    enabled: true,
    pinned: false,
    status: "Scheduled",
    scheduledPublish: "2026-07-05",
    ctaLabel: "View Offers",
    ctaLink: "/offers/urban-heights",
    createdDate: "2026-06-29",
    publishedDate: null,
  },
  {
    id: "ANN-9304",
    title: "Partner Incentive Program Q3",
    message: "Enhanced commission structure for all channel partners. Check your dashboard for details.",
    notificationType: "Announcement Card",
    priority: "Medium",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    targetAudience: "All Channel Partners",
    targetPartnerIds: [],
    enabled: true,
    pinned: false,
    status: "Published",
    scheduledPublish: null,
    ctaLabel: "Learn More",
    ctaLink: "/partners/incentives",
    createdDate: "2026-06-28",
    publishedDate: "2026-07-01",
  },
  {
    id: "ANN-9305",
    title: "Merit Avenue — Last 12 Plots",
    message: "Only 12 plots remaining at Merit Avenue. Premium east-facing inventory selling fast.",
    notificationType: "Ticker",
    priority: "Medium",
    startDate: "2026-07-02",
    endDate: "2026-07-15",
    targetAudience: "Website Visitors",
    targetPartnerIds: [],
    enabled: true,
    pinned: false,
    status: "Draft",
    scheduledPublish: "2026-07-02",
    ctaLabel: "Explore Plots",
    ctaLink: "/ventures/merit-avenue",
    createdDate: "2026-07-01",
    publishedDate: null,
  },
  {
    id: "ANN-9306",
    title: "Customer Payment Reminder",
    message: "Pending installment due this week. Pay online for instant receipt generation.",
    notificationType: "Announcement Card",
    priority: "Low",
    startDate: "2026-07-01",
    endDate: "2026-07-07",
    targetAudience: "Customers",
    targetPartnerIds: [],
    enabled: true,
    pinned: false,
    status: "Published",
    scheduledPublish: null,
    ctaLabel: "Pay Now",
    ctaLink: "/payments",
    createdDate: "2026-07-01",
    publishedDate: "2026-07-01",
  },
];

const reminders = Array.from({ length: 24 }, (_, i) => {
  const { partner, customer, property } = entityRefs();
  const type = pick(REMINDER_TYPES);
  const date = dates[i % dates.length];
  let status = "Upcoming";
  if (date < TODAY) status = Math.random() > 0.3 ? "Completed" : "Overdue";
  if (date === TODAY) status = pick(["Today", "Upcoming", "Completed"]);
  return {
    id: `REM-${9400 + i}`,
    type,
    title: `${type} — ${customer.name}`,
    description: `Reminder for ${property.name}`,
    partnerId: partner.id,
    partnerName: partner.personal?.name,
    customerId: customer.id,
    customerName: customer.name,
    propertyId: property.id,
    propertyName: property.name,
    dueDate: date,
    dueTime: pick(times),
    status,
    priority: pick(PRIORITIES),
    createdDate: "2026-06-01",
  };
});

const communications = [];
meetings.slice(0, 8).forEach((m) => {
  communications.push({
    id: nextId("COM"),
    type: "meeting-scheduled",
    title: "Meeting Scheduled",
    description: `${m.title} with ${m.partnerName} on ${m.date} at ${m.time}`,
    partnerId: m.partnerId,
    partnerName: m.partnerName,
    customerId: m.customerId,
    date: m.createdDate,
    tone: "accent",
  });
});
announcements.filter((a) => a.status === "Published").forEach((a) => {
  communications.push({
    id: nextId("COM"),
    type: "notification-published",
    title: "Notification Published",
    description: `"${a.title}" published to ${a.targetAudience}`,
    partnerId: null,
    partnerName: null,
    customerId: null,
    date: a.publishedDate || a.createdDate,
    tone: "success",
  });
});
siteVisits.filter((s) => s.status === "Completed").slice(0, 5).forEach((s) => {
  communications.push({
    id: nextId("COM"),
    type: "site-visit-completed",
    title: "Site Visit Completed",
    description: `${s.customerName} visited ${s.ventureName}`,
    partnerId: s.partnerId,
    partnerName: s.partnerName,
    customerId: s.customerId,
    date: s.date,
    tone: "success",
  });
});
reminders.filter((r) => r.status === "Completed").slice(0, 5).forEach((r) => {
  communications.push({
    id: nextId("COM"),
    type: "reminder-sent",
    title: "Reminder Sent",
    description: r.title,
    partnerId: r.partnerId,
    partnerName: r.partnerName,
    customerId: r.customerId,
    date: r.dueDate,
    tone: "info",
  });
});
pickN(partners, 5).forEach((p) => {
  communications.push({
    id: nextId("COM"),
    type: "customer-assigned",
    title: "Customer Assigned",
    description: `New customer allocated to ${p.personal?.name}`,
    partnerId: p.id,
    partnerName: p.personal?.name,
    customerId: pick(customers).id,
    date: "2026-06-25",
    tone: "accent",
  });
});
communications.sort((a, b) => new Date(b.date) - new Date(a.date));

const activities = [
  ...meetings.slice(0, 4).map((m) => ({
    id: `ACT-${m.id}`,
    type: "meeting-created",
    title: "Meeting Created",
    description: m.title,
    date: m.createdDate,
    tone: "accent",
  })),
  ...announcements.filter((a) => a.status === "Published").map((a) => ({
    id: `ACT-${a.id}`,
    type: "notification-published",
    title: "Notification Published",
    description: a.title,
    date: a.publishedDate || a.createdDate,
    tone: "success",
  })),
  ...events.slice(0, 3).map((e) => ({
    id: `ACT-${e.id}`,
    type: "event-created",
    title: "Event Created",
    description: e.name,
    date: e.createdDate,
    tone: "info",
  })),
  {
    id: "ACT-CONFIRM-1",
    type: "partner-confirmed",
    title: "Partner Confirmed",
    description: `${partners[0].personal?.name} accepted meeting invitation`,
    date: TODAY,
    tone: "success",
  },
  {
    id: "ACT-INVITE-1",
    type: "customer-invited",
    title: "Customer Invited",
    description: "Site visit invitation sent to Deepak Choudary",
    date: "2026-06-30",
    tone: "accent",
  },
  ...events.filter((e) => e.status === "Completed").map((e) => ({
    id: `ACT-DONE-${e.id}`,
    type: "event-completed",
    title: "Event Completed",
    description: e.name,
    date: e.date,
    tone: "success",
  })),
].sort((a, b) => new Date(b.date) - new Date(a.date));

const out = {
  version: 1,
  generatedDate: TODAY,
  meetings,
  siteVisits,
  events,
  announcements,
  reminders,
  communications,
  activities,
};

const outPath = path.join(__dirname, "../src/data/engagement.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Generated engagement data → ${outPath}`);
console.log(`  Meetings: ${meetings.length}, Site Visits: ${siteVisits.length}, Events: ${events.length}`);
console.log(`  Announcements: ${announcements.length}, Reminders: ${reminders.length}`);

/* Generates all ERP dummy data. Run: node scripts/genErpData.cjs */
const fs = require("fs");
const path = require("path");
const out = (name, data) => {
  const p = path.join(__dirname, "..", "src", "data", name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`  ${name}: ${data.length} records`);
};

let seed = 42;
const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (a, b) => Math.floor(rng() * (b - a + 1)) + a;
const date = (y1, y2) => `${ri(y1, y2)}-${String(ri(1, 12)).padStart(2, "0")}-${String(ri(1, 28)).padStart(2, "0")}`;
const img = (i) => `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&q=80`;

const FIRST = ["Ravi", "Suresh", "Priya", "Lakshmi", "Anil", "Kiran", "Deepak", "Meena", "Rajesh", "Sneha", "Arjun", "Divya", "Naveen", "Harish", "Pooja"];
const LAST = ["Reddy", "Rao", "Sharma", "Kumar", "Naidu", "Goud", "Verma", "Patel", "Choudary"];
const name = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `+91 ${ri(70, 99)}${ri(10000000, 99999999)}`;
const email = (n) => `${n.toLowerCase().replace(/\s/g, ".")}@email.com`;

const ventures = require("../src/data/ventures.json");
const layouts = require("../src/data/layouts.json");
const plots = require("../src/data/plots.json");

// Properties
const types = ["Villa", "Apartment", "Open Plot", "Farm Land", "Commercial"];
const statuses = ["Available", "Reserved", "Booked", "Sold"];
const properties = Array.from({ length: 25 }, (_, i) => {
  const v = pick(ventures);
  const l = pick(layouts.filter((x) => x.ventureId === v.id) || layouts);
  const pl = pick(plots.filter((x) => x.layoutId === l.id) || plots);
  const n = name();
  const area = ri(120, 600);
  const rate = ri(8000, 55000);
  const base = area * rate;
  const d = date(2022, 2025);
  return {
    id: `PRP-${5001 + i}`,
    name: `${v.name.split(" ")[0]} ${pick(["Residence", "Heights", "Enclave", "Park", "Gardens"])} ${i + 1}`,
    code: `PRP-${String(i + 1).padStart(3, "0")}`,
    propertyType: pick(types),
    status: pick(statuses),
    ventureId: v.id,
    ventureName: v.name,
    layoutId: l.id,
    layoutName: l.name,
    plotId: pl.id,
    plotNumber: pl.plotNumber,
    city: v.city,
    district: v.district,
    state: v.state,
    area,
    dimensions: `${ri(30, 60)}x${ri(40, 90)}`,
    facing: pick(["East", "West", "North", "South", "North-East"]),
    basePrice: base,
    currentPrice: Math.round(base * 1.1),
    finalPrice: Math.round(base * 1.15),
    thumbnail: img(100 + i),
    banner: img(200 + i),
    gallery: [img(300 + i), img(400 + i), img(500 + i)],
    amenities: { parking: true, security: true, power: true, water: rng() > 0.3, garden: rng() > 0.5 },
    owner: { name: n, phone: phone(), email: email(n), address: `${v.city}, ${v.district}`, pan: `ABCDE${ri(1000, 9999)}F`, aadhar: `${ri(1000, 9999)} ${ri(1000, 9999)} ${ri(1000, 9999)}` },
    documents: [{ id: `d${i}`, name: "Sale Deed", type: "pdf", size: "2.1 MB", date: d }],
    location: { mapUrl: v.mapUrl, latitude: v.latitude, longitude: v.longitude, landmarks: v.landmarks?.slice(0, 2) || [] },
    history: [{ type: "created", title: "Property listed", description: "Added to inventory", date: d, tone: "accent" }],
    createdDate: d,
    lastUpdated: date(2025, 2026),
  };
});
out("properties.json", properties);

// Customers
const customers = Array.from({ length: 30 }, (_, i) => {
  const n = name();
  const d = date(2021, 2024);
  const prop = pick(properties);
  return {
    id: `CUST-${6001 + i}`,
    name: n,
    email: email(n),
    phone: phone(),
    alternatePhone: rng() > 0.5 ? phone() : "",
    status: pick(["Active", "Inactive"]),
    kycStatus: pick(["Verified", "Pending", "Rejected"]),
    address: `${ri(1, 99)} Main Road, ${pick(["Hyderabad", "Vijayawada", "Warangal"])}`,
    city: pick(["Hyderabad", "Shamshabad", "Gachibowli", "Vijayawada"]),
    state: pick(["Telangana", "Andhra Pradesh"]),
    pan: `ABCDE${ri(1000, 9999)}F`,
    aadhar: `${ri(1000, 9999)} ${ri(1000, 9999)} ${ri(1000, 9999)}`,
    occupation: pick(["Business", "IT Professional", "Doctor", "Engineer", "Retired"]),
    source: pick(["Referral", "Website", "Agent", "Walk-in"]),
    assignedAgent: pick(["Vamsi Krishna", "Sandeep Reddy", "Aarti Menon"]),
    purchasedProperties: rng() > 0.4 ? [{ propertyId: prop.id, propertyName: prop.name, plotNumber: prop.plotNumber, date: d }] : [],
    bookingIds: [],
    totalPaid: ri(5, 80) * 100000,
    outstanding: ri(0, 20) * 100000,
    documents: [{ id: `kyc${i}`, name: "Aadhar Card", type: "pdf", size: "1.2 MB", date: d }],
    timeline: [{ type: "created", title: "Customer onboarded", description: "Profile created", date: d, tone: "accent" }],
    communications: [{ type: "call", title: "Intro call", date: date(2024, 2026), notes: "Discussed plot options" }],
    activities: [{ type: "visit", title: "Site visit", date: date(2024, 2026), description: "Visited Green Valley" }],
    createdDate: d,
  };
});
out("customers.json", customers);

// Leads
const leadStatuses = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const leads = Array.from({ length: 35 }, (_, i) => {
  const n = name();
  const d = date(2024, 2026);
  return {
    id: `LED-${7001 + i}`,
    name: n,
    email: email(n),
    phone: phone(),
    status: pick(leadStatuses),
    source: pick(["Website", "Referral", "Walk-in", "Social Media", "Agent"]),
    priority: pick(["High", "Medium", "Low"]),
    budget: ri(20, 200) * 100000,
    interestedProperty: pick(properties).name,
    ventureName: pick(ventures).name,
    assignedExecutive: pick(["Praveen Kumar", "Nisha Rao", "Tarun Reddy"]),
    remarks: pick(["Interested in east-facing", "Budget flexible", "Needs loan assistance", ""]),
    expectedCloseDate: date(2026, 2026),
    createdDate: d,
    lastUpdated: date(2025, 2026),
    timeline: [{ type: "created", title: "Lead captured", description: `Source: ${pick(["Website", "Referral"])}`, date: d, tone: "accent" }],
  };
});
out("leads.json", leads);

// Follow-ups
const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const followups = Array.from({ length: 40 }, (_, i) => {
  const lead = pick(leads);
  const offset = ri(-5, 10);
  const sched = new Date(today);
  sched.setDate(sched.getDate() + offset);
  const schedDate = fmt(sched);
  let status = "Upcoming";
  if (offset < 0) status = "Overdue";
  if (offset === 0) status = "Today";
  if (rng() > 0.7 && offset < 0) status = "Completed";
  return {
    id: `FU-${8001 + i}`,
    leadId: lead.id,
    leadName: lead.name,
    customerId: rng() > 0.5 ? pick(customers).id : null,
    customerName: rng() > 0.5 ? pick(customers).name : null,
    type: pick(["Call", "Meeting", "Site Visit", "Reminder"]),
    status,
    priority: pick(["High", "Medium", "Low"]),
    scheduledDate: schedDate,
    scheduledTime: `${String(ri(9, 17)).padStart(2, "0")}:${pick(["00", "30"])}`,
    notes: pick(["Discuss pricing", "Site visit scheduled", "Follow up on documents", ""]),
    assignedTo: pick(["Vamsi Krishna", "Sandeep Reddy", "Praveen Kumar"]),
    completedDate: status === "Completed" ? schedDate : null,
    createdDate: date(2025, 2026),
  };
});
out("followups.json", followups);

// Bookings
const bookings = Array.from({ length: 28 }, (_, i) => {
  const cust = pick(customers);
  const prop = pick(properties);
  const amt = ri(5, 50) * 100000;
  const d = date(2024, 2026);
  return {
    id: `BKG-${9001 + i}`,
    bookingNumber: `BK-${2025}-${String(i + 1).padStart(4, "0")}`,
    customerId: cust.id,
    customerName: cust.name,
    propertyId: prop.id,
    propertyName: prop.name,
    plotId: prop.plotId,
    plotNumber: prop.plotNumber,
    ventureName: prop.ventureName,
    layoutName: prop.layoutName,
    bookingAmount: amt,
    advancePaid: Math.round(amt * 0.2),
    agreementStatus: pick(["Pending", "Signed", "Registered"]),
    status: pick(["Active", "Completed", "Cancelled"]),
    bookingDate: d,
    agreementDate: rng() > 0.3 ? date(2025, 2026) : null,
    documents: [{ id: `bd${i}`, name: "Booking Form", type: "pdf", size: "1.5 MB", date: d }],
    payments: [],
    timeline: [{ type: "created", title: "Booking created", description: `Plot ${prop.plotNumber} booked`, date: d, tone: "accent" }],
    createdDate: d,
  };
});
out("bookings.json", bookings);

// Payments
const payments = Array.from({ length: 45 }, (_, i) => {
  const bkg = pick(bookings);
  const amt = ri(1, 15) * 100000;
  const d = date(2024, 2026);
  return {
    id: `PAY-${10001 + i}`,
    receiptNumber: `RCP-${2025}-${String(i + 1).padStart(4, "0")}`,
    bookingId: bkg.id,
    bookingNumber: bkg.bookingNumber,
    customerId: bkg.customerId,
    customerName: bkg.customerName,
    amount: amt,
    method: pick(["Cash", "Cheque", "UPI", "Bank Transfer"]),
    type: pick(["Advance", "Installment", "Final"]),
    status: pick(["Completed", "Pending", "Failed"]),
    installmentNo: ri(1, 12),
    totalInstallments: 12,
    dueDate: date(2025, 2026),
    paidDate: d,
    outstandingAfter: ri(0, 30) * 100000,
    remarks: "",
    createdDate: d,
  };
});
out("payments.json", payments);

// Receipts
const receipts = payments.filter((p) => p.status === "Completed").slice(0, 35).map((p, i) => ({
  id: `RCP-${11001 + i}`,
  receiptNumber: p.receiptNumber,
  paymentId: p.id,
  bookingId: p.bookingId,
  customerId: p.customerId,
  customerName: p.customerName,
  amount: p.amount,
  paymentMethod: p.method,
  paymentDate: p.paidDate,
  bookingNumber: p.bookingNumber,
  plotNumber: pick(bookings).plotNumber,
  status: pick(["Issued", "Void"]),
  createdDate: p.createdDate,
}));
out("receipts.json", receipts);

// Agreements
const agreements = bookings.slice(0, 18).map((b, i) => ({
  id: `AGR-${12001 + i}`,
  agreementNumber: `AGR-${2025}-${String(i + 1).padStart(4, "0")}`,
  bookingId: b.id,
  customerName: b.customerName,
  propertyName: b.propertyName,
  plotNumber: b.plotNumber,
  status: pick(["Draft", "Signed", "Registered", "Cancelled"]),
  version: ri(1, 3),
  signedDate: rng() > 0.3 ? date(2025, 2026) : null,
  registeredDate: rng() > 0.6 ? date(2025, 2026) : null,
  documents: [{ id: `ad${i}`, name: "Sale Agreement", type: "pdf", size: "3.2 MB", date: b.createdDate, version: 1 }],
  versionHistory: [{ version: 1, date: b.createdDate, notes: "Initial draft" }],
  createdDate: b.createdDate,
  lastUpdated: date(2025, 2026),
}));
out("agreements.json", agreements);

// Registrations
const registrations = bookings.filter((b) => b.agreementStatus === "Registered").slice(0, 15).map((b, i) => ({
  id: `REG-${13001 + i}`,
  registrationNumber: `REG-${2025}-${String(i + 1).padStart(4, "0")}`,
  bookingId: b.id,
  customerName: b.customerName,
  propertyName: b.propertyName,
  plotNumber: b.plotNumber,
  status: pick(["Pending", "In Progress", "Completed", "Rejected"]),
  submittedDate: date(2025, 2026),
  completedDate: rng() > 0.5 ? date(2025, 2026) : null,
  documents: [{ id: `rd${i}`, name: "Registration Application", type: "pdf", size: "2.0 MB", date: b.createdDate }],
  timeline: [{ type: "submitted", title: "Application submitted", date: date(2025, 2026), tone: "accent" }],
  createdDate: b.createdDate,
}));
out("registrations.json", registrations);

console.log("Done.");

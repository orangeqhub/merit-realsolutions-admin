const fs = require("fs");
const path = require("path");

const firstNames = [
  "Ravi", "Priya", "Suresh", "Lakshmi", "Anil", "Divya", "Kiran", "Meena", "Vijay", "Sneha",
  "Rajesh", "Pooja", "Naveen", "Anitha", "Praveen", "Swathi", "Harish", "Kavya", "Ramesh", "Deepa",
  "Srinivas", "Madhuri", "Gopal", "Revathi", "Venkat", "Sandhya", "Ashok", "Uma", "Chandra", "Latha",
  "Mahesh", "Geetha", "Balaji", "Nirmala", "Sekhar", "Padma", "Raghav", "Sunitha", "Arun", "Vani",
  "Karthik", "Shilpa", "Mohan", "Radha", "Ganesh", "Bhavani", "Santosh", "Jyothi", "Nikhil", "Asha",
];

const lastNames = [
  "Reddy", "Rao", "Sharma", "Patel", "Kumar", "Goud", "Verma", "Singh", "Naidu", "Choudary",
  "Menon", "Iyer", "Gupta", "Das", "Murthy", "Krishna", "Prasad", "Devi", "Chandra", "Babu",
];

const cities = [
  { city: "Hyderabad", district: "Rangareddy", state: "Telangana", pin: "500032" },
  { city: "Secunderabad", district: "Hyderabad", state: "Telangana", pin: "500003" },
  { city: "Vijayawada", district: "Krishna", state: "Andhra Pradesh", pin: "520010" },
  { city: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh", pin: "530003" },
  { city: "Bangalore", district: "Bengaluru Urban", state: "Karnataka", pin: "560001" },
  { city: "Chennai", district: "Chennai", state: "Tamil Nadu", pin: "600001" },
  { city: "Pune", district: "Pune", state: "Maharashtra", pin: "411001" },
  { city: "Mumbai", district: "Mumbai", state: "Maharashtra", pin: "400001" },
  { city: "Warangal", district: "Warangal", state: "Telangana", pin: "506001" },
  { city: "Nizamabad", district: "Nizamabad", state: "Telangana", pin: "503001" },
];

const statuses = ["Pending", "Under Verification", "Approved", "Rejected", "On Hold"];
const sources = ["Website", "Referral", "Walk-in", "Social Media", "Partner Portal"];
const genders = ["Male", "Female", "Other"];
const occupations = ["Real Estate Broker", "Property Consultant", "Independent Agent", "Channel Partner", "Land Dealer"];
const brokerages = ["None", "PropTiger", "Square Yards", "Local Agency", "Self-employed", "ANAROCK", "Independent"];
const areas = ["ORR Corridor", "Shamshabad", "Gachibowli", "Kondapur", "Miyapur", "Banjara Hills", "HITEC City", "Kukatpally"];
const languages = ["Telugu", "Hindi", "English", "Tamil", "Kannada"];
const riskLevels = ["Low", "Medium", "High"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function phone() {
  return `+91 ${rand(7, 9)}${rand(100000000, 999999999)}`;
}

function buildTimeline(status, appliedDate) {
  const events = [
    { type: "submitted", title: "Application Submitted", description: "Partner application received via website form", date: appliedDate, tone: "accent" },
  ];
  if (["Under Verification", "Approved", "Rejected", "On Hold"].includes(status)) {
    events.push({ type: "verification", title: "Verification Started", description: "Admin began identity and document review", date: appliedDate, tone: "info" });
  }
  if (["Under Verification", "Approved", "Rejected", "On Hold"].includes(status)) {
    events.push({ type: "documents", title: "Documents Uploaded", description: "Aadhaar, PAN and supporting documents received", date: appliedDate, tone: "neutral" });
  }
  if (["Approved", "Rejected", "On Hold"].includes(status)) {
    events.push({ type: "checked", title: "Documents Checked", description: "All mandatory documents reviewed", date: appliedDate, tone: "warning" });
  }
  if (status === "Approved") {
    events.push({ type: "approved", title: "Application Approved", description: "Partner onboarded to Merit Real Solutions network", date: appliedDate, tone: "success" });
  }
  if (status === "Rejected") {
    events.push({ type: "rejected", title: "Application Rejected", description: "Application did not meet verification criteria", date: appliedDate, tone: "danger" });
  }
  if (status === "On Hold") {
    events.push({ type: "hold", title: "Placed On Hold", description: "Awaiting additional information from applicant", date: appliedDate, tone: "warning" });
  }
  return events;
}

const records = [];
const statusPool = [];
for (let i = 0; i < 8; i++) statusPool.push("Pending");
for (let i = 0; i < 10; i++) statusPool.push("Under Verification");
for (let i = 0; i < 25; i++) statusPool.push("Approved");
for (let i = 0; i < 5; i++) statusPool.push("Rejected");
for (let i = 0; i < 2; i++) statusPool.push("On Hold");

for (let i = 0; i < 50; i++) {
  const fn = firstNames[i];
  const ln = lastNames[i % lastNames.length];
  const name = `${fn} ${ln}`;
  const loc = cities[i % cities.length];
  const status = statusPool[i];
  const appliedDaysAgo = rand(0, 120);
  const appliedDate = dateOffset(appliedDaysAgo);
  const exp = rand(1, 18);
  const id = `CP-${10001 + i}`;
  const applicationId = `CPA-2026-${String(i + 1).padStart(4, "0")}`;
  const approved = status === "Approved";
  const partnerCode = approved ? `CPR-2026-${String(i + 1).padStart(4, "0")}` : null;
  const approvalDate = approved ? dateOffset(Math.max(0, appliedDaysAgo - rand(1, 14))) : null;

  const verComplete = approved || status === "Rejected";
  const underVer = status === "Under Verification" || verComplete;

  records.push({
    id,
    applicationId,
    partnerCode,
    status,
    partnerStatus: approved ? (Math.random() > 0.15 ? "Active" : "Inactive") : null,
    source: pick(sources),
    appliedDate,
    approvalDate,
    photo: `https://i.pravatar.cc/150?u=cp${i + 1}`,
    personal: {
      name,
      gender: pick(genders),
      dob: `${rand(1975, 1998)}-${String(rand(1, 12)).padStart(2, "0")}-${String(rand(1, 28)).padStart(2, "0")}`,
      mobile: phone(),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`,
      address: `${rand(1, 200)} Main Road, ${loc.city}`,
      city: loc.city,
      district: loc.district,
      state: loc.state,
      pincode: loc.pin,
    },
    professional: {
      occupation: pick(occupations),
      yearsExperience: exp,
      currentBrokerage: pick(brokerages),
      areasCovered: [pick(areas), pick(areas)].filter((v, idx, a) => a.indexOf(v) === idx),
      languages: [pick(languages), pick(languages)].filter((v, idx, a) => a.indexOf(v) === idx),
      monthlyLeads: rand(5, 80),
      previousProjects: [`${pick(["Green Valley", "Sunrise Farms", "Lakeview", "Urban Heights"])} Phase ${rand(1, 3)}`],
    },
    documents: {
      photo: { id: "doc-photo", name: "Profile Photo", type: "image", size: "245 KB", url: `https://i.pravatar.cc/400?u=cp${i + 1}` },
      aadhaar: { id: "doc-aadhaar", name: "Aadhaar Card", type: "pdf", size: "1.2 MB", date: appliedDate },
      pan: { id: "doc-pan", name: "PAN Card", type: "pdf", size: "890 KB", date: appliedDate },
      drivingLicense: { id: "doc-dl", name: "Driving License", type: "pdf", size: "1.1 MB", date: appliedDate },
      rera: Math.random() > 0.4 ? { id: "doc-rera", name: "RERA Certificate", type: "pdf", size: "2.4 MB", date: appliedDate } : null,
    },
    verification: {
      identityVerified: underVer && Math.random() > 0.2,
      phoneVerified: underVer && Math.random() > 0.15,
      emailVerified: underVer && Math.random() > 0.25,
      addressVerified: underVer && Math.random() > 0.3,
      experienceVerified: verComplete && Math.random() > 0.2,
      documentsVerified: verComplete && Math.random() > 0.15,
      riskLevel: pick(riskLevels),
      recommendation: approved ? "Recommend approval — strong track record" : status === "Rejected" ? "Does not meet minimum criteria" : "Pending full document review",
      adminRemarks: status === "On Hold" ? "Requested updated RERA certificate" : "",
      internalNotes: "Background check initiated via standard KYC workflow",
      verificationStatus: status === "Under Verification" ? "In Progress" : verComplete ? "Completed" : "Not Started",
    },
    timeline: buildTimeline(status, appliedDate),
    verificationHistory: underVer
      ? [
          { action: "Verification assigned", by: "Admin", date: appliedDate },
          ...(verComplete ? [{ action: "Final review completed", by: "Compliance Team", date: approvalDate || appliedDate }] : []),
        ]
      : [],
  });
}

const out = path.join(__dirname, "../src/data/channelPartners.json");
fs.writeFileSync(out, JSON.stringify(records, null, 2));
console.log(`Generated ${records.length} channel partner applications → ${out}`);

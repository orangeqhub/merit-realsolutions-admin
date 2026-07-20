const fs = require("fs");
const path = require("path");

const partners = require("../src/data/channelPartners.json").filter(
  (p) => p.status === "Approved"
);
const ventures = require("../src/data/ventures.json");
const layouts = require("../src/data/layouts.json");
const plots = require("../src/data/plots.json");
const properties = require("../src/data/properties.json");
const leads = require("../src/data/leads.json");

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sample = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (d) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().split("T")[0];
};

function assignBlock(ids) {
  return ids.map((id) => ({ id, assignedDate: daysAgo(rand(1, 60)) }));
}

const assignments = {};

partners.forEach((p, idx) => {
  const ventureIds = sample(ventures.map((v) => v.id), rand(1, Math.min(3, ventures.length)));
  const layoutPool = layouts.filter((l) => ventureIds.includes(l.ventureId)).map((l) => l.id);
  const layoutIds = sample(layoutPool.length ? layoutPool : layouts.map((l) => l.id), rand(1, Math.min(4, layouts.length)));

  const plotPool = plots.filter((pl) => layoutIds.includes(pl.layoutId)).map((pl) => pl.id);
  const plotIds = sample(plotPool.length ? plotPool : plots.map((pl) => pl.id), rand(8, 20));

  const propertyIds = sample(properties.map((pr) => pr.id), rand(1, Math.min(6, properties.length)));
  const leadIds = sample(leads.map((l) => l.id), rand(6, 14));

  const city = p.personal?.city || pick(["Hyderabad", "Vijayawada", "Bangalore"]);
  const territories = [
    {
      type: "City",
      value: city,
      assignedDate: daysAgo(rand(1, 90)),
    },
  ];

  const timeline = [
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
      date: p.approvalDate || daysAgo(rand(1, 30)),
      tone: "success",
    },
  ];

  assignments[p.id] = {
    ventures: assignBlock(ventureIds),
    layouts: assignBlock(layoutIds),
    properties: assignBlock(propertyIds),
    plots: assignBlock(plotIds),
    leads: assignBlock(leadIds),
    territories,
    timeline,
    metrics: {
      assignedCustomers: rand(1, 18),
      siteVisitsScheduled: rand(0, 6),
      activeDeals: rand(0, 5),
      revenue: rand(8, 60) * 100000,
      totalBookings: rand(0, 12),
    },
  };
});

const out = {
  version: 1,
  generatedDate: today(),
  assignments,
};

const outPath = path.join(__dirname, "../src/data/partnerAssignments.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Generated partner assignments → ${outPath}`);


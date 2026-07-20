export { formatINR, formatFull, formatDate } from "../../utils/format";

export const LEAD_STATUS_META = {
  New: { label: "New", tone: "info", color: "#2563eb" },
  Contacted: { label: "Contacted", tone: "violet", color: "#7c3aed" },
  Qualified: { label: "Qualified", tone: "accent", color: "#0d9488" },
  Proposal: { label: "Proposal", tone: "warning", color: "#d97706" },
  Negotiation: { label: "Negotiation", tone: "warning", color: "#ea580c" },
  Won: { label: "Won", tone: "success", color: "#059669" },
  Lost: { label: "Lost", tone: "danger", color: "#dc2626" },
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_META);

export const PIPELINE_COLUMNS = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

export const LEAD_PRIORITIES = ["High", "Medium", "Low"];

export const PRIORITY_META = {
  High: { tone: "danger" },
  Medium: { tone: "warning" },
  Low: { tone: "neutral" },
};

export const LEAD_SOURCES = [
  "Walk-in",
  "Website",
  "Referral",
  "Agent",
  "Social Media",
  "Campaign",
];

export const EMPTY_LEAD = {
  name: "",
  email: "",
  phone: "",
  status: "New",
  source: "",
  priority: "Medium",
  budget: "",
  interestedProperty: "",
  ventureName: "",
  assignedExecutive: "",
  remarks: "",
  expectedCloseDate: "",
  timeline: [],
};

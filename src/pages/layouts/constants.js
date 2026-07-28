export const LAYOUT_STATUS = ["Active", "Upcoming", "Completed", "Draft"];

export const APPROVAL_TYPES = ["DTCP Approved", "RERA Approved", "Both", "Pending"];

export const STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
];

export const PLOT_STATUS_META = [
  { key: "available", label: "Available", color: "#059669", tone: "success" },
  { key: "booked", label: "Booked", color: "#d97706", tone: "warning" },
  { key: "reserved", label: "Reserved", color: "#7c3aed", tone: "violet" },
  { key: "sold", label: "Sold", color: "#2563eb", tone: "info" },
];

export const LAYOUT_AMENITY_KEYS = [
  { key: "roads", label: "CC Roads" },
  { key: "parks", label: "Parks" },
  { key: "water", label: "Water Supply" },
  { key: "electricity", label: "Electricity" },
  { key: "drainage", label: "Underground Drainage" },
  { key: "streetLights", label: "Street Lights" },
  { key: "compoundWall", label: "Compound Wall" },
  { key: "avenuePlantation", label: "Avenue Plantation" },
  { key: "clubHouse", label: "Club House" },
  { key: "security", label: "24/7 Security" },
];

export const WIZARD_STEPS = [
  { label: "Basic Info", description: "Name & venture" },
  { label: "Layout Specs", description: "Survey & area" },
  { label: "Plans", description: "Layout documents" },
  { label: "Review", description: "Publish" },
];

export const EMPTY_LAYOUT = {
  name: "",
  code: "",
  ventureId: "",
  ventureName: "",
  surveyNumber: "",
  totalArea: "",
  plotCount: "",
  layoutPlan: null,
  masterPlan: null,
  status: "Draft",
  // Kept empty for backward-compatible merges from old records; not edited in the form.
  description: "",
  state: "",
  district: "",
  city: "",
  village: "",
  mapUrl: "",
  approval: "Pending",
  approvalNumber: "",
  approvalDate: "",
  basePrice: "",
  currentPrice: "",
  registrationCharges: "",
  developmentCharges: "",
  amenities: {
    roads: false,
    parks: false,
    water: false,
    electricity: false,
    drainage: false,
    streetLights: false,
    compoundWall: false,
    avenuePlantation: false,
    clubHouse: false,
    security: false,
  },
  thumbnail: null,
  banner: null,
  brochure: null,
  gallery: [],
};

export function formatPrice(value) {
  const n = Number(value);
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatSqYardPrice(value) {
  const n = Number(value);
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}/sq.yd`;
}

export function formatArea(value) {
  const n = Number(value);
  if (!n) return "—";
  return `${n} acres`;
}

export function formatCr(value) {
  const n = Number(value) || 0;
  return `₹${n.toFixed(1)} Cr`;
}

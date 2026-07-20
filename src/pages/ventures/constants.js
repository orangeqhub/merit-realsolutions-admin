export const PROPERTY_TYPES = [
  "Open Plots",
  "Farm Lands",
  "Villas",
  "Apartments",
  "Commercial",
  "Mixed Use",
];

export const VENTURE_STATUS = ["Active", "Upcoming", "Completed", "Draft"];

export const APPROVAL_TYPES = ["DTCP Approved", "RERA Approved", "Both", "Pending"];

export const STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
];

export const AMENITY_KEYS = [
  { key: "roads", label: "CC Roads" },
  { key: "streetLights", label: "Street Lights" },
  { key: "drainage", label: "Underground Drainage" },
  { key: "electricity", label: "Electricity" },
  { key: "water", label: "Water Supply" },
  { key: "clubHouse", label: "Club House" },
  { key: "security", label: "24/7 Security" },
  { key: "park", label: "Park" },
  { key: "temple", label: "Temple" },
  { key: "childrenPark", label: "Children Park" },
  { key: "joggingTrack", label: "Jogging Track" },
];

export const WIZARD_STEPS = [
  { label: "Basic Info", description: "Name & type" },
  { label: "Location", description: "Address & map" },
  { label: "Legal", description: "Approvals" },
  { label: "Pricing", description: "Rates & charges" },
  { label: "Amenities", description: "Facilities" },
  { label: "Media", description: "Images & plans" },
  { label: "SEO", description: "Web metadata" },
  { label: "Review", description: "Publish" },
];

export const EMPTY_VENTURE = {
  name: "",
  shortName: "",
  code: "",
  propertyType: "",
  developer: "",
  description: "",
  state: "",
  district: "",
  city: "",
  village: "",
  mapUrl: "",
  latitude: "",
  longitude: "",
  landmarks: "",
  dtcp: "",
  rera: "",
  approvalNumber: "",
  approvalDate: "",
  registration: "",
  basePrice: "",
  currentPrice: "",
  pricePerSqYard: "",
  registrationCharges: "",
  developmentCharges: "",
  amenities: {
    roads: false,
    streetLights: false,
    drainage: false,
    electricity: false,
    water: false,
    clubHouse: false,
    security: false,
    park: false,
    temple: false,
    childrenPark: false,
    joggingTrack: false,
  },
  banner: null,
  thumbnail: null,
  logo: null,
  gallery: [],
  layoutPlan: null,
  brochure: null,
  masterPlan: null,
  slug: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  status: "Draft",
  approval: "Pending",
};

export function formatPrice(value) {
  const n = Number(value);
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatPriceRange(min, max) {
  if (!min && !max) return "—";
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function formatSqYardPrice(value) {
  const n = Number(value);
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}/sq.yd`;
}

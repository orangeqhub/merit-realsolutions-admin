/* ===================================================================
   Property Management Module — constants & helpers
   =================================================================== */

export const PROPERTY_STATUS = ["Available", "Booked", "Sold", "Reserved"];

export const PROPERTY_STATUS_META = {
  Available: { label: "Available", tone: "success", color: "#059669" },
  Booked: { label: "Booked", tone: "warning", color: "#d97706" },
  Sold: { label: "Sold", tone: "info", color: "#2563eb" },
  Reserved: { label: "Reserved", tone: "violet", color: "#7c3aed" },
};

export const FACINGS = [
  "East", "West", "North", "South",
  "North-East", "North-West", "South-East", "South-West",
];

export const FURNISHING_OPTIONS = [
  "Unfurnished", "Semi-Furnished", "Fully-Furnished",
];

export const AREA_UNITS = ["Sq.Ft", "Sq.Yds", "Acres", "Sq.M"];

export const STATES = [
  "Telangana", "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra",
];

export const WIZARD_STEPS = [
  { label: "Basic Info", description: "Name, type & status" },
  { label: "Location", description: "Address & maps" },
  { label: "Specifications", description: "Type-specific details" },
  { label: "Amenities", description: "Features & facilities" },
  { label: "Pricing", description: "Price & charges" },
  { label: "Images", description: "Gallery upload" },
  { label: "Documents", description: "Property documents" },
  { label: "Assignment", description: "Sales representatives" },
  { label: "Review", description: "Confirm & save" },
];

export const PROPERTY_LISTED_BY = [
  { value: "BUILDER_DEVELOPER", label: "Builder / Developer" },
  { value: "INDIVIDUAL_OWNER", label: "Individual Owner" },
  { value: "COMPANY", label: "Company" },
  { value: "BANK", label: "Bank" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "AGENCY_BROKER", label: "Agency / Broker" },
  { value: "OTHER", label: "Other" },
];

export const BUILDER_DEVELOPER_LISTED_BY = "BUILDER_DEVELOPER";

export const LISTED_BY_DETAIL_FIELDS = {
  INDIVIDUAL_OWNER: { label: "Owner Name", placeholder: "Enter owner name" },
  COMPANY: { label: "Company Name", placeholder: "Enter company name" },
  BANK: { label: "Bank Name", placeholder: "Enter bank name" },
  GOVERNMENT: { label: "Department / Authority Name", placeholder: "Enter department or authority name" },
  AGENCY_BROKER: { label: "Agency / Broker Name", placeholder: "Enter agency or broker name" },
  OTHER: { label: "Other Details", placeholder: "Enter other listing details" },
};

export function getListedByLabel(value) {
  return PROPERTY_LISTED_BY.find((item) => item.value === value)?.label || value || "—";
}

export function getListedByDetail(property = {}, builders = []) {
  if (property.listedByDetail) return property.listedByDetail;
  if (property.propertyListedBy === BUILDER_DEVELOPER_LISTED_BY) {
    return property.builder?.builderName
      || builders.find((b) => String(b.id) === String(property.builderId))?.builderName
      || null;
  }
  return property.listedByName?.trim() || null;
}

export function formatListedBySummary(form = {}, builders = []) {
  const label = getListedByLabel(form.propertyListedBy);
  const detail = getListedByDetail(form, builders);
  if (detail) return `${label} · ${detail}`;
  return label;
}

export function formatListedByListValue(property = {}, builders = []) {
  if (property.listedByListValue) return property.listedByListValue;
  const detail = getListedByDetail(property, builders);
  if (detail) return detail;
  return getListedByLabel(property.propertyListedBy);
}

export const EMPTY_PROPERTY = {
  name: "",
  code: "",
  propertyTypeId: "",
  propertyCategory: "",
  propertyListedBy: "INDIVIDUAL_OWNER",
  status: "Available",
  city: "",
  district: "",
  state: "Telangana",
  locality: "",
  address: "",
  pincode: "",
  area: "",
  facing: "",
  furnishing: "",
  pricePerSqFt: "",
  bedrooms: "",
  bathrooms: "",
  unit: "Sq.Ft",
  negotiable: false,
  registrationCharges: "",
  maintenanceCharges: "",
  specificationValues: {},
  amenityIds: [],
  builderId: "",
  listedByName: "",
  assigneeUserId: "",
  finalPrice: "",
  thumbnail: "",
  banner: "",
  gallery: [],
  documents: [],
  location: {
    mapUrl: "",
    latitude: "",
    longitude: "",
  },
  shortDescription: "",
  description: "",
};

export { formatINR, formatDate, formatFull } from "../../utils/format";

export function getStatusTone(status) {
  return PROPERTY_STATUS_META[status]?.tone || "neutral";
}

export function formatArea(area, unit = "Sq.Ft") {
  const n = Number(area);
  if (!n) return "—";
  return `${n.toLocaleString("en-IN")} ${unit}`;
}

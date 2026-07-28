/* ===================================================================
   Plot Inventory Module — constants & helpers
   =================================================================== */

/**
 * Plot status metadata — single source of truth for badge color, icon tone,
 * tooltip copy and which transitions are allowed from each state.
 * Booking-related transitions (reserve/book/release) are surfaced here only as
 * entry points; the actual booking workflow is implemented in the next module.
 */
export const PLOT_STATUS_META = {
  Available: {
    label: "Available",
    tone: "success",
    color: "#059669",
    icon: "check",
    tooltip: "Open for reservation or booking",
  },
  Reserved: {
    label: "Reserved",
    tone: "violet",
    color: "#7c3aed",
    icon: "bookmark",
    tooltip: "Temporarily held for a customer",
  },
  Booked: {
    label: "Booked",
    tone: "warning",
    color: "#d97706",
    icon: "clock",
    tooltip: "Booked, pending registration",
  },
  Sold: {
    label: "Sold",
    tone: "info",
    color: "#2563eb",
    icon: "tag",
    tooltip: "Sold and registered",
  },
  Blocked: {
    label: "Blocked",
    tone: "danger",
    color: "#dc2626",
    icon: "lock",
    tooltip: "Blocked — not available for sale",
  },
  Cancelled: {
    label: "Cancelled",
    tone: "neutral",
    color: "#5a6474",
    icon: "x",
    tooltip: "Booking cancelled",
  },
};

export const PLOT_STATUSES = Object.keys(PLOT_STATUS_META);

export const FACINGS = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

export const ROAD_WIDTHS = ["30 ft", "33 ft", "40 ft", "60 ft", "100 ft"];

export const AREA_RANGES = [
  { value: "", label: "Any Area" },
  { value: "0-150", label: "Up to 150 sq.yd" },
  { value: "150-250", label: "150 – 250 sq.yd" },
  { value: "250-400", label: "250 – 400 sq.yd" },
  { value: "400-100000", label: "400+ sq.yd" },
];

export const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-2500000", label: "Up to ₹25 L" },
  { value: "2500000-5000000", label: "₹25 L – ₹50 L" },
  { value: "5000000-10000000", label: "₹50 L – ₹1 Cr" },
  { value: "10000000-1000000000", label: "₹1 Cr+" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Sort: Newest" },
  { value: "oldest", label: "Sort: Oldest" },
  { value: "priceLow", label: "Sort: Price Low → High" },
  { value: "priceHigh", label: "Sort: Price High → Low" },
  { value: "areaLow", label: "Sort: Area Low → High" },
  { value: "areaHigh", label: "Sort: Area High → Low" },
];

export const WIZARD_STEPS = [
  { label: "Property", description: "Plot & parent" },
  { label: "Dimensions", description: "Size & facing" },
  { label: "Pricing", description: "Rate & charges" },
  { label: "Status", description: "Assignment" },
];

export const EMPTY_PLOT = {
  plotNumber: "",
  block: "",
  ventureId: "",
  ventureName: "",
  layoutId: "",
  layoutName: "",
  facing: "",
  corner: false,
  dimensions: "",
  areaSqYards: "",
  roadWidth: "",
  ratePerSqYard: "",
  developmentCharges: "",
  registrationCharges: "",
  discountPct: "",
  status: "Available",
  customer: "",
  agent: "",
  executive: "",
  crmOwner: "",
  reservationExpiry: "",
  notes: "",
};

export function formatINR(value) {
  const n = Number(value);
  if (!n) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatFull(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatRate(value) {
  const n = Number(value);
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}/sq.yd`;
}

export function areaFromDimensions(dimensions) {
  const match = String(dimensions || "").match(/(\d+(?:\.\d+)?)\s*[x×\*]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return "";
  const widthFt = Number(match[1]);
  const depthFt = Number(match[2]);
  if (!widthFt || !depthFt) return "";
  return String(Math.round((widthFt * depthFt) / 9));
}

/** Derive pricing breakdown from a plot record (immutable, render-safe). */
export function derivePricing(plot) {
  const area = Number(plot.areaSqYards) || 0;
  const rate = Number(plot.ratePerSqYard) || 0;
  const totalPrice = plot.totalPrice ?? area * rate;
  const developmentCharges = Number(plot.developmentCharges) || 0;
  const registrationCharges = Number(plot.registrationCharges) || 0;
  const discountPct = Number(plot.discountPct) || 0;
  const discount = plot.discount ?? Math.round(totalPrice * (discountPct / 100));
  const offerPrice = plot.offerPrice ?? totalPrice - discount;
  const finalPrice =
    plot.finalPrice ?? offerPrice + developmentCharges + registrationCharges;
  return {
    area,
    rate,
    totalPrice,
    developmentCharges,
    registrationCharges,
    discountPct,
    discount,
    offerPrice,
    finalPrice,
  };
}

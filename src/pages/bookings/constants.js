/* Bookings module — constants & helpers */
export { formatINR, formatFull, formatDate } from "../../utils/format";

export const BOOKING_STATUS_META = {
  Active: { label: "Active", tone: "info" },
  Completed: { label: "Completed", tone: "success" },
  Cancelled: { label: "Cancelled", tone: "danger" },
};

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_META);

export const AGREEMENT_STATUS_META = {
  Pending: { label: "Pending", tone: "warning" },
  Signed: { label: "Signed", tone: "success" },
  "Not Required": { label: "Not Required", tone: "neutral" },
};

export const AGREEMENT_STATUSES = Object.keys(AGREEMENT_STATUS_META);

export const EMPTY_BOOKING = {
  customerId: "",
  customerName: "",
  propertyId: "",
  propertyName: "",
  plotId: "",
  plotNumber: "",
  ventureName: "",
  layoutName: "",
  bookingAmount: "",
  advancePaid: "",
  agreementStatus: "Pending",
  status: "Active",
  bookingDate: new Date().toISOString().split("T")[0],
  agreementDate: "",
};

export function bookingNumberFromIndex(count) {
  const year = new Date().getFullYear();
  return `BK-${year}-${String(count + 1).padStart(4, "0")}`;
}

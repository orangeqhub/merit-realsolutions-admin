export { formatINR, formatFull, formatDate } from "../../utils/format";

export const CUSTOMER_STATUSES = ["Active", "Inactive"];

export const KYC_STATUSES = ["Verified", "Pending", "Rejected"];

export const CUSTOMER_SOURCES = [
  "Walk-in",
  "Website",
  "Referral",
  "Agent",
  "Social Media",
];

export const KYC_STATUS_META = {
  Verified: { tone: "success" },
  Pending: { tone: "warning" },
  Rejected: { tone: "danger" },
};

export const EMPTY_CUSTOMER = {
  name: "",
  email: "",
  phone: "",
  alternatePhone: "",
  status: "Active",
  kycStatus: "Pending",
  address: "",
  city: "",
  state: "Telangana",
  pan: "",
  aadhar: "",
  occupation: "",
  source: "",
  assignedAgent: "",
  purchasedProperties: [],
  bookingIds: [],
  totalPaid: 0,
  outstanding: 0,
  documents: [],
  timeline: [],
  communications: [],
  activities: [],
};

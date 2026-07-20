/* ===================================================================
   Agreements Module — constants & helpers
   =================================================================== */

export { formatINR, formatDate } from "../../../utils/format";

export const AGREEMENT_STATUSES = ["Draft", "Signed", "Registered", "Cancelled"];

export const AGREEMENT_STATUS_META = {
  Draft: { label: "Draft", tone: "neutral" },
  Signed: { label: "Signed", tone: "info" },
  Registered: { label: "Registered", tone: "success" },
  Cancelled: { label: "Cancelled", tone: "danger" },
};

export const EMPTY_AGREEMENT = {
  bookingId: "",
  status: "Draft",
  signedDate: "",
  notes: "",
};

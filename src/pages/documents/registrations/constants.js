/* ===================================================================
   Registrations Module — constants & helpers
   =================================================================== */

export { formatINR, formatDate } from "../../../utils/format";

export const REGISTRATION_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Rejected",
];

export const REGISTRATION_STATUS_META = {
  Pending: { label: "Pending", tone: "warning" },
  "In Progress": { label: "In Progress", tone: "info" },
  Completed: { label: "Completed", tone: "success" },
  Rejected: { label: "Rejected", tone: "danger" },
};

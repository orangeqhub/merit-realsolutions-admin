/** Reservation lifecycle statuses — single source of truth for domain transitions. */

export const RESERVATION_STATUSES = [
  "Reserved",
  "Confirmed",
  "Registered",
  "Completed",
  "Cancelled",
  "Released",
];

export const INVENTORY_AVAILABLE = "Available";

export const STATUS_META = {
  Available: { label: "Available", tone: "success", order: 0 },
  Reserved: { label: "Reserved", tone: "violet", order: 1 },
  Confirmed: { label: "Confirmed", tone: "success", order: 2 },
  Registered: { label: "Registered", tone: "accent", order: 3 },
  Completed: { label: "Completed", tone: "success", order: 4 },
  Cancelled: { label: "Cancelled", tone: "danger", order: 5 },
  Released: { label: "Released", tone: "muted", order: 6 },
};

export const ALLOWED_TRANSITIONS = {
  Reserved: ["Confirmed", "Cancelled", "Released"],
  Confirmed: ["Registered", "Cancelled"],
  Registered: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
  Released: [],
};

export function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function isActiveReservation(status) {
  return ["Reserved", "Confirmed", "Registered"].includes(status);
}

export function isExpirable(status) {
  return status === "Reserved";
}

export function ignoresExpiry(status) {
  return ["Confirmed", "Registered", "Completed"].includes(status);
}

export function locksInventory(status) {
  return isActiveReservation(status);
}

export function getStatusMeta(status) {
  return STATUS_META[status] || { label: status, tone: "muted", order: 99 };
}

export function getStatusTone(status) {
  return getStatusMeta(status).tone;
}

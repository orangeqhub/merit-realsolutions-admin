export { formatINR, formatFull, formatDate } from "../../utils/format";

export const FOLLOWUP_TYPES = ["Call", "Meeting", "Site Visit", "Reminder"];

export const FOLLOWUP_STATUSES = ["Today", "Upcoming", "Overdue", "Completed"];

export const FOLLOWUP_STATUS_META = {
  Today: { tone: "warning" },
  Upcoming: { tone: "info" },
  Overdue: { tone: "danger" },
  Completed: { tone: "success" },
};

export const FOLLOWUP_PRIORITIES = ["High", "Medium", "Low"];

export const PRIORITY_META = {
  High: { tone: "danger" },
  Medium: { tone: "warning" },
  Low: { tone: "neutral" },
};

export const EMPTY_FOLLOWUP = {
  leadId: "",
  leadName: "",
  customerId: "",
  customerName: "",
  type: "Call",
  status: "Upcoming",
  priority: "Medium",
  scheduledDate: new Date().toISOString().split("T")[0],
  scheduledTime: "10:00",
  notes: "",
  assignedTo: "",
};

export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isOverdue(item) {
  if (item.status === "Completed") return false;
  const d = new Date(item.scheduledDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now && !isToday(item.scheduledDate);
}

export function resolveStatus(item) {
  if (item.status === "Completed") return "Completed";
  if (isToday(item.scheduledDate)) return "Today";
  if (isOverdue(item)) return "Overdue";
  return item.status === "Overdue" ? "Overdue" : "Upcoming";
}

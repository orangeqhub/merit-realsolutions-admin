/* Payments module — constants & helpers */
export { formatINR, formatFull, formatDate } from "../../utils/format";

export const PAYMENT_STATUS_META = {
  Completed: { label: "Completed", tone: "success" },
  Pending: { label: "Pending", tone: "warning" },
  Failed: { label: "Failed", tone: "danger" },
  Overdue: { label: "Overdue", tone: "danger" },
};

export const PAYMENT_STATUSES = ["Completed", "Pending", "Failed", "Overdue"];

export const PAYMENT_TYPES = ["Advance", "Installment", "Final", "Registration"];

export const PAYMENT_METHODS = ["Cash", "UPI", "Cheque", "NEFT", "RTGS", "Card"];

export const EMPTY_PAYMENT = {
  bookingId: "",
  bookingNumber: "",
  customerId: "",
  customerName: "",
  amount: "",
  method: "UPI",
  type: "Installment",
  status: "Completed",
  installmentNo: "",
  totalInstallments: "12",
  dueDate: "",
  paidDate: new Date().toISOString().split("T")[0],
  remarks: "",
};

export function receiptNumberFromIndex(count) {
  const year = new Date().getFullYear();
  return `RCP-${year}-${String(count + 1).padStart(4, "0")}`;
}

export function isOverdue(payment) {
  if (payment.status !== "Pending") return false;
  if (!payment.dueDate) return false;
  return new Date(payment.dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

export function resolvePaymentStatus(payment) {
  if (isOverdue(payment)) return "Overdue";
  return payment.status;
}

export function getPaymentDate(payment) {
  return payment?.paymentDate || payment?.paidDate || "";
}

export function getPaymentNotes(payment) {
  return payment?.notes || payment?.remarks || "";
}

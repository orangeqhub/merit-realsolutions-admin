/* Receipts module — constants & helpers */
export { formatINR, formatFull, formatDate } from "../../utils/format";

export const RECEIPT_STATUS_META = {
  Issued: { label: "Issued", tone: "success" },
  Void: { label: "Void", tone: "danger" },
  Draft: { label: "Draft", tone: "neutral" },
};

export const RECEIPT_STATUSES = Object.keys(RECEIPT_STATUS_META);

export function getReceiptMethod(receipt) {
  return receipt?.method || receipt?.paymentMethod || "—";
}

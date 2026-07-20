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

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

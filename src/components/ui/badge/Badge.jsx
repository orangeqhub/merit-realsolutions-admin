import "./Badge.css";

const TONE_BY_STATUS = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
  suspended: "danger",
  draft: "neutral",
  approved: "success",
  rejected: "danger",
  completed: "success",
  "in progress": "info",
  upcoming: "info",
  available: "success",
  booked: "warning",
  sold: "danger",
  reserved: "violet",
  cancelled: "danger",
  ongoing: "info",
  published: "success",
};

export default function Badge({
  children,
  status,
  tone,
  label,
  dot = false,
  size = "md",
  className = "",
}) {
  const resolvedTone =
    tone || TONE_BY_STATUS[String(status).toLowerCase()] || "neutral";
  const content = children ?? label ?? status;

  return (
    <span
      className={`erp-badge erp-badge--${resolvedTone} erp-badge--${size} ${className}`.trim()}
    >
      {dot && <span className="erp-badge__dot" />}
      {content}
    </span>
  );
}

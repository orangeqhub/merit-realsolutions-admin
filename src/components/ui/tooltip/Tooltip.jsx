import "./Tooltip.css";

export default function Tooltip({
  content,
  position = "top",
  children,
  className = "",
}) {
  if (!content) return children;
  return (
    <span className={`erp-tooltip erp-tooltip--${position} ${className}`.trim()}>
      {children}
      <span className="erp-tooltip__bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}

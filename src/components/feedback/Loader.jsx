import "./Loader.css";

export default function Loader({
  size = "md",
  label,
  fullscreen = false,
  className = "",
}) {
  const spinner = (
    <div className={`erp-loader ${className}`.trim()}>
      <span className={`erp-loader__spinner erp-loader__spinner--${size}`} />
      {label && <span className="erp-loader__label">{label}</span>}
    </div>
  );

  if (fullscreen) {
    return <div className="erp-loader__overlay">{spinner}</div>;
  }
  return spinner;
}

import "./SectionHeader.css";

export default function SectionHeader({
  title,
  description,
  icon,
  action,
  className = "",
}) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div className="section-header__text">
        <h2 className="section-header__title">
          {icon && <span className="section-header__icon">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="section-header__description">{description}</p>
        )}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
}

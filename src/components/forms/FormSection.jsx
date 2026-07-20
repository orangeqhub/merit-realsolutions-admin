import "./FormSection.css";

export default function FormSection({
  title,
  description,
  icon,
  columns = 1,
  children,
  className = "",
}) {
  return (
    <section className={`form-section ${className}`.trim()}>
      {(title || description) && (
        <header className="form-section__header">
          {icon && <span className="form-section__icon">{icon}</span>}
          <div>
            {title && <h3 className="form-section__title">{title}</h3>}
            {description && (
              <p className="form-section__description">{description}</p>
            )}
          </div>
        </header>
      )}
      <div className={`form-section__grid form-section__grid--${columns}`}>
        {children}
      </div>
    </section>
  );
}

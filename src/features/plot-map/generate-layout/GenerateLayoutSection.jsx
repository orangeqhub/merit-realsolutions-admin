const TONE_CLASS = {
  layout: 'ui3-gen-section--layout',
  plot: 'ui3-gen-section--plot',
  road: 'ui3-gen-section--road',
  amenities: 'ui3-gen-section--amenities',
};

export default function GenerateLayoutSection({
  icon: Icon,
  title,
  description,
  tone = 'layout',
  compact = false,
  children,
}) {
  return (
    <section
      className={`ui3-gen-section ui3-gen-section--${tone} ${TONE_CLASS[tone] || ''}${
        compact ? ' ui3-gen-section--compact' : ''
      }`.trim()}
    >
      <header className="ui3-gen-section__header">
        {Icon ? (
          <span className="ui3-gen-section__icon" aria-hidden>
            <Icon />
          </span>
        ) : null}
        <div>
          <h3 className="ui3-gen-section__title">{title}</h3>
          {description && !compact ? (
            <p className="ui3-gen-section__desc">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="ui3-gen-section__body">{children}</div>
    </section>
  );
}

import "./ActivityCard.css";

export default function ActivityCard({
  icon,
  avatar,
  title,
  description,
  time,
  tone = "accent",
  className = "",
}) {
  return (
    <div className={`activity-card ${className}`.trim()}>
      {avatar ? (
        <span className="activity-card__avatar">{avatar}</span>
      ) : (
        <span className={`activity-card__icon activity-card__icon--${tone}`}>
          {icon}
        </span>
      )}
      <div className="activity-card__body">
        <p className="activity-card__title">{title}</p>
        {description && (
          <p className="activity-card__description">{description}</p>
        )}
      </div>
      {time && <span className="activity-card__time">{time}</span>}
    </div>
  );
}

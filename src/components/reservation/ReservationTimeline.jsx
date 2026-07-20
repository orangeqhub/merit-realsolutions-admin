import { formatDate } from "../../utils/format";

const DOT_MAP = {
  created: "violet",
  reminder: "warning",
  extended: "warning",
  confirmed: "success",
  registered: "accent",
  completed: "success",
  cancelled: "danger",
  released: "muted",
};

export default function ReservationTimeline({ events = [], compact = false }) {
  if (!events.length) {
    return <p className="rsv-empty-hint">No timeline events recorded yet.</p>;
  }

  return (
    <div className={`rsv-timeline ${compact ? "rsv-timeline--compact" : ""}`.trim()}>
      {events.map((event, index) => {
        const dotTone = DOT_MAP[event.type] || event.tone || "accent";
        return (
          <div key={`${event.date}-${event.title}-${index}`} className="rsv-timeline__item">
            <span className={`rsv-timeline__dot rsv-timeline__dot--${dotTone}`} />
            <div className="rsv-timeline__title">{event.title}</div>
            <div className="rsv-timeline__desc">{event.description}</div>
            <div className="rsv-timeline__meta">
              {formatDate(event.date)}
              {event.time ? ` · ${event.time}` : ""}
              {event.actor ? ` · ${event.actor}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { FiClock } from "react-icons/fi";
import Timeline from "../timeline/Timeline";
import EmptyState from "../layout/EmptyState";

export default function LayoutTimeline({ activities = [] }) {
  if (!activities.length) {
    return (
      <EmptyState
        icon={<FiClock />}
        title="No activity yet"
        description="Layout activity will appear here as changes are made."
        compact
      />
    );
  }
  const items = activities.map((a, i) => ({
    id: i,
    title: a.title,
    description: a.description,
    time: a.date,
    tone: a.tone || "accent",
  }));
  return <Timeline items={items} />;
}

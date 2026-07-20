import { FiClock } from "react-icons/fi";
import Timeline from "../timeline/Timeline";
import EmptyState from "../layout/EmptyState";

export default function PlotHistory({ history = [] }) {
  if (!history.length) {
    return (
      <EmptyState
        icon={<FiClock />}
        title="No history yet"
        description="Status changes and updates will appear here."
        compact
      />
    );
  }
  const items = history.map((h, i) => ({
    id: i,
    title: h.title,
    description: h.description,
    time: h.date,
    tone: h.tone || "accent",
  }));
  return <Timeline items={items} />;
}

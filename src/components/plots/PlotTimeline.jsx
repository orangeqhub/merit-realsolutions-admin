import { FiPlusCircle, FiBookmark, FiClock, FiCheckCircle } from "react-icons/fi";
import "./PlotTimeline.css";

const STAGES = [
  { key: "created", label: "Created", icon: <FiPlusCircle />, types: ["created"] },
  { key: "reserved", label: "Reserved", icon: <FiBookmark />, types: ["reserved"] },
  { key: "booked", label: "Booked", icon: <FiClock />, types: ["booked"] },
  { key: "sold", label: "Sold", icon: <FiCheckCircle />, types: ["sold"] },
];

const STATUS_INDEX = { Available: 0, Reserved: 1, Booked: 2, Sold: 3 };

export default function PlotTimeline({ plot }) {
  const history = plot.history || [];
  const currentIndex = STATUS_INDEX[plot.status] ?? 0;

  const dateFor = (types) => {
    const evt = history.find((h) => types.includes(h.type));
    return evt?.date;
  };

  return (
    <ol className="plot-timeline">
      {STAGES.map((stage, i) => {
        const date = stage.key === "created" ? plot.createdDate : dateFor(stage.types);
        const reached = i <= currentIndex && (date || i === 0);
        const isCurrent = i === currentIndex;
        const state = isCurrent ? "current" : reached ? "done" : "pending";
        return (
          <li key={stage.key} className={`plot-timeline__stage plot-timeline__stage--${state}`}>
            <span className="plot-timeline__marker">{stage.icon}</span>
            <div className="plot-timeline__content">
              <span className="plot-timeline__label">{stage.label}</span>
              <span className="plot-timeline__date">{date || (reached ? "—" : "Pending")}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

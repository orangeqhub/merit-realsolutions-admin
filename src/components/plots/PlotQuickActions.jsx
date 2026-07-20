import {
  FiBookmark,
  FiCheckSquare,
  FiCheckCircle,
  FiRotateCcw,
  FiLock,
  FiUserCheck,
  FiClock,
  FiMap,
  FiEdit2,
} from "react-icons/fi";
import QuickActions from "../layout/QuickActions";

/**
 * Status-aware quick actions. These are *entry points* only — the parent wires
 * onAction to the inventory status transitions today and to the dedicated Plot
 * Booking workflow in the next module, without changing this component.
 */
function actionsForStatus(status) {
  const reserve = { id: "reserve", icon: <FiBookmark />, label: "Reserve", tone: "violet" };
  const book = { id: "book", icon: <FiCheckSquare />, label: "Book", tone: "warning" };
  const sell = { id: "sell", icon: <FiCheckCircle />, label: "Mark as Sold", tone: "success" };
  const release = { id: "release", icon: <FiRotateCcw />, label: "Release", tone: "accent" };
  const block = { id: "block", icon: <FiLock />, label: "Block", tone: "danger" };
  const assign = { id: "assign", icon: <FiUserCheck />, label: "Assign", tone: "violet" };
  const edit = { id: "edit", icon: <FiEdit2 />, label: "Edit Plot", tone: "primary" };
  const plan = { id: "plan", icon: <FiMap />, label: "Layout Plan", tone: "info" };
  const history = { id: "history", icon: <FiClock />, label: "View History", tone: "info" };

  switch (status) {
    case "Available":
      return [reserve, book, assign, block, edit, plan];
    case "Reserved":
      return [book, assign, release, block, history, plan];
    case "Booked":
      return [sell, assign, release, history, edit, plan];
    case "Sold":
      return [history, plan, edit];
    case "Blocked":
      return [release, history, edit];
    case "Cancelled":
      return [release, history, edit];
    default:
      return [edit, plan, history];
  }
}

export default function PlotQuickActions({ plot, onAction, className = "" }) {
  return (
    <QuickActions
      className={className}
      title="Plot Actions"
      actions={actionsForStatus(plot.status)}
      onAction={onAction}
    />
  );
}

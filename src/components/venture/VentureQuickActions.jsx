import {
  FiLayers,
  FiGrid,
  FiUserPlus,
  FiUpload,
  FiBarChart2,
} from "react-icons/fi";
import QuickActions from "../layout/QuickActions";

const DEFAULT_ACTIONS = [
  { id: "add-layout", icon: <FiLayers />, label: "Add Layout", tone: "accent" },
  { id: "import-plots", icon: <FiGrid />, label: "Import Plots", tone: "success" },
  { id: "book-plot", icon: <FiUserPlus />, label: "Book Plot", tone: "warning" },
  { id: "assign-agent", icon: <FiUserPlus />, label: "Assign Agent", tone: "info" },
  { id: "upload-docs", icon: <FiUpload />, label: "Upload Documents", tone: "violet" },
  { id: "report", icon: <FiBarChart2 />, label: "Generate Report", tone: "primary" },
];

export default function VentureQuickActions({
  className = "",
  title = "Quick Actions",
  actions = DEFAULT_ACTIONS,
  onAction,
}) {
  return (
    <QuickActions className={className} title={title} actions={actions} onAction={onAction} />
  );
}

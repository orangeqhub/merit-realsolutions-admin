import {
  FiGrid,
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiUserPlus,
  FiBarChart2,
} from "react-icons/fi";
import QuickActions from "../layout/QuickActions";

const DEFAULT_ACTIONS = [
  { id: "open-plots", icon: <FiGrid />, label: "Open Plot Inventory", tone: "accent" },
  { id: "import-plots", icon: <FiUploadCloud />, label: "Import Plots", tone: "success" },
  { id: "export", icon: <FiDownload />, label: "Export Layout", tone: "info" },
  { id: "upload-docs", icon: <FiFileText />, label: "Upload Documents", tone: "violet" },
  { id: "assign-agents", icon: <FiUserPlus />, label: "Assign Agents", tone: "warning" },
  { id: "report", icon: <FiBarChart2 />, label: "Generate Report", tone: "primary" },
];

export default function LayoutQuickActions({
  className = "",
  actions = DEFAULT_ACTIONS,
  onAction,
}) {
  return (
    <QuickActions className={className} title="Quick Actions" actions={actions} onAction={onAction} />
  );
}

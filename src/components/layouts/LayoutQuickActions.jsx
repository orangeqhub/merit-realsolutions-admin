import {
  FiBarChart2,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiGrid,
  FiMap,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import QuickActions from "../layout/QuickActions";
import { LAYOUT_LABELS } from "../../pages/layouts/layoutTerminology";

export const LAYOUT_QUICK_ACTIONS = [
  { id: "open-workspace", icon: <FiMap />, label: LAYOUT_LABELS.openWorkspace, tone: "accent" },
  { id: "import-gis", icon: <FiUploadCloud />, label: LAYOUT_LABELS.importGisWorkbook, tone: "success" },
  { id: "generate-township", icon: <FiGrid />, label: LAYOUT_LABELS.generateTownship, tone: "primary" },
  { id: "manage-plots", icon: <FiGrid />, label: LAYOUT_LABELS.managePlots, tone: "info" },
  { id: "export-gis", icon: <FiDownload />, label: LAYOUT_LABELS.exportGisWorkbook, tone: "violet" },
  { id: "documents", icon: <FiFileText />, label: LAYOUT_LABELS.documents, tone: "warning" },
  { id: "analytics", icon: <FiBarChart2 />, label: LAYOUT_LABELS.analytics, tone: "primary" },
];

export default function LayoutQuickActions({
  className = "",
  actions = LAYOUT_QUICK_ACTIONS,
  onAction,
}) {
  return (
    <QuickActions
      className={className}
      title="Quick Actions"
      actions={actions}
      onAction={onAction}
    />
  );
}

import {
  FiCheckCircle,
  FiBookmark,
  FiClock,
  FiTag,
  FiLock,
  FiXCircle,
} from "react-icons/fi";
import Badge from "../ui/badge/Badge";
import Tooltip from "../ui/tooltip/Tooltip";
import { PLOT_STATUS_META } from "../../pages/plotInventory/constants";

const ICONS = {
  check: <FiCheckCircle />,
  bookmark: <FiBookmark />,
  clock: <FiClock />,
  tag: <FiTag />,
  lock: <FiLock />,
  x: <FiXCircle />,
};

export default function PlotStatusBadge({ status, size = "md", withTooltip = true }) {
  const meta = PLOT_STATUS_META[status] || PLOT_STATUS_META.Available;
  const badge = (
    <Badge tone={meta.tone} size={size}>
      <span className="erp-badge__lead-icon">{ICONS[meta.icon]}</span>
      {meta.label}
    </Badge>
  );

  if (!withTooltip) return badge;
  return (
    <Tooltip content={meta.tooltip} position="top">
      {badge}
    </Tooltip>
  );
}

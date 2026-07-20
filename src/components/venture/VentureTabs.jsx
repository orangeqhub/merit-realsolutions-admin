import Tabs from "../navigation/Tabs";
import {
  FiHome,
  FiLayers,
  FiGrid,
  FiDollarSign,
  FiHeart,
  FiImage,
  FiFileText,
  FiClock,
  FiBarChart2,
} from "react-icons/fi";

const VENTURE_TABS = [
  { id: "overview", label: "Overview", icon: <FiHome /> },
  { id: "layouts", label: "Layouts", icon: <FiLayers /> },
  { id: "plots", label: "Plots", icon: <FiGrid /> },
  { id: "pricing", label: "Pricing", icon: <FiDollarSign /> },
  { id: "amenities", label: "Amenities", icon: <FiHeart /> },
  { id: "gallery", label: "Gallery", icon: <FiImage /> },
  { id: "documents", label: "Documents", icon: <FiFileText /> },
  { id: "timeline", label: "Timeline", icon: <FiClock /> },
  { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
];

export default function VentureTabs({ active, onChange, className = "" }) {
  return (
    <Tabs
      tabs={VENTURE_TABS}
      active={active}
      onChange={onChange}
      layoutId="venture-tabs"
      className={className}
    />
  );
}

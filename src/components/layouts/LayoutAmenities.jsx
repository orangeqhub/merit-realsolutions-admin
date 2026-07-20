import {
  FiMap,
  FiHeart,
  FiDroplet,
  FiZap,
  FiSun,
  FiShield,
  FiHome,
  FiFeather,
  FiGrid,
  FiCheck,
} from "react-icons/fi";
import EmptyState from "../layout/EmptyState";
import { LAYOUT_AMENITY_KEYS } from "../../pages/layouts/constants";
import "./LayoutSections.css";

const ICONS = {
  roads: <FiMap />,
  parks: <FiHeart />,
  water: <FiDroplet />,
  electricity: <FiZap />,
  drainage: <FiDroplet />,
  streetLights: <FiSun />,
  compoundWall: <FiGrid />,
  avenuePlantation: <FiFeather />,
  clubHouse: <FiHome />,
  security: <FiShield />,
};

export default function LayoutAmenities({ amenities = {} }) {
  const active = LAYOUT_AMENITY_KEYS.filter((a) => amenities[a.key]);
  if (!active.length) {
    return (
      <EmptyState
        icon={<FiCheck />}
        title="No amenities listed"
        description="Add amenities to highlight this layout's facilities."
        compact
      />
    );
  }
  return (
    <div className="layout-amenities">
      {active.map((a) => (
        <div key={a.key} className="layout-amenities__item">
          <span className="layout-amenities__icon">{ICONS[a.key] || <FiCheck />}</span>
          <span>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

import { FiMapPin, FiEdit2, FiShare2, FiFileText } from "react-icons/fi";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import "./VentureHeader.css";

export default function VentureHeader({ venture, onEdit, onShare, onDocuments }) {
  const location = [venture.city, venture.district, venture.state].filter(Boolean).join(", ");

  return (
    <section className="venture-header">
      <div className="venture-header__banner">
        <img src={venture.banner} alt={venture.name} />
        <div className="venture-header__overlay" />
      </div>

      <div className="venture-header__content">
        <div className="venture-header__profile">
          <img className="venture-header__logo" src={venture.logo} alt={venture.name} />
          <div className="venture-header__text">
            <div className="venture-header__badges">
              <Badge status={venture.status} dot />
              <span className="venture-header__type">{venture.propertyType}</span>
            </div>
            <h1 className="venture-header__title">{venture.name}</h1>
            <p className="venture-header__meta">
              <FiMapPin /> {location}
              <span>·</span>
              {venture.developer}
            </p>
          </div>
        </div>

        <div className="venture-header__actions">
          <Button variant="ghost" size="md" onClick={onEdit}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="ghost" size="md" onClick={onShare}>
            <FiShare2 /> Share
          </Button>
          <Button variant="accent" size="md" onClick={onDocuments}>
            <FiFileText /> Documents
          </Button>
        </div>
      </div>
    </section>
  );
}

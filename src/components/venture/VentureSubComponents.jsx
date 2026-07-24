import {
  FiFileText,
  FiDownload,
  FiMapPin,
  FiMap,
  FiSun,
  FiDroplet,
  FiZap,
  FiShield,
  FiHome,
  FiHeart,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import ImageGrid from "../gallery/ImageGrid";
import { filterDisplayableGalleryImages } from "../../utils/media";
import Timeline from "../timeline/Timeline";
import { AMENITY_KEYS } from "../../pages/ventures/constants";
import { formatPrice, formatSqYardPrice } from "../../pages/ventures/constants";
import "./VentureSubComponents.css";

const AMENITY_ICONS = {
  roads: <FiMap />,
  streetLights: <FiSun />,
  drainage: <FiDroplet />,
  electricity: <FiZap />,
  water: <FiDroplet />,
  clubHouse: <FiHome />,
  security: <FiShield />,
  park: <FiHeart />,
  temple: <FiHome />,
  childrenPark: <FiUsers />,
  joggingTrack: <FiActivity />,
};

export function VentureGallery({ images = [] }) {
  const displayImages = filterDisplayableGalleryImages(images);

  if (!displayImages.length) {
    return (
      <p className="venture-sub__empty">
        No gallery images available. Edit the venture and upload photos to display them here.
      </p>
    );
  }

  return <ImageGrid images={displayImages} columns={3} masonry enableLightbox />;
}

export function VentureTimeline({ activities = [] }) {
  const items = activities.map((a, i) => ({
    id: i,
    title: a.title,
    description: a.description,
    time: a.date,
    tone: a.tone || "accent",
  }));
  return <Timeline items={items} />;
}

export function VentureDocuments({ documents = [] }) {
  if (!documents.length) {
    return <p className="venture-sub__empty">No documents uploaded yet.</p>;
  }
  return (
    <div className="venture-docs">
      {documents.map((doc) => (
        <article key={doc.id} className="venture-docs__card">
          <span className="venture-docs__icon">
            <FiFileText />
          </span>
          <div className="venture-docs__info">
            <h4>{doc.name}</h4>
            <p>{doc.size} · {doc.date}</p>
          </div>
          <button type="button" className="venture-docs__download" aria-label="Download">
            <FiDownload />
          </button>
        </article>
      ))}
    </div>
  );
}

export function VentureAmenities({ amenities = {} }) {
  const active = AMENITY_KEYS.filter((a) => amenities[a.key]);
  if (!active.length) {
    return <p className="venture-sub__empty">No amenities listed.</p>;
  }
  return (
    <div className="venture-amenities">
      {active.map((a) => (
        <div key={a.key} className="venture-amenities__item">
          <span className="venture-amenities__icon">{AMENITY_ICONS[a.key]}</span>
          <span>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

export function VenturePricing({ venture }) {
  const rows = [
    { label: "Base Price", value: formatSqYardPrice(venture.basePrice) },
    { label: "Current Price", value: formatSqYardPrice(venture.currentPrice) },
    { label: "Price Per Sq.Yard", value: formatSqYardPrice(venture.pricePerSqYard) },
    { label: "Price Range", value: `${formatPrice(venture.priceMin)} – ${formatPrice(venture.priceMax)}` },
    { label: "Registration Charges", value: formatPrice(venture.registrationCharges) },
    { label: "Development Charges", value: formatPrice(venture.developmentCharges) },
  ];
  return (
    <div className="venture-pricing">
      {rows.map((r) => (
        <div key={r.label} className="venture-pricing__row">
          <span className="venture-pricing__label">{r.label}</span>
          <span className="venture-pricing__value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function VentureLocation({ venture }) {
  const places = venture.nearbyPlaces || {};
  return (
    <div className="venture-location">
      <div className="venture-location__map">
        <div className="venture-location__map-placeholder">
          <FiMapPin />
          <p>Google Maps</p>
          <span>{venture.latitude}, {venture.longitude}</span>
          {venture.mapUrl && (
            <a href={venture.mapUrl} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      </div>
      <div className="venture-location__places">
        {venture.landmarks?.length > 0 && (
          <div className="venture-location__group">
            <h4>Landmarks</h4>
            <ul>{venture.landmarks.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        )}
        {places.hospitals?.length > 0 && (
          <div className="venture-location__group">
            <h4>Hospitals</h4>
            <ul>{places.hospitals.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
        {places.schools?.length > 0 && (
          <div className="venture-location__group">
            <h4>Schools</h4>
            <ul>{places.schools.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
        {places.airport && (
          <div className="venture-location__group">
            <h4>Airport</h4>
            <p>{places.airport}</p>
          </div>
        )}
        {places.highway && (
          <div className="venture-location__group">
            <h4>Highway</h4>
            <p>{places.highway}</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiLayers,
  FiGrid,
} from "react-icons/fi";
import Badge from "../ui/badge/Badge";
import Dropdown from "../ui/dropdown/Dropdown";
import VentureProgress from "./VentureProgress";
import MediaImage from "./MediaImage";
import { formatPriceRange, formatSqYardPrice } from "../../pages/ventures/constants";
import { getVentureStatistics } from "../../shared/services/statisticsService.js";
import { getAvatarFallback, getVentureCardImageUrl } from "../../utils/media";
import "./VentureCard.css";

export default function VentureCard({ venture, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const stats = useMemo(() => getVentureStatistics(venture.id), [venture.id]);

  const location = [venture.city, venture.district].filter(Boolean).join(", ");
  const revenueCr = stats.revenue ? (stats.revenue / 10000000).toFixed(2) : "0";

  return (
    <article className={`venture-card ${expanded ? "is-expanded" : ""}`}>
      <div
        className="venture-card__main"
        onClick={() => setExpanded((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((p) => !p)}
      >
        <div className="venture-card__cover">
          <MediaImage
            src={getVentureCardImageUrl(venture)}
            alt={venture.name}
            className="venture-card__cover-image"
            placeholderClassName="venture-card__cover-placeholder"
            loading="lazy"
          />
        </div>

        <div className="venture-card__logo">
          <MediaImage
            src={venture.logo || venture.thumbnail}
            fallback={getAvatarFallback(venture.name)}
            alt=""
            className="venture-card__logo-image"
          />
        </div>

        <div className="venture-card__info">
          <div className="venture-card__head">
            <h3 className="venture-card__name">{venture.name}</h3>
            <Badge status={venture.status} dot />
          </div>
          <p className="venture-card__meta">
            <FiMapPin /> {location}
            <span className="venture-card__dot">·</span>
            {venture.developer}
          </p>
          <div className="venture-card__tags">
            <span className="venture-card__tag">{venture.propertyType}</span>
            <span className="venture-card__tag venture-card__tag--price">
              {formatPriceRange(venture.priceMin, venture.priceMax)}
            </span>
          </div>
        </div>

        <div className="venture-card__metrics">
          <div className="venture-card__metric">
            <FiLayers />
            <span>{stats.totalLayouts}</span>
            <small>Layouts</small>
          </div>
          <div className="venture-card__metric">
            <FiGrid />
            <span>{stats.totalPlots}</span>
            <small>Plots</small>
          </div>
          <div className="venture-card__metric venture-card__metric--avail">
            <span>{stats.availablePlots}</span>
            <small>Avail</small>
          </div>
          <div className="venture-card__metric venture-card__metric--booked">
            <span>{stats.bookedPlots}</span>
            <small>Booked</small>
          </div>
          <div className="venture-card__metric venture-card__metric--sold">
            <span>{stats.soldPlots}</span>
            <small>Sold</small>
          </div>
        </div>

        <div className="venture-card__footer">
          <div className="venture-card__progress">
            <VentureProgress value={venture.progress} compact />
          </div>

          <div className="venture-card__actions" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              items={[
                { label: "View", icon: <FiEye />, onClick: () => navigate(`/dashboard/ventures/${venture.id}`) },
                { label: "Edit", icon: <FiEdit2 />, onClick: () => onEdit?.(venture) },
                { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => onDelete?.(venture) },
              ]}
            />
            <button
              type="button"
              className={`venture-card__expand ${expanded ? "is-open" : ""}`}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <FiChevronDown />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="venture-card__details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="venture-card__details-inner">
              <p className="venture-card__description">{venture.description}</p>
              <div className="venture-card__detail-grid">
                <div>
                  <span className="venture-card__detail-label">Price / Sq.Yd</span>
                  <span className="venture-card__detail-value">
                    {formatSqYardPrice(venture.pricePerSqYard)}
                  </span>
                </div>
                <div>
                  <span className="venture-card__detail-label">Approval</span>
                  <span className="venture-card__detail-value">{venture.approval}</span>
                </div>
                <div>
                  <span className="venture-card__detail-label">Revenue</span>
                  <span className="venture-card__detail-value">₹{revenueCr} Cr</span>
                </div>
                <div>
                  <span className="venture-card__detail-label">Bookings</span>
                  <span className="venture-card__detail-value">{stats.totalBookings}</span>
                </div>
              </div>
              <button
                type="button"
                className="venture-card__view-btn"
                onClick={() => navigate(`/dashboard/ventures/${venture.id}`)}
              >
                <FiEye /> View Full Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

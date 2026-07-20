import { motion } from "framer-motion";
import {
  FiEye,
  FiEdit2,
  FiBookmark,
  FiCheckSquare,
  FiUser,
  FiMaximize,
  FiCompass,
  FiLayers,
} from "react-icons/fi";
import PlotStatusBadge from "./PlotStatusBadge";
import { formatINR } from "../../pages/plotInventory/constants";
import "./PlotCard.css";

export default function PlotCard({ plot, onView, onEdit, onReserve, onBook }) {
  const canReserve = plot.status === "Available";
  const canBook = ["Available", "Reserved"].includes(plot.status);

  return (
    <motion.article
      className={`plot-card plot-card--${(plot.status || "available").toLowerCase()}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="plot-card__preview">
        <div className="plot-card__diagram" aria-hidden="true">
          <span className="plot-card__plot-no">{plot.plotNumber}</span>
          <span className="plot-card__facing">
            <FiCompass /> {plot.facing}
          </span>
          {plot.corner && <span className="plot-card__corner">Corner</span>}
        </div>

        <div className="plot-card__actions">
          <button type="button" onClick={() => onView?.(plot)} aria-label="View plot">
            <FiEye /> View
          </button>
          {canReserve && (
            <button type="button" onClick={() => onReserve?.(plot)} aria-label="Reserve plot">
              <FiBookmark /> Reserve
            </button>
          )}
          {canBook && (
            <button type="button" className="is-primary" onClick={() => onBook?.(plot)} aria-label="Book plot">
              <FiCheckSquare /> Book
            </button>
          )}
          <button type="button" onClick={() => onEdit?.(plot)} aria-label="Edit plot">
            <FiEdit2 /> Edit
          </button>
        </div>
      </div>

      <div className="plot-card__body">
        <header className="plot-card__head">
          <button type="button" className="plot-card__title" onClick={() => onView?.(plot)}>
            {plot.plotNumber}
          </button>
          <PlotStatusBadge status={plot.status} size="sm" />
        </header>

        <p className="plot-card__layout">
          <FiLayers /> {plot.layoutName}
        </p>

        <div className="plot-card__specs">
          <span>
            <FiMaximize /> {plot.areaSqYards} sq.yd
          </span>
          <span>{plot.dimensions}</span>
        </div>

        <div className="plot-card__footer">
          <span className="plot-card__price">{formatINR(plot.finalPrice)}</span>
          {plot.customer ? (
            <span className="plot-card__customer">
              <FiUser /> {plot.customer}
            </span>
          ) : (
            <span className="plot-card__rate">{formatINR(plot.totalPrice)} base</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

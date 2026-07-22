import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMaximize,
  FiGrid,
  FiMapPin,
  FiClock,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiMap,
  FiUploadCloud,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import Badge from "../ui/badge/Badge";
import Dropdown from "../ui/dropdown/Dropdown";
import { PLOT_STATUS_META, formatArea } from "../../pages/layouts/constants";
import "./LayoutCard.css";

export default function LayoutCard({ layout, onEdit, onDelete }) {
  const navigate = useNavigate();
  const plots = layout.plots || {};
  const total = plots.total || 0;

  const open = () => navigate(`/dashboard/layouts/${layout.id}`);

  return (
    <motion.article
      className="layout-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <button type="button" className="layout-card__media" onClick={open} aria-label={`Open ${layout.name}`}>
        <img src={layout.thumbnail} alt={layout.name} loading="lazy" />
        <span className="layout-card__status">
          <Badge status={layout.status} dot size="sm" />
        </span>
        <span className="layout-card__approval">{layout.approval}</span>
      </button>

      <div className="layout-card__body">
        <div className="layout-card__heading">
          <button type="button" className="layout-card__name" onClick={open}>
            {layout.name}
          </button>
          <Dropdown
            items={[
              { label: "View Details", icon: <FiEye />, onClick: open },
              { label: "Edit", icon: <FiEdit2 />, onClick: () => onEdit?.(layout) },
              {
                label: "Open Workspace",
                icon: <FiMap />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}/workspace`),
              },
              {
                label: "Open Plot Inventory",
                icon: <FiGrid />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}?tab=plots`),
              },
              {
                label: "Layout Plan",
                icon: <FiMap />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}?tab=plan`),
              },
              {
                label: "Upload Plan",
                icon: <FiUploadCloud />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}/edit`),
              },
              {
                label: "Documents",
                icon: <FiFileText />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}?tab=documents`),
              },
              {
                label: "Gallery",
                icon: <FiImage />,
                onClick: () => navigate(`/dashboard/layouts/${layout.id}?tab=gallery`),
              },
              { label: "Delete", icon: <FiTrash2 />, tone: "danger", onClick: () => onDelete?.(layout) },
            ]}
          />
        </div>

        <p className="layout-card__venture">
          <FiMapPin /> {layout.ventureName} · {layout.city}
        </p>

        <div className="layout-card__specs">
          <span>
            <FiMaximize /> {formatArea(layout.totalArea)}
          </span>
          <span>
            <FiGrid /> {total} plots
          </span>
        </div>

        <div className="layout-card__bar" role="img" aria-label="Plot status distribution">
          {PLOT_STATUS_META.map((s) => {
            const val = plots[s.key] || 0;
            const pct = total ? (val / total) * 100 : 0;
            if (!pct) return null;
            return (
              <span
                key={s.key}
                className={`layout-card__bar-seg layout-card__bar-seg--${s.key}`}
                style={{ width: `${pct}%` }}
                title={`${s.label}: ${val}`}
              />
            );
          })}
        </div>

        <div className="layout-card__legend">
          {PLOT_STATUS_META.map((s) => (
            <span key={s.key} className="layout-card__legend-item">
              <i className={`layout-card__dot layout-card__dot--${s.key}`} />
              {s.label} <strong>{plots[s.key] || 0}</strong>
            </span>
          ))}
        </div>

        <footer className="layout-card__footer">
          <span className="layout-card__updated">
            <FiClock /> Updated {layout.lastUpdated}
          </span>
          <div className="layout-card__footer-actions">
            <button
              type="button"
              className="layout-card__workspace-btn"
              onClick={() => navigate(`/dashboard/layouts/${layout.id}/workspace`)}
            >
              <FiMap /> Open Workspace
            </button>
            <span className="layout-card__code">{layout.code}</span>
          </div>
        </footer>
      </div>
    </motion.article>
  );
}

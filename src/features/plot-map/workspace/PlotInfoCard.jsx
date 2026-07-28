import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBookOpen,
  FiEye,
  FiPrinter,
  FiShare2,
  FiX,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi';
import { MapStatus } from '../PlotStatusBar';
import { PlotDrawerService } from '../services/plotInteraction';

function PlotInfoCard({
  open,
  plot,
  layout,
  onClose,
  onBook,
  onReserve,
  onViewDetails,
  onEdit,
  onDelete,
  onPrint,
  onShare,
}) {
  const view = plot ? PlotDrawerService.buildDetailView(plot, layout) : null;
  const canBook = view?.actions?.includes('book') || view?.actions?.includes('reserve');

  return (
    <AnimatePresence>
      {open && view ? (
        <motion.article
          className="ws-plot-card"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label={`Plot ${view.plotNumber}`}
        >
          <header className="ws-plot-card__header">
            <div>
              <p className="ws-plot-card__eyebrow">
                {view.block !== '—' ? `Block ${view.block}` : 'Plot'}
                {view.layout !== '—' ? ` · ${view.layout}` : ''}
              </p>
              <h3 className="ws-plot-card__title">Plot {view.plotNumber}</h3>
            </div>
            <div className="ws-plot-card__header-right">
              <MapStatus status={view.status} />
              <button type="button" className="ws-plot-card__close" onClick={onClose} aria-label="Close plot card">
                <FiX />
              </button>
            </div>
          </header>

          <dl className="ws-plot-card__grid">
            <div><dt>Area</dt><dd>{view.area}</dd></div>
            <div><dt>Facing</dt><dd>{view.facing}</dd></div>
            <div><dt>Dimensions</dt><dd>{view.dimensions}</dd></div>
            <div><dt>Price</dt><dd>{view.price}</dd></div>
            <div><dt>Rate</dt><dd>{view.ratePerSqYard}</dd></div>
            <div><dt>Registration</dt><dd>{view.status === 'Sold' ? 'Registered' : '—'}</dd></div>
            <div><dt>Booking</dt><dd>{view.statusLabel}</dd></div>
            <div><dt>Customer</dt><dd>{view.customer}</dd></div>
            <div><dt>Road Width</dt><dd>{view.roadWidth}</dd></div>
            <div><dt>Corner</dt><dd>{view.cornerPlot}</dd></div>
            <div className="ws-plot-card__full">
              <dt>Reservation</dt>
              <dd>{plot.reservedAt || plot.reservationDate || plot.history?.[0]?.date || '—'}</dd>
            </div>
            <div className="ws-plot-card__full">
              <dt>Last Updated</dt>
              <dd>{plot.updatedAt || plot.history?.[0]?.date || '—'}</dd>
            </div>
          </dl>

          <footer className="ws-plot-card__footer">
            {canBook ? (
              <button
                type="button"
                className="ws-plot-card__cta"
                onClick={view.actions.includes('book') ? onBook : onReserve}
              >
                <FiBookOpen /> {view.actions.includes('book') ? 'Book Plot' : 'Reserve Plot'}
              </button>
            ) : null}
            <button type="button" className="ws-plot-card__secondary" onClick={onViewDetails}>
              <FiEye /> View Details
            </button>
            <button type="button" className="ws-plot-card__icon-btn" onClick={onPrint} title="Print" aria-label="Print">
              <FiPrinter />
            </button>
            <button type="button" className="ws-plot-card__icon-btn" onClick={onShare} title="Coming Soon" aria-label="Share — Coming Soon" disabled>
              <FiShare2 />
            </button>
            {view.actions.includes('edit') ? (
              <button type="button" className="ws-plot-card__icon-btn" onClick={onEdit} title="Edit" aria-label="Edit plot">
                <FiEdit2 />
              </button>
            ) : null}
            {view.actions.includes('delete') ? (
              <button type="button" className="ws-plot-card__icon-btn is-danger" onClick={onDelete} title="Delete" aria-label="Delete plot">
                <FiTrash2 />
              </button>
            ) : null}
          </footer>
        </motion.article>
      ) : null}
    </AnimatePresence>
  );
}

export default memo(PlotInfoCard);

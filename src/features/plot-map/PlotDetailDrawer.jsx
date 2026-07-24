import {
  FiBookmark,
  FiBookOpen,
  FiEdit2,
  FiLock,
  FiShoppingBag,
  FiTrash2,
  FiUnlock,
} from 'react-icons/fi';
import Button from '../../components/ui/button/Button';
import RightDrawer from '../../components/drawer/RightDrawer';
import { MapStatus } from './PlotStatusBar';
import { PlotDrawerService } from './services/plotInteraction';

const ACTION_CONFIG = {
  reserve: { label: 'Reserve', icon: FiBookmark, variant: 'accent' },
  book: { label: 'Book', icon: FiBookOpen, variant: 'accent' },
  sold: { label: 'Mark Sold', icon: FiShoppingBag, variant: 'ghost' },
  block: { label: 'Block', icon: FiLock, variant: 'ghost' },
  release: { label: 'Release', icon: FiUnlock, variant: 'ghost' },
  edit: { label: 'Edit', icon: FiEdit2, variant: 'ghost' },
  delete: { label: 'Delete', icon: FiTrash2, variant: 'ghost', tone: 'danger' },
};

export default function PlotDetailDrawer({
  open,
  onClose,
  plot,
  layout,
  onReserve,
  onBook,
  onPurchase,
  onBlock,
  onRelease,
  onEdit,
  onDelete,
}) {
  if (!plot) return null;

  const view = PlotDrawerService.buildDetailView(plot, layout);

  const handlers = {
    reserve: onReserve,
    book: onBook,
    sold: onPurchase,
    block: onBlock,
    release: onRelease,
    edit: onEdit,
    delete: onDelete,
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={`Plot ${view.plotNumber}`}
      subtitle={`${view.block !== '—' ? `${view.block} · ` : ''}${view.layout}`}
      size="md"
      footer={
        <div className="plot-map-drawer__footer plot-map-drawer__footer--stack">
          {view.actions.map((actionKey) => {
            const config = ACTION_CONFIG[actionKey];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Button
                key={actionKey}
                variant={config.variant}
                size="md"
                className={config.tone === 'danger' ? 'plot-map-detail__delete-btn' : undefined}
                onClick={handlers[actionKey]}
              >
                <Icon /> {config.label}
              </Button>
            );
          })}
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="plot-map-detail">
        <div className="plot-map-detail__status-row">
          <MapStatus status={view.status} />
        </div>

        <dl className="plot-map-detail__grid">
          <div><dt>Plot Number</dt><dd>{view.plotNumber}</dd></div>
          <div><dt>Block</dt><dd>{view.block}</dd></div>
          <div><dt>Layout</dt><dd>{view.layout}</dd></div>
          <div><dt>Row</dt><dd>{view.rowNumber}</dd></div>
          <div><dt>Column</dt><dd>{view.columnNumber}</dd></div>
          <div><dt>Area</dt><dd>{view.area}</dd></div>
          <div><dt>Facing</dt><dd>{view.facing}</dd></div>
          <div><dt>Dimensions</dt><dd>{view.dimensions}</dd></div>
          <div><dt>Road Width</dt><dd>{view.roadWidth}</dd></div>
          <div><dt>PLC Type</dt><dd>{view.plcType}</dd></div>
          <div><dt>Corner Plot</dt><dd>{view.cornerPlot}</dd></div>
          <div><dt>Price</dt><dd>{view.price}</dd></div>
          <div><dt>Rate / Sq.Yd</dt><dd>{view.ratePerSqYard}</dd></div>
          <div><dt>Current Status</dt><dd>{view.statusLabel}</dd></div>
          <div><dt>Latitude</dt><dd>{view.latitude}</dd></div>
          <div><dt>Longitude</dt><dd>{view.longitude}</dd></div>
          {view.description !== '—' ? (
            <div className="plot-map-detail__full"><dt>Description</dt><dd>{view.description}</dd></div>
          ) : null}
        </dl>

        {plot.history?.length ? (
          <div className="plot-map-detail__history">
            <h4>History</h4>
            <ul>
              {plot.history.slice(0, 6).map((event, index) => (
                <li key={`${event.date}-${index}`}>
                  <strong>{event.title}</strong>
                  <span>{event.date}</span>
                  {event.description ? <p>{event.description}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </RightDrawer>
  );
}

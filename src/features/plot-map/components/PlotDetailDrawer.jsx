import { FiCalendar, FiShoppingBag, FiBookmark } from 'react-icons/fi';
import Button from '../../../components/ui/button/Button';
import RightDrawer from '../../../components/drawer/RightDrawer';
import MapStatus from './MapStatus';
import { formatINR } from '../../../pages/plotInventory/constants';
import { formatCoordinate } from '../utils/coordinates';

export default function PlotDetailDrawer({
  open,
  onClose,
  plot,
  onReserve,
  onPurchase,
  onScheduleVisit,
}) {
  if (!plot) return null;

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={`Plot ${plot.plotNumber}`}
      subtitle={plot.layoutName || 'Layout plot'}
      size="md"
      footer={
        <div className="plot-map-drawer__footer plot-map-drawer__footer--stack">
          <Button variant="accent" size="md" onClick={onReserve} disabled={plot.status === 'Sold'}>
            <FiBookmark /> Reserve Plot
          </Button>
          <Button variant="ghost" size="md" onClick={onPurchase} disabled={plot.status === 'Sold'}>
            <FiShoppingBag /> Purchase
          </Button>
          <Button variant="ghost" size="md" onClick={onScheduleVisit}>
            <FiCalendar /> Schedule Visit
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="plot-map-detail">
        <div className="plot-map-detail__status-row">
          <MapStatus status={plot.status} />
          <span className="plot-map-detail__id">{plot.id}</span>
        </div>

        <dl className="plot-map-detail__grid">
          <div><dt>Area</dt><dd>{plot.areaSqYards ? `${plot.areaSqYards} sq.yd` : '—'}</dd></div>
          <div><dt>Dimensions</dt><dd>{plot.dimensions || '—'}</dd></div>
          <div><dt>Facing</dt><dd>{plot.facing || '—'}</dd></div>
          <div><dt>Price</dt><dd>{formatINR(plot.finalPrice || plot.totalPrice)}</dd></div>
          <div><dt>Latitude</dt><dd>{formatCoordinate(plot.latitude)}</dd></div>
          <div><dt>Longitude</dt><dd>{formatCoordinate(plot.longitude)}</dd></div>
          <div><dt>Reservation Expiry</dt><dd>{plot.reservationExpiry || '—'}</dd></div>
          <div><dt>Customer</dt><dd>{plot.customer || '—'}</dd></div>
          <div><dt>Partner</dt><dd>{plot.agent || '—'}</dd></div>
        </dl>
      </div>
    </RightDrawer>
  );
}

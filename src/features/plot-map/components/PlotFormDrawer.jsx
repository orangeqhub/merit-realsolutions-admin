import Button from '../../../components/ui/button/Button';
import Input from '../../../components/ui/input/Input';
import Select from '../../../components/ui/select/Select';
import RightDrawer from '../../../components/drawer/RightDrawer';
import { MAP_STATUS_OPTIONS } from '../constants/mapStatus';
import { formatCoordinate } from '../utils/coordinates';
import { FACINGS } from '../../../pages/plotInventory/constants';

export default function PlotFormDrawer({
  open,
  onClose,
  form,
  setForm,
  frozenCoords,
  onSave,
}) {
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Create Plot"
      subtitle="Plot will appear on the map instantly after save"
      size="md"
      footer={
        <div className="plot-map-drawer__footer">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" size="md" onClick={onSave}>
            Save Plot
          </Button>
        </div>
      }
    >
      <div className="plot-map-drawer__coords-readonly">
        <div>
          <span>Latitude</span>
          <strong>{formatCoordinate(frozenCoords?.lat)}</strong>
        </div>
        <div>
          <span>Longitude</span>
          <strong>{formatCoordinate(frozenCoords?.lng)}</strong>
        </div>
      </div>

      <div className="plot-map-drawer__form">
        <Input label="Plot Number" required value={form.plotNumber} onChange={(e) => setField('plotNumber', e.target.value)} />
        <Input label="Area (sq.yd)" type="number" value={form.areaSqYards} onChange={(e) => setField('areaSqYards', e.target.value)} />
        <Select label="Facing" value={form.facing} onChange={(v) => setField('facing', v)} options={FACINGS.map((f) => ({ value: f, label: f }))} />
        <Input label="Dimensions" placeholder="40x60" value={form.dimensions} onChange={(e) => setField('dimensions', e.target.value)} />
        <Input label="Rate / sq.yd (₹)" type="number" value={form.ratePerSqYard} onChange={(e) => setField('ratePerSqYard', e.target.value)} />
        <Select label="Status" value={form.status} onChange={(v) => setField('status', v)} options={MAP_STATUS_OPTIONS} />
        <Input label="Width (px)" type="number" value={form.mapWidth} onChange={(e) => setField('mapWidth', e.target.value)} />
        <Input label="Height (px)" type="number" value={form.mapHeight} onChange={(e) => setField('mapHeight', e.target.value)} />
        <Input label="Rotation (°)" type="number" value={form.rotation} onChange={(e) => setField('rotation', e.target.value)} />
      </div>
    </RightDrawer>
  );
}

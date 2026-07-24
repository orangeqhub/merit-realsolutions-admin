import { FiEye } from 'react-icons/fi';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import RightDrawer from '../../components/drawer/RightDrawer';
import { MAP_STATUS_OPTIONS } from './constants/mapStatus';
import { FACINGS } from '../../pages/plotInventory/constants';

const CORNER_LABELS = ['Corner 1', 'Corner 2', 'Corner 3', 'Corner 4'];

export default function PlotFormDrawer({
  open,
  onClose,
  form,
  setForm,
  onPreview,
  onSave,
  mode = 'create',
}) {
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setCorner = (index, axis, value) => {
    setForm((prev) => {
      const corners = [...(prev.corners || [])];
      corners[index] = { ...corners[index], [axis]: value };
      return { ...prev, corners };
    });
  };

  const isEdit = mode === 'edit';

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Plot' : 'Add Plot'}
      subtitle="Enter four corner coordinates in decimal degrees, preview on the map, then save"
      size="md"
      overlayMode="transparent"
      footer={
        <div className="plot-map-drawer__footer plot-map-drawer__footer--stack">
          <Button variant="ghost" size="md" onClick={onPreview}>
            <FiEye /> Preview
          </Button>
          <Button variant="accent" size="md" onClick={onSave}>
            {isEdit ? 'Update Plot' : 'Save'}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="plot-map-drawer__form plot-map-drawer__form--plot-create">
        <Input
          label="Plot Number"
          required
          value={form.plotNumber}
          onChange={(e) => setField('plotNumber', e.target.value)}
          className="plot-map-drawer__full"
        />

        <div className="plot-map-drawer__corner-section plot-map-drawer__full">
          <h4>Corner Coordinates</h4>
          <p>Use decimal degrees from Google Maps (right-click → coordinates). Example: 16.555972, 80.385750</p>
          {CORNER_LABELS.map((label, index) => (
            <div key={label} className="plot-map-drawer__corner-row">
              <span className="plot-map-drawer__corner-label">{label}</span>
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={form.corners?.[index]?.lat ?? ''}
                onChange={(e) => setCorner(index, 'lat', e.target.value)}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={form.corners?.[index]?.lng ?? ''}
                onChange={(e) => setCorner(index, 'lng', e.target.value)}
              />
            </div>
          ))}
        </div>

        <Input
          label="Area (sq.yd)"
          type="number"
          value={form.areaSqYards}
          onChange={(e) => setField('areaSqYards', e.target.value)}
        />
        <Select
          label="Facing"
          value={form.facing}
          onChange={(v) => setField('facing', v)}
          options={FACINGS.map((f) => ({ value: f, label: f }))}
        />
        <Input
          label="Rate / sq.yd (₹)"
          type="number"
          value={form.ratePerSqYard}
          onChange={(e) => setField('ratePerSqYard', e.target.value)}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(v) => setField('status', v)}
          options={MAP_STATUS_OPTIONS}
        />
      </div>
    </RightDrawer>
  );
}

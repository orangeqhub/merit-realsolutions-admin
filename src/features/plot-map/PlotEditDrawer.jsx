import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Textarea from '../../components/ui/textarea/Textarea';
import Button from '../../components/ui/button/Button';
import RightDrawer from '../../components/drawer/RightDrawer';
import { MAP_STATUS_OPTIONS } from './constants/mapStatus';
import { FACINGS } from '../../pages/plotInventory/constants';

export default function PlotEditDrawer({ open, onClose, form, setForm, onSave }) {
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={`Edit Plot ${form.plotNumber || ''}`}
      subtitle="Update plot details — map coordinates cannot be changed here"
      size="md"
      overlayMode="transparent"
      footer={
        <div className="plot-map-drawer__footer plot-map-drawer__footer--stack">
          <Button variant="accent" size="md" onClick={onSave}>
            Save Changes
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="plot-map-drawer__form plot-map-drawer__form--plot-edit">
        <Input label="Plot Number" value={form.plotNumber} disabled />
        <Input
          label="Area (Sq.Yds)"
          type="number"
          value={form.areaSqYards}
          onChange={(e) => setField('areaSqYards', e.target.value)}
        />
        <Input
          label="Dimensions"
          value={form.dimensions}
          onChange={(e) => setField('dimensions', e.target.value)}
          placeholder="e.g. 40 × 60 ft"
        />
        <Select
          label="Facing"
          value={form.facing}
          onChange={(v) => setField('facing', v)}
          options={FACINGS.map((f) => ({ value: f, label: f }))}
        />
        <Input
          label="Rate / Sq.Yd (₹)"
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
        <Textarea
          label="Notes"
          rows={4}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          className="plot-map-drawer__full"
          hint="Saved as plot notes"
        />
      </div>
    </RightDrawer>
  );
}

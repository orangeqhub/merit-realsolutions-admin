import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Select from '../../components/ui/select/Select';
import FormSection from '../../components/forms/FormSection';
import { useToast } from '../../components/feedback/Toast';
import {
  createStatistic,
  getStatistic,
  updateStatistic,
} from '../../services/websiteContent/websiteContentApi.js';
import { CONTENT_STATUS, EMPTY_STATISTIC, mapStatisticToForm } from './constants';
import './websiteContent.css';

export default function StatisticsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(id);
  const [form, setForm] = useState({ ...EMPTY_STATISTIC });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    getStatistic(id)
      .then((data) => setForm(mapStatisticToForm(data)))
      .catch((err) => toast.error(err.message || 'Failed to load statistic.'))
      .finally(() => setLoading(false));
  }, [id, editing, toast]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const save = async () => {
    if (!form.title?.trim() || !form.number?.trim()) {
      toast.error('Title and number are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        websiteVisible: Boolean(form.websiteVisible),
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (editing) {
        await updateStatistic(id, payload);
        toast.success('Statistic updated.');
      } else {
        await createStatistic(payload);
        toast.success('Statistic created.');
      }
      navigate('/dashboard/content/statistics');
    } catch (err) {
      toast.error(err.message || 'Failed to save statistic.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-page">
      <PageHeader
        title={editing ? 'Edit Statistic' : 'Add Statistic'}
        actions={(
          <Button variant="ghost" onClick={() => navigate('/dashboard/content/statistics')}>
            <FiArrowLeft /> Back
          </Button>
        )}
      />

      <FormSection title="Statistic Details" loading={loading}>
        <div className="cms-grid cms-grid--3">
          <Input label="Number" value={form.number} onChange={(e) => setField('number', e.target.value)} required />
          <Input label="Suffix" value={form.suffix} onChange={(e) => setField('suffix', e.target.value)} />
          <Input label="Icon" value={form.icon} onChange={(e) => setField('icon', e.target.value)} placeholder="properties, clients..." />
        </div>
        <Input label="Title" value={form.title} onChange={(e) => setField('title', e.target.value)} required />
        <Textarea label="Description (optional)" rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} />
        <div className="cms-grid cms-grid--3">
          <Input label="Display Order" type="number" value={form.displayOrder} onChange={(e) => setField('displayOrder', e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => setField('status', e.target.value)} options={CONTENT_STATUS} />
          <Select
            label="Website Visibility"
            value={form.websiteVisible ? 'true' : 'false'}
            onChange={(e) => setField('websiteVisible', e.target.value === 'true')}
            options={[
              { value: 'true', label: 'Visible on Website' },
              { value: 'false', label: 'Hidden from Website' },
            ]}
          />
        </div>
        <div className="cms-form__actions">
          <Button variant="accent" disabled={saving} onClick={save}><FiSave /> Save</Button>
        </div>
      </FormSection>
    </div>
  );
}

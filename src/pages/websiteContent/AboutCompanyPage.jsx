import { useEffect, useState } from 'react';
import { FiExternalLink, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Upload from '../../components/ui/upload/Upload';
import FormSection from '../../components/forms/FormSection';
import DataTable from '../../components/table/DataTable';
import Badge from '../../components/ui/badge/Badge';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  createHighlight,
  deleteHighlight,
  fetchAboutContent,
  listHighlights,
  setHighlightStatus,
  updateAboutContent,
} from '../../services/websiteContent/websiteContentApi.js';
import { EMPTY_ABOUT, mapAboutToForm } from './constants';
import './websiteContent.css';

export default function AboutCompanyPage() {
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY_ABOUT });
  const [imageFile, setImageFile] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [about, highlightData] = await Promise.all([
        fetchAboutContent(),
        listHighlights({ pageSize: 100 }),
      ]);
      setForm(mapAboutToForm(about));
      setHighlights(highlightData.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load about content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const saveAbout = async () => {
    setSaving(true);
    try {
      const data = await updateAboutContent(form, imageFile);
      setForm(mapAboutToForm(data));
      setImageFile(null);
      toast.success('About company content saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save about content.');
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = async () => {
    if (!newHighlight.trim()) return;
    try {
      await createHighlight({ title: newHighlight.trim(), status: 'ACTIVE' });
      setNewHighlight('');
      const highlightData = await listHighlights({ pageSize: 100 });
      setHighlights(highlightData.items || []);
      toast.success('Highlight added.');
    } catch (err) {
      toast.error(err.message || 'Failed to add highlight.');
    }
  };

  const toggleHighlight = async (row) => {
    try {
      await setHighlightStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to update highlight.');
    }
  };

  const confirmDeleteHighlight = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHighlight(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      toast.success('Highlight deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete highlight.');
    }
  };

  const columns = [
    { key: 'displayOrder', header: 'Order', render: (row) => row.displayOrder },
    { key: 'title', header: 'Title', render: (row) => row.title },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}
          label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="cms-table__actions">
          <Button variant="ghost" size="sm" onClick={() => toggleHighlight(row)}>
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="cms-page">
      <PageHeader
        title="About Company"
        subtitle="Manage company story, experience badge, and highlights shown on the public website."
        actions={(
          <Button variant="ghost" size="sm" onClick={() => window.open('/', '_blank')}>
            <FiExternalLink /> Preview Website
          </Button>
        )}
      />

      <FormSection title="Company Content" loading={loading}>
        <div className="cms-grid cms-grid--2">
          <Upload
            label="Company Image"
            value={imageFile || form.companyImage}
            onChange={(file) => setImageFile(file)}
            accept="image/*"
          />
          <div className="cms-stack">
            <Input label="Small Heading" value={form.smallHeading} onChange={(e) => setField('smallHeading', e.target.value)} />
            <Input label="Main Heading" value={form.mainHeading} onChange={(e) => setField('mainHeading', e.target.value)} />
          </div>
        </div>
        <Textarea label="Description Paragraph 1" rows={3} value={form.descriptionParagraph1} onChange={(e) => setField('descriptionParagraph1', e.target.value)} />
        <Textarea label="Description Paragraph 2" rows={3} value={form.descriptionParagraph2} onChange={(e) => setField('descriptionParagraph2', e.target.value)} />
        <Textarea label="Description Paragraph 3" rows={3} value={form.descriptionParagraph3} onChange={(e) => setField('descriptionParagraph3', e.target.value)} />

        <div className="cms-grid cms-grid--3">
          <Input label="Experience Number" value={form.experienceNumber} onChange={(e) => setField('experienceNumber', e.target.value)} />
          <Input label="Experience Suffix" value={form.experienceSuffix} onChange={(e) => setField('experienceSuffix', e.target.value)} />
          <Input label="Experience Label" value={form.experienceLabel} onChange={(e) => setField('experienceLabel', e.target.value)} />
        </div>

        <div className="cms-form__actions">
          <Button variant="accent" disabled={saving} onClick={saveAbout}>
            <FiSave /> Save About Content
          </Button>
        </div>
      </FormSection>

      <FormSection title="Company Highlights">
        <div className="cms-inline-add">
          <Input
            placeholder="Add highlight title"
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
          />
          <Button variant="accent" onClick={addHighlight}><FiPlus /> Add Highlight</Button>
        </div>
        <DataTable columns={columns} rows={highlights} loading={loading} emptyMessage="No highlights yet." />
      </FormSection>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Highlight"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteHighlight}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

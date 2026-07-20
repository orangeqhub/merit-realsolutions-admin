import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Select from '../../components/ui/select/Select';
import Upload from '../../components/ui/upload/Upload';
import FormSection from '../../components/forms/FormSection';
import { useToast } from '../../components/feedback/Toast';
import {
  createBuilder,
  extractBuilderFiles,
  getBuilderById,
  updateBuilder,
} from '../../services/builder/builderApi.js';
import { EMPTY_BUILDER, BUILDER_STATUS, mapBuilderToForm, mapFormToPayload } from './constants';
import './builders.css';

export default function BuilderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [form, setForm] = useState({ ...EMPTY_BUILDER });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!editing) return;
    let active = true;
    setLoading(true);
    getBuilderById(id)
      .then((data) => { if (active) setForm(mapBuilderToForm(data)); })
      .catch((err) => toast.error(err.message || 'Failed to load builder.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, editing, toast]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const validate = () => {
    const e = {};
    if (!form.builderName?.trim()) e.builderName = 'Builder name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Please complete the required fields');
      return;
    }

    const payload = mapFormToPayload(form);
    const files = extractBuilderFiles(form);

    setSaving(true);
    try {
      if (editing) {
        await updateBuilder(id, payload, files);
        toast.success('Builder updated.');
        navigate(`/dashboard/content/builders/${id}`);
      } else {
        const record = await createBuilder(payload, files);
        toast.success('Builder created.');
        navigate(`/dashboard/content/builders/${record.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save builder.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="builders-page__loading">Loading builder...</p>;
  }

  return (
    <motion.div className="erp-module-page builders-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={editing ? 'Edit Builder' : 'Add Builder'}
        description="Manage builder profile, business information, and SEO details."
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </Button>
        }
      />

      <FormSection title="Basic Information" columns={2}>
        <Input
          label="Builder Name"
          required
          value={form.builderName}
          onChange={(e) => setField('builderName', e.target.value)}
          error={errors.builderName}
          className="form-section__full"
        />
        <Input label="Builder Code" value={form.builderCode} disabled placeholder="Auto-generated on save" />
        <Upload label="Company Logo" accept="image/*" value={form.logo} onChange={(v) => setField('logo', v)} />
        <Upload label="Cover Banner" accept="image/*" value={form.coverImage} onChange={(v) => setField('coverImage', v)} />
        <Textarea label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} className="form-section__full" />
        <Textarea label="About Company" value={form.about} onChange={(e) => setField('about', e.target.value)} rows={4} className="form-section__full" />
      </FormSection>

      <FormSection title="Contact Details" columns={2}>
        <Input label="Contact Person" value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} />
        <Input label="Mobile Number" value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} />
        <Input label="Website" value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://" />
        <Textarea label="Office Address" value={form.officeAddress} onChange={(e) => setField('officeAddress', e.target.value)} rows={3} className="form-section__full" />
      </FormSection>

      <FormSection title="Business Information" columns={2}>
        <Input label="Established Year" type="number" value={form.establishedYear} onChange={(e) => setField('establishedYear', e.target.value)} />
        <Input label="RERA Registration Number" value={form.reraNumber} onChange={(e) => setField('reraNumber', e.target.value)} />
        <Input label="Total Completed Projects" type="number" value={form.completedProjects} onChange={(e) => setField('completedProjects', e.target.value)} />
        <Input label="Total Ongoing Projects" type="number" value={form.ongoingProjects} onChange={(e) => setField('ongoingProjects', e.target.value)} />
        <Input label="Total Upcoming Projects" type="number" value={form.upcomingProjects} onChange={(e) => setField('upcomingProjects', e.target.value)} />
        <div className="form-section__full">
          <Textarea
            label="Operating Cities"
            value={form.operatingCitiesText}
            onChange={(e) => setField('operatingCitiesText', e.target.value)}
            rows={2}
            placeholder="Hyderabad, Vijayawada, Guntur, Visakhapatnam, Tirupati"
          />
          <p className="builders-form__hint">Separate multiple cities with commas.</p>
        </div>
      </FormSection>

      <FormSection title="Social Links" columns={2}>
        <Input label="Facebook" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} placeholder="https://facebook.com/..." />
        <Input label="Instagram" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} placeholder="https://instagram.com/..." />
        <Input label="LinkedIn" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
        <Input label="YouTube" value={form.youtube} onChange={(e) => setField('youtube', e.target.value)} placeholder="https://youtube.com/..." />
      </FormSection>

      <FormSection title="SEO & Status" columns={2}>
        <Input label="Meta Title" value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} className="form-section__full" />
        <Textarea label="Meta Description" value={form.metaDescription} onChange={(e) => setField('metaDescription', e.target.value)} rows={3} className="form-section__full" />
        <Select label="Status" value={form.status} onChange={(v) => setField('status', v)} options={BUILDER_STATUS} />
      </FormSection>

      <footer className="builders-form__footer">
        <Button variant="ghost" size="md" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
        <Button variant="accent" size="md" onClick={save} disabled={saving}>
          <FiSave /> {editing ? 'Update Builder' : 'Create Builder'}
        </Button>
      </footer>
    </motion.div>
  );
}

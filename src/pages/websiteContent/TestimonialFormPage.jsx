import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  createTestimonial,
  getTestimonial,
  updateTestimonial,
} from '../../services/websiteContent/websiteContentApi.js';
import { CONTENT_STATUS, CUSTOMER_TYPES, EMPTY_TESTIMONIAL, mapTestimonialToForm } from './constants';
import './websiteContent.css';

export default function TestimonialFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(id);
  const [form, setForm] = useState({ ...EMPTY_TESTIMONIAL });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    getTestimonial(id)
      .then((data) => setForm(mapTestimonialToForm(data)))
      .catch((err) => toast.error(err.message || 'Failed to load testimonial.'))
      .finally(() => setLoading(false));
  }, [id, editing, toast]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const save = async () => {
    if (!form.customerName?.trim() || !form.testimonial?.trim()) {
      toast.error('Customer name and testimonial are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        rating: Number(form.rating) || 5,
        featured: Boolean(form.featured),
        websiteVisible: Boolean(form.websiteVisible),
        displayOrder: Number(form.displayOrder) || 0,
      };
      if (editing) {
        await updateTestimonial(id, payload, imageFile);
        toast.success('Testimonial updated.');
      } else {
        await createTestimonial(payload, imageFile);
        toast.success('Testimonial created.');
      }
      navigate('/dashboard/content/testimonials');
    } catch (err) {
      toast.error(err.message || 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-page">
      <PageHeader
        title={editing ? 'Edit Testimonial' : 'Add Testimonial'}
        actions={(
          <Button variant="ghost" onClick={() => navigate('/dashboard/content/testimonials')}>
            <FiArrowLeft /> Back
          </Button>
        )}
      />

      <FormSection title="Testimonial Details" loading={loading}>
        <Upload
          label="Customer Image"
          value={imageFile || form.customerImage}
          onChange={(file) => setImageFile(file)}
          accept="image/*"
        />
        <div className="cms-grid cms-grid--2">
          <Input label="Customer Name" value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} required />
          <Select label="Customer Type" value={form.customerType} onChange={(e) => setField('customerType', e.target.value)} options={CUSTOMER_TYPES} />
        </div>
        <div className="cms-grid cms-grid--3">
          <Input label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
          <Input label="State" value={form.state} onChange={(e) => setField('state', e.target.value)} />
          <Input label="Rating" type="number" min="1" max="5" value={form.rating} onChange={(e) => setField('rating', e.target.value)} />
        </div>
        <Textarea label="Testimonial" rows={5} value={form.testimonial} onChange={(e) => setField('testimonial', e.target.value)} required />
        <Input label="Property Purchased (optional)" value={form.propertyPurchased} onChange={(e) => setField('propertyPurchased', e.target.value)} />
        <div className="cms-grid cms-grid--3">
          <Input label="Display Order" type="number" value={form.displayOrder} onChange={(e) => setField('displayOrder', e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => setField('status', e.target.value)} options={CONTENT_STATUS} />
          <Select
            label="Featured"
            value={form.featured ? 'true' : 'false'}
            onChange={(e) => setField('featured', e.target.value === 'true')}
            options={[
              { value: 'true', label: 'Featured' },
              { value: 'false', label: 'Standard' },
            ]}
          />
        </div>
        <Select
          label="Website Visibility"
          value={form.websiteVisible ? 'true' : 'false'}
          onChange={(e) => setField('websiteVisible', e.target.value === 'true')}
          options={[
            { value: 'true', label: 'Visible on Website' },
            { value: 'false', label: 'Hidden from Website' },
          ]}
        />
        <div className="cms-form__actions">
          <Button variant="accent" disabled={saving} onClick={save}><FiSave /> Save</Button>
        </div>
      </FormSection>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiX } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Select from '../../components/ui/select/Select';
import Upload from '../../components/ui/upload/Upload';
import FormSection from '../../components/forms/FormSection';
import { useToast } from '../../components/feedback/Toast';
import {
  createGallery,
  createGalleryCategory,
  extractGalleryFiles,
  getGalleryById,
  listGalleryCategories,
  updateGallery,
} from '../../services/gallery/galleryApi.js';
import { EMPTY_GALLERY, GALLERY_STATUS, mapFormToPayload, mapGalleryToForm } from './constants';
import './gallery.css';

export default function GalleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState({ ...EMPTY_GALLERY });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    listGalleryCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!editing) return;
    let active = true;
    setLoading(true);
    getGalleryById(id)
      .then((data) => { if (active) setForm(mapGalleryToForm(data)); })
      .catch((err) => toast.error(err.message || 'Failed to load gallery.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, editing, toast]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  );

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const addNewImages = (files) => {
    const incoming = Array.isArray(files) ? files : [files];
    setForm((p) => ({ ...p, images: [...(p.images || []), ...incoming.filter(Boolean)] }));
  };

  const addNewVideos = (files) => {
    const incoming = Array.isArray(files) ? files : [files];
    setForm((p) => ({ ...p, videos: [...(p.videos || []), ...incoming.filter(Boolean)] }));
  };

  const removeExistingImage = (index) => {
    setForm((p) => ({
      ...p,
      existingImages: p.existingImages.filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index) => {
    setForm((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await createGalleryCategory(name);
      setCategories((prev) => [...prev, created]);
      setField('categoryId', String(created.id));
      setNewCategory('');
      toast.success(`Category "${created.name}" added.`);
    } catch (err) {
      toast.error(err.message || 'Failed to add category.');
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.categoryId) e.categoryId = 'Select a category';
    return e;
  };

  const save = async (publish = false) => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error('Please complete the required fields');
      return;
    }

    const payload = mapFormToPayload({
      ...form,
      status: publish ? 'PUBLISHED' : form.status,
    });
    const files = extractGalleryFiles(form);

    setSaving(true);
    try {
      if (editing) {
        await updateGallery(id, payload, files);
        toast.success(publish ? 'Gallery published.' : 'Gallery updated.');
        navigate(`/dashboard/content/gallery/${id}`);
      } else {
        const record = await createGallery({ ...payload, status: publish ? 'PUBLISHED' : payload.status }, files);
        toast.success(publish ? 'Gallery created and published.' : 'Gallery saved as draft.');
        navigate(`/dashboard/content/gallery/${record.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save gallery.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="gallery-page__loading">Loading gallery...</p>;
  }

  return (
    <motion.div className="erp-module-page gallery-page gallery-form-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={editing ? 'Edit Gallery Album' : 'Add Gallery Album'}
        description="Upload images and optional videos for the website gallery."
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </Button>
        }
      />

      <FormSection title="Album Details" columns={2}>
        <Input label="Title" required value={form.title} onChange={(e) => setField('title', e.target.value)} error={errors.title} className="form-section__full" />
        <Select label="Category" required value={form.categoryId} onChange={(v) => setField('categoryId', v)} options={categoryOptions} placeholder="Select category" error={errors.categoryId} />
        <Input label="Display Order" type="number" value={form.displayOrder} onChange={(e) => setField('displayOrder', e.target.value)} />
        <Select label="Status" value={form.status} onChange={(v) => setField('status', v)} options={GALLERY_STATUS} />
        <div className="form-section__full gallery-form__new-category">
          <Input label="Add New Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Launch Events" />
          <Button type="button" variant="soft" size="md" onClick={handleAddCategory}>Add Category</Button>
        </div>
        <Textarea label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} className="form-section__full" />
      </FormSection>

      <FormSection title="Featured Image" columns={1}>
        <Upload label="Cover / Featured Image" accept="image/*" value={form.coverImage} onChange={(v) => setField('coverImage', v)} />
      </FormSection>

      <FormSection title="Gallery Images" columns={1}>
        <Upload label="Upload Images" accept="image/*" multiple onChange={addNewImages} />
        <div className="gallery-form__media-grid">
          {(form.existingImages || []).map((src, index) => (
            <div key={`existing-${src}`} className="gallery-form__media-thumb">
              <img src={src} alt="" />
              <button type="button" onClick={() => removeExistingImage(index)} aria-label="Remove"><FiX /></button>
            </div>
          ))}
          {(form.images || []).map((file, index) => (
            <div key={`new-${file.name}-${index}`} className="gallery-form__media-thumb">
              <img src={URL.createObjectURL(file)} alt="" />
              <button type="button" onClick={() => removeNewImage(index)} aria-label="Remove"><FiX /></button>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Videos (Optional)" columns={1}>
        <Upload label="Upload Videos" accept="video/mp4,video/webm,video/quicktime" multiple onChange={addNewVideos} />
        {(form.videos || []).length > 0 && (
          <p className="gallery-form__hint">{form.videos.length} new video(s) selected.</p>
        )}
      </FormSection>

      <footer className="gallery-form__footer">
        <Button variant="ghost" size="md" onClick={() => save(false)} disabled={saving}>
          <FiSave /> {editing ? 'Save Draft' : 'Save as Draft'}
        </Button>
        <Button variant="accent" size="md" onClick={() => save(true)} disabled={saving}>
          <FiSave /> {editing ? 'Update & Publish' : 'Publish Gallery'}
        </Button>
      </footer>
    </motion.div>
  );
}

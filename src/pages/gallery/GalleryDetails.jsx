import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import InfoCard from '../../components/cards/InfoCard';
import ImageGrid from '../../components/gallery/ImageGrid';
import EmptyState from '../../components/layout/EmptyState';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import { deleteGallery, getGalleryById } from '../../services/gallery/galleryApi.js';
import { formatDate } from './constants';
import './gallery.css';

export default function GalleryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getGalleryById(id)
      .then((data) => { if (active) setGallery(data); })
      .catch((err) => toast.error(err.message || 'Gallery not found.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, toast]);

  if (loading) return <p className="gallery-page__loading">Loading gallery...</p>;
  if (!gallery) {
    return (
      <EmptyState
        title="Gallery not found"
        action={<Button variant="accent" to="/dashboard/content/gallery">Back to Gallery</Button>}
      />
    );
  }

  const images = (gallery.media || [])
    .filter((m) => m.mediaType === 'IMAGE')
    .map((m) => m.imageUrl)
    .filter(Boolean);

  return (
    <motion.div className="erp-module-page gallery-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={gallery.title}
        description={gallery.category}
        actions={
          <>
            <Button variant="ghost" size="md" onClick={() => navigate('/dashboard/content/gallery')}>
              <FiArrowLeft /> Back
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/content/gallery/${id}/edit`)}>
              <FiEdit2 /> Edit
            </Button>
            <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
              <FiTrash2 /> Delete
            </Button>
          </>
        }
      />

      <div className="gallery-details__hero">
        {gallery.coverImage ? <img src={gallery.coverImage} alt={gallery.title} /> : null}
        <div className="gallery-details__hero-overlay">
          <Badge tone={gallery.status === 'PUBLISHED' ? 'success' : 'neutral'} label={gallery.status === 'PUBLISHED' ? 'Published' : 'Draft'} />
          <h1>{gallery.title}</h1>
          <p>{gallery.description}</p>
        </div>
      </div>

      <InfoCard
        title="Album Information"
        items={[
          { label: 'Category', value: gallery.category },
          { label: 'Display Order', value: gallery.displayOrder },
          { label: 'Images', value: gallery.imageCount || images.length },
          { label: 'Videos', value: gallery.videoCount || 0 },
          { label: 'Uploaded', value: formatDate(gallery.createdAt) },
        ]}
      />

      {images.length ? (
        <section className="gallery-details__grid">
          <h2>Gallery Images</h2>
          <ImageGrid images={images} columns={4} enableLightbox />
        </section>
      ) : (
        <EmptyState title="No images in this album" compact />
      )}

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteGallery(id);
            toast.success('Gallery deleted.');
            navigate('/dashboard/content/gallery');
          } catch (err) {
            toast.error(err.message || 'Failed to delete gallery.');
          }
        }}
        title="Delete Gallery Album?"
        message="This action cannot be undone."
        highlight={gallery.title}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

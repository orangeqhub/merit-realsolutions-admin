import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import FormSection from '../../components/forms/FormSection';
import { useToast } from '../../components/feedback/Toast';
import { getTestimonial } from '../../services/websiteContent/websiteContentApi.js';
import './websiteContent.css';

export default function TestimonialPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTestimonial(id)
      .then(setItem)
      .catch((err) => toast.error(err.message || 'Failed to load testimonial.'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  return (
    <div className="cms-page">
      <PageHeader
        title="Testimonial Preview"
        actions={(
          <>
            <Button variant="ghost" onClick={() => navigate('/dashboard/content/testimonials')}>
              <FiArrowLeft /> Back
            </Button>
            <Button variant="accent" onClick={() => navigate(`/dashboard/content/testimonials/${id}/edit`)}>
              <FiEdit2 /> Edit
            </Button>
          </>
        )}
      />

      <FormSection title="Website Preview" loading={loading}>
        {item && (
          <div className="cms-preview-card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {item.customerImage ? (
                <img src={item.customerImage} alt={item.customerName} width="80" height="80" style={{ borderRadius: '50%' }} />
              ) : null}
              <div>
                <div style={{ color: '#c9a227', marginBottom: '0.35rem' }}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </div>
                <blockquote style={{ margin: '0.75rem 0' }}>&ldquo;{item.testimonial}&rdquo;</blockquote>
                <strong>{item.customerName}</strong>
                <div>{item.location}</div>
                <div>{item.customerType}{item.propertyPurchased ? ` · ${item.propertyPurchased}` : ''}</div>
              </div>
            </div>
          </div>
        )}
      </FormSection>
    </div>
  );
}

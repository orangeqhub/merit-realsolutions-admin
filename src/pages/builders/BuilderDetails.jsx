import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import InfoCard from '../../components/cards/InfoCard';
import SummaryCard from '../../components/cards/SummaryCard';
import EmptyState from '../../components/layout/EmptyState';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  deleteBuilder,
  getBuilderById,
  setBuilderStatus,
} from '../../services/builder/builderApi.js';
import { formatDate } from './constants';
import './builders.css';

export default function BuilderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [builder, setBuilder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getBuilderById(id)
      .then(setBuilder)
      .catch((err) => toast.error(err.message || 'Builder not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, toast]);

  if (loading) return <p className="builders-page__loading">Loading builder...</p>;
  if (!builder) {
    return (
      <EmptyState
        title="Builder not found"
        action={<Button variant="accent" to="/dashboard/content/builders">Back to Builders</Button>}
      />
    );
  }

  const socialLinks = [
    { label: 'Facebook', value: builder.facebook },
    { label: 'Instagram', value: builder.instagram },
    { label: 'LinkedIn', value: builder.linkedin },
    { label: 'YouTube', value: builder.youtube },
  ].filter((item) => item.value);

  return (
    <motion.div className="erp-module-page builders-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={builder.builderName}
        description={builder.builderCode}
        actions={
          <>
            <Button variant="ghost" size="md" onClick={() => navigate('/dashboard/content/builders')}>
              <FiArrowLeft /> Back
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={async () => {
                try {
                  const nextStatus = builder.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                  await setBuilderStatus(builder.id, nextStatus);
                  toast.success(`Builder ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
                  load();
                } catch (err) {
                  toast.error(err.message || 'Failed to update status.');
                }
              }}
            >
              {builder.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate(`/dashboard/content/builders/${id}/edit`)}>
              <FiEdit2 /> Edit
            </Button>
            <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
              <FiTrash2 /> Delete
            </Button>
          </>
        }
      />

      <div className="builders-details__hero">
        {builder.coverImage ? <img src={builder.coverImage} alt="" /> : null}
        <div className="builders-details__hero-overlay">
          <Badge
            tone={builder.status === 'ACTIVE' ? 'success' : 'neutral'}
            label={builder.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          />
          <div className="builders-details__hero-head">
            {builder.logo ? <img src={builder.logo} alt={builder.builderName} /> : null}
            <div>
              <h1>{builder.builderName}</h1>
              <p>{builder.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="builders-details__stats">
        <SummaryCard label="Completed" value={String(builder.completedProjects || 0)} tone="success" />
        <SummaryCard label="Ongoing" value={String(builder.ongoingProjects || 0)} tone="info" />
        <SummaryCard label="Upcoming" value={String(builder.upcomingProjects || 0)} tone="warning" />
        <SummaryCard label="Experience" value={builder.yearsOfExperience != null ? `${builder.yearsOfExperience} yrs` : '—'} tone="violet" />
        <SummaryCard label="Properties" value={String(builder.propertyCount ?? 0)} tone="accent" />
      </div>

      <InfoCard
        title="Contact Information"
        items={[
          { label: 'Contact Person', value: builder.contactPerson || '—' },
          { label: 'Mobile', value: builder.mobile || '—' },
          { label: 'Email', value: builder.email || '—' },
          { label: 'Website', value: builder.website || '—' },
          { label: 'Office Address', value: builder.officeAddress || '—' },
          { label: 'RERA Number', value: builder.reraNumber || '—' },
          { label: 'Established', value: builder.establishedYear || '—' },
          { label: 'Created', value: formatDate(builder.createdAt) },
        ]}
      />

      {(builder.operatingCities || []).length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3>Operating Cities</h3>
          <div className="builders-details__cities">
            {builder.operatingCities.map((city) => (
              <span key={city} className="builders-details__city-tag">{city}</span>
            ))}
          </div>
        </section>
      )}

      {builder.about && (
        <InfoCard title="About Company" items={[{ label: 'About', value: builder.about }]} />
      )}

      {socialLinks.length > 0 && (
        <InfoCard
          title="Social Links"
          items={socialLinks.map((item) => ({ label: item.label, value: item.value }))}
        />
      )}

      {(builder.metaTitle || builder.metaDescription) && (
        <InfoCard
          title="SEO"
          items={[
            { label: 'Meta Title', value: builder.metaTitle || '—' },
            { label: 'Meta Description', value: builder.metaDescription || '—' },
          ]}
        />
      )}

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteBuilder(id);
            toast.success('Builder deleted.');
            navigate('/dashboard/content/builders');
          } catch (err) {
            toast.error(err.message || 'Failed to delete builder.');
          }
        }}
        title="Delete Builder?"
        message="Properties linked to this builder will be unassigned."
        highlight={builder.builderName}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

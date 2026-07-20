import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiExternalLink, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Badge from '../../components/ui/badge/Badge';
import DataTable from '../../components/table/DataTable';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  deleteTestimonial,
  listTestimonials,
  setTestimonialStatus,
} from '../../services/websiteContent/websiteContentApi.js';
import { CONTENT_STATUS, CUSTOMER_TYPES, formatDate } from './constants';
import './websiteContent.css';

export default function TestimonialsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', customerType: '', page: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const result = await listTestimonials({
        page: filters.page,
        pageSize: 12,
        search: filters.search || undefined,
        status: filters.status || undefined,
        customerType: filters.customerType || undefined,
      });
      setItems(result.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load testimonials.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.status, filters.customerType]);

  const toggleStatus = async (row) => {
    try {
      await setTestimonialStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTestimonial(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      toast.success('Testimonial deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete testimonial.');
    }
  };

  const columns = useMemo(() => [
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div className="cms-table__actions">
          {row.customerImage ? <img src={row.customerImage} alt="" width="36" height="36" style={{ borderRadius: '50%' }} /> : null}
          <div>
            <strong>{row.customerName}</strong>
            <div>{row.location || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'customerType', header: 'Type' },
    { key: 'rating', header: 'Rating', render: (row) => `${row.rating}/5` },
    {
      key: 'featured',
      header: 'Featured',
      render: (row) => (
        <Badge tone={row.featured ? 'success' : 'neutral'} label={row.featured ? 'Yes' : 'No'} size="sm" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'} label={row.status} size="sm" />,
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="cms-table__actions">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/testimonials/${row.id}`)}>
            <FiEye /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/testimonials/${row.id}/edit`)}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleStatus(row)}>
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      ),
    },
  ], [navigate]);

  return (
    <div className="cms-page">
      <PageHeader
        title="Testimonials"
        subtitle="Manage customer testimonials displayed on the website carousel."
        actions={(
          <>
            <Button variant="ghost" size="sm" onClick={() => window.open('/', '_blank')}>
              <FiExternalLink /> Preview Website
            </Button>
            <Button variant="accent" onClick={() => navigate('/dashboard/content/testimonials/new')}>
              <FiPlus /> Add Testimonial
            </Button>
          </>
        )}
      />

      <div className="cms-filters">
        <Input placeholder="Search testimonials" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        <Select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))} options={[{ value: '', label: 'All Status' }, ...CONTENT_STATUS]} />
        <Select value={filters.customerType} onChange={(e) => setFilters((p) => ({ ...p, customerType: e.target.value, page: 1 }))} options={[{ value: '', label: 'All Types' }, ...CUSTOMER_TYPES]} />
        <Button variant="ghost" onClick={load}>Search</Button>
      </div>

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No testimonials found." />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Testimonial"
        message={`Delete testimonial from ${deleteTarget?.customerName}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

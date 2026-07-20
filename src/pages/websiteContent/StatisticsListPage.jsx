import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Badge from '../../components/ui/badge/Badge';
import DataTable from '../../components/table/DataTable';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  deleteStatistic,
  listStatistics,
  setStatisticStatus,
} from '../../services/websiteContent/websiteContentApi.js';
import { CONTENT_STATUS, formatDate } from './constants';
import './websiteContent.css';

export default function StatisticsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const result = await listStatistics({
        page: filters.page,
        pageSize: 20,
        search: filters.search || undefined,
        status: filters.status || undefined,
      });
      setItems(result.items || []);
      setMeta(result.meta || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load statistics.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.status]);

  const toggleStatus = async (row) => {
    try {
      await setStatisticStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStatistic(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      toast.success('Statistic deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete statistic.');
    }
  };

  const columns = useMemo(() => [
    {
      key: 'displayValue',
      header: 'Counter',
      render: (row) => <strong>{row.displayValue || `${row.number}${row.suffix || ''}`}</strong>,
    },
    { key: 'title', header: 'Title' },
    { key: 'icon', header: 'Icon', render: (row) => row.icon || '—' },
    {
      key: 'websiteVisible',
      header: 'Website',
      render: (row) => (
        <Badge tone={row.websiteVisible ? 'success' : 'neutral'} label={row.websiteVisible ? 'Visible' : 'Hidden'} size="sm" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'} label={row.status} size="sm" />
      ),
    },
    { key: 'displayOrder', header: 'Order' },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="cms-table__actions">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/statistics/${row.id}/edit`)}>
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
        title="Statistics"
        subtitle="Manage homepage counters and achievement metrics."
        actions={(
          <>
            <Button variant="ghost" size="sm" onClick={() => window.open('/', '_blank')}>
              <FiExternalLink /> Preview Website
            </Button>
            <Button variant="accent" onClick={() => navigate('/dashboard/content/statistics/new')}>
              <FiPlus /> Add Statistic
            </Button>
          </>
        )}
      />

      <div className="cms-filters">
        <Input
          placeholder="Search statistics"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
        />
        <Select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
          options={[{ value: '', label: 'All Status' }, ...CONTENT_STATUS]}
        />
        <Button variant="ghost" onClick={load}>Search</Button>
      </div>

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage="No statistics found." />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Statistic"
        message={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

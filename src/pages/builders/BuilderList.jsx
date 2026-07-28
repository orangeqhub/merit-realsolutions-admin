import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiBriefcase } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Badge from '../../components/ui/badge/Badge';
import DataTable from '../../components/table/DataTable';
import EmptyState from '../../components/layout/EmptyState';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  deleteBuilder,
  listBuilders,
  setBuilderStatus,
} from '../../services/builder/builderApi.js';
import { BUILDER_STATUS, SALES_PARTNERSHIP_TYPES, formatDate } from './constants';
import './builders.css';

export default function BuilderList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', salesPartnershipType: '', page: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const result = await listBuilders({
        page: filters.page,
        pageSize: 12,
        search: filters.search || undefined,
        status: filters.status || undefined,
        salesPartnershipType: filters.salesPartnershipType || undefined,
        sort: 'name-asc',
      });
      setItems(result.items || []);
      setMeta(result.meta || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load builders.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.salesPartnershipType, filters.page]);

  const columns = useMemo(() => [
    {
      key: 'builderName',
      header: 'Builder',
      render: (row) => (
        <div className="builders-table__name">
          {row.logo ? <img src={row.logo} alt="" /> : <FiBriefcase />}
          <div>
            <strong>{row.builderName}</strong>
            <span>{row.builderCode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'cities',
      header: 'Operating Cities',
      render: (row) => (row.operatingCities || []).slice(0, 3).join(', ') || '—',
    },
    { key: 'salesPartnershipType', header: 'Sales Partnership', render: (row) => row.salesPartnershipType === 'FULL_TIME' ? 'Full Time' : row.salesPartnershipType === 'PART_TIME' ? 'Part Time' : '—' },
    {
      key: 'projects',
      header: 'Projects',
      render: (row) => `${row.completedProjects || 0} / ${row.ongoingProjects || 0} / ${row.upcomingProjects || 0}`,
    },
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
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="builders-table__actions">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/builders/${row.id}`)}>
            <FiEye /> View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/builders/${row.id}/edit`)}>
            <FiEdit2 /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                const nextStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                await setBuilderStatus(row.id, nextStatus);
                toast.success(`Builder ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
                load();
              } catch (err) {
                toast.error(err.message || 'Failed to update status.');
              }
            }}
          >
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" tone="danger" onClick={() => setDeleteTarget(row)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      ),
    },
  ], [navigate, toast]);

  return (
    <motion.div className="erp-module-page builders-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Builders Management"
        description="Manage builder profiles, contact details, and operating cities for the website directory."
        actions={
          <Button variant="accent" size="md" to="/dashboard/content/builders/new">
            <FiPlus /> Add Builder
          </Button>
        }
      />

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            type="search"
            placeholder="Search by builder name or code..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={filters.status}
            onChange={(v) => setFilters((p) => ({ ...p, status: v, page: 1 }))}
            options={[{ value: '', label: 'All Status' }, ...BUILDER_STATUS]}
            placeholder="Status"
          />
          <Select value={filters.salesPartnershipType} onChange={(v) => setFilters((p) => ({ ...p, salesPartnershipType: v, page: 1 }))} options={[{ value: '', label: 'All Sales Partnerships' }, ...SALES_PARTNERSHIP_TYPES]} placeholder="Sales Partnership" />
          <Button variant="ghost" size="md" onClick={load}>Search</Button>
        </div>
      </div>

      {loading ? (
        <p className="builders-page__loading">Loading builders...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FiBriefcase />}
          title="No builders yet"
          description="Add your first builder to populate the website directory."
          action={<Button variant="accent" to="/dashboard/content/builders/new">Add Builder</Button>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={items} rowKey="id" />
          {meta.totalPages > 1 && (
            <div className="erp-pagination">
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </Button>
              <span>Page {meta.page} of {meta.totalPages}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteBuilder(deleteTarget.id);
            toast.success('Builder deleted.');
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(err.message || 'Failed to delete builder.');
          }
        }}
        title="Delete Builder?"
        message="Properties linked to this builder will be unassigned. This action cannot be undone."
        highlight={deleteTarget?.builderName}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}

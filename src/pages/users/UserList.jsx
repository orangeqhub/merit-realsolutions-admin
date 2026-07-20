import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Badge from '../../components/ui/badge/Badge';
import DataTable from '../../components/table/DataTable';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import {
  listUsers,
  deleteUser,
  setUserStatus,
  ROLE_LABELS,
  USER_ROLES,
} from '../../services/users/userApi.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function UserList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const segment = location.pathname.split('/').pop();
  const segmentRoleMap = {
    abp: USER_ROLES.AREA_BUSINESS_PARTNER,
    abc: USER_ROLES.AREA_BUSINESS_COORDINATOR,
    abe: USER_ROLES.AREA_BUSINESS_EXECUTIVE,
    customers: USER_ROLES.CUSTOMER,
  };
  const roleFilter = segmentRoleMap[segment] || searchParams.get('role') || '';
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });

  const pageTitle = roleFilter ? ROLE_LABELS[roleFilter] || 'Users' : 'All Users';

  const load = async () => {
    setLoading(true);
    try {
      const data = await listUsers({
        page: filters.page,
        limit: 20,
        search: filters.search || undefined,
        status: filters.status || undefined,
        role: roleFilter || undefined,
      });
      setItems(data.items || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load users.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.status, roleFilter]);

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {row.employeeCode || row.username}
          </div>
        </div>
      ),
    },
    { key: 'roleLabel', header: 'Role', render: (row) => row.roleLabel || ROLE_LABELS[row.role] },
    { key: 'mobile', header: 'Mobile', render: (row) => row.mobile || '—' },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <Button variant="ghost" size="sm" iconOnly onClick={() => navigate(`/dashboard/users/${row.id}`)} title="View"><FiEye /></Button>
          <Button variant="ghost" size="sm" iconOnly onClick={() => navigate(`/dashboard/users/${row.id}/edit`)} title="Edit"><FiEdit2 /></Button>
          {row.role !== USER_ROLES.ADMIN && (
            <Button variant="ghost" size="sm" iconOnly onClick={() => setDeleteTarget(row)} title="Delete"><FiTrash2 /></Button>
          )}
        </div>
      ),
    },
  ], [navigate]);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success('User deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
      if (/not found/i.test(err.message || '')) {
        setDeleteTarget(null);
        load();
      }
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      await setUserStatus(row.id, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      toast.success('Status updated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Status update failed.');
    }
  };

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={pageTitle}
        description="Manage sales hierarchy users and customers. Credentials are generated on create."
        actions={(
          <Button variant="accent" size="md" to={`/dashboard/users/new${roleFilter ? `?role=${roleFilter}` : ''}`}>
            <FiPlus /> Create User
          </Button>
        )}
      />

      <div className="erp-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Name, mobile, username..."
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters((p) => ({ ...p, status: v, page: 1 }))}
          options={STATUS_OPTIONS}
        />
        <div style={{ alignSelf: 'flex-end' }}>
          <Button variant="outline" onClick={load}>Search</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyIcon={FiUser}
        emptyTitle="No users found"
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (page) => setFilters((p) => ({ ...p, page })),
        }}
        rowActions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => toggleActive(row)}>
            {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </motion.div>
  );
}

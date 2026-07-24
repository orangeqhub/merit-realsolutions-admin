import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/input/Input';
import Select from '../../../components/ui/select/Select';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';
import StatsCard from '../../../components/cards/StatsCard';
import DataTable from '../../../components/table/DataTable';
import { useToast } from '../../../components/feedback/Toast';
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUSES,
  listRegistrations,
  markRegistrationRegistered,
  markRegistrationSold,
  scheduleRegistration,
  updateRegistrationStatus,
} from '../../../services/finance/financeApi.js';
import { formatDate, formatINR } from '../../../utils/format';
import '../../../styles/module.css';
import './registrations.css';

const STATUS_TONE = {
  PENDING: 'warning',
  DOCUMENTS_PENDING: 'warning',
  SCHEDULED: 'info',
  IN_PROGRESS: 'info',
  REGISTERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export default function RegistrationList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    listRegistrations({ search, status: statusFilter, pageSize: 100 })
      .then((data) => setItems(data?.items || []))
      .catch((err) => toast.error(err.message || 'Failed to load registrations.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((r) => ['PENDING', 'DOCUMENTS_PENDING'].includes(r.status)).length,
    inProgress: items.filter((r) => ['SCHEDULED', 'IN_PROGRESS'].includes(r.status)).length,
    completed: items.filter((r) => ['REGISTERED', 'COMPLETED'].includes(r.status)).length,
  }), [items]);

  const run = async (id, action) => {
    setBusyId(id);
    try {
      await action();
      toast.success('Updated successfully.');
      load();
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setBusyId('');
    }
  };

  const columns = [
    { key: 'registrationNumber', header: 'Registration #' },
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'customer', header: 'Customer', render: (row) => `${row.customer || '—'} · ${row.mobile || ''}` },
    { key: 'venture', header: 'Venture' },
    { key: 'layout', header: 'Layout' },
    { key: 'plotNumber', header: 'Plot' },
    { key: 'registrationDate', header: 'Reg. Date', render: (row) => formatDate(row.registrationDate || row.scheduledAt) },
    { key: 'registrationOffice', header: 'Office', render: (row) => row.registrationOffice || '—' },
    {
      key: 'executive',
      header: 'Executive',
      render: (row) => row.registrationExecutive?.name || '—',
    },
    {
      key: 'charges',
      header: 'Charges / Stamp',
      render: (row) => `${formatINR(row.registrationCharges)} / ${formatINR(row.stampDuty)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_TONE[row.status] || 'neutral'}>
          {row.statusLabel || REGISTRATION_STATUS_LABELS[row.status] || row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" iconOnly onClick={() => navigate(`/dashboard/documents/registrations/${row.id}`)} title="View">
            <FiEye />
          </Button>
          {!['COMPLETED', 'CANCELLED', 'REGISTERED'].includes(row.status) ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => run(row.id, () => scheduleRegistration(row.id, {
                registrationOffice: row.registrationOffice || 'Sub-Registrar Office',
                scheduledAt: new Date().toISOString(),
              }))}
            >
              Schedule
            </Button>
          ) : null}
          {row.status === 'SCHEDULED' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => run(row.id, () => updateRegistrationStatus(row.id, 'IN_PROGRESS'))}
            >
              In Progress
            </Button>
          ) : null}
          {!['REGISTERED', 'COMPLETED', 'CANCELLED'].includes(row.status) ? (
            <Button
              variant="accent"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => run(row.id, () => markRegistrationRegistered(row.id))}
            >
              Mark Registered
            </Button>
          ) : null}
          {row.status === 'REGISTERED' ? (
            <Button
              variant="accent"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => run(row.id, () => markRegistrationSold(row.id))}
            >
              Mark Sold
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Registration Management"
        description="Schedule registrations, assign executives, upload documents, and mark plots sold."
        actions={<Button variant="ghost" size="md" to="/dashboard/finance">Finance Dashboard</Button>}
      />

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <StatsCard label="Total" value={stats.total} icon={<FiClock />} />
        <StatsCard label="Pending" value={stats.pending} icon={<FiAlertCircle />} />
        <StatsCard label="In Progress" value={stats.inProgress} icon={<FiClock />} />
        <StatsCard label="Completed" value={stats.completed} icon={<FiCheckCircle />} />
      </div>

      <div className="erp-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Registration, booking, customer, plot…"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All statuses' },
            ...REGISTRATION_STATUSES.map((status) => ({
              value: status,
              label: REGISTRATION_STATUS_LABELS[status],
            })),
          ]}
        />
        <div style={{ alignSelf: 'flex-end' }}>
          <Button variant="outline" onClick={load}>Search</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyTitle="No registrations found"
        emptyDescription="Registrations are created automatically when a plot booking is confirmed."
      />
    </motion.div>
  );
}

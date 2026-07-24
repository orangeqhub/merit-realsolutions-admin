import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';
import Input from '../../../components/ui/input/Input';
import Select from '../../../components/ui/select/Select';
import { useToast } from '../../../components/feedback/Toast';
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUSES,
  assignRegistrationExecutive,
  getRegistration,
  markRegistrationRegistered,
  markRegistrationSold,
  scheduleRegistration,
  updateRegistrationStatus,
  uploadRegistrationDocument,
} from '../../../services/finance/financeApi.js';
import { listSalesUsers } from '../../../services/users/userApi.js';
import { formatDate, formatINR } from '../../../utils/format';
import '../../../styles/module.css';
import './registrations.css';

const DOC_TYPES = [
  'SALE_AGREEMENT',
  'REGISTRATION_COPY',
  'AADHAAR',
  'PAN',
  'PASSPORT_PHOTO',
  'EC',
  'LEGAL',
  'TAX_RECEIPT',
  'MUTATION',
];

export default function RegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    registrationOffice: '',
    registrationDate: '',
    executiveUserId: '',
    status: '',
    remarks: '',
    documentType: 'REGISTRATION_COPY',
    title: '',
    fileUrl: '',
  });

  const load = () => {
    setLoading(true);
    getRegistration(id)
      .then((row) => {
        setData(row);
        setForm((prev) => ({
          ...prev,
          registrationOffice: row.registrationOffice || '',
          registrationDate: row.registrationDate || '',
          executiveUserId: row.executiveUserId ? String(row.executiveUserId) : '',
          status: row.status || '',
          remarks: row.remarks || '',
        }));
      })
      .catch((err) => toast.error(err.message || 'Failed to load registration.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    listSalesUsers().then((rows) => {
      const list = Array.isArray(rows) ? rows : (rows?.items || rows?.users || []);
      setExecutives(list);
    }).catch(() => setExecutives([]));
  }, [id]);

  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage || 'Updated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading registration…</p>;
  if (!data) {
    return (
      <div className="erp-module-page">
        <p>Registration not found.</p>
        <Button to="/dashboard/documents/registrations">Back</Button>
      </div>
    );
  }

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={data.registrationNumber}
        description={`${data.customer} · Booking ${data.bookingNumber || data.bookingId}`}
        actions={(
          <>
            <Button variant="ghost" size="md" to={`/dashboard/finance/ledgers/${data.bookingId}`}>View Ledger</Button>
            <Button variant="outline" size="md" to="/dashboard/documents/registrations">Back</Button>
          </>
        )}
      />

      <div className="dashboard__summary">
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Status</span><span className="dashboard__summary-value"><Badge>{data.statusLabel}</Badge></span></div>
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Venture</span><span className="dashboard__summary-value">{data.venture}</span></div>
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Layout</span><span className="dashboard__summary-value">{data.layout}</span></div>
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Plot</span><span className="dashboard__summary-value">{data.plotNumber}</span></div>
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Charges</span><span className="dashboard__summary-value">{formatINR(data.registrationCharges)}</span></div>
        <div className="dashboard__summary-item"><span className="dashboard__summary-label">Stamp Duty</span><span className="dashboard__summary-value">{formatINR(data.stampDuty)}</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        <section className="property-booking-settings">
          <h3>Schedule / Update</h3>
          <Input label="Registration Office" value={form.registrationOffice} onChange={(e) => setForm((p) => ({ ...p, registrationOffice: e.target.value }))} />
          <Input label="Registration Date" type="date" value={form.registrationDate} onChange={(e) => setForm((p) => ({ ...p, registrationDate: e.target.value }))} />
          <Select
            label="Status"
            value={form.status}
            onChange={(value) => setForm((p) => ({ ...p, status: value }))}
            options={REGISTRATION_STATUSES.map((status) => ({ value: status, label: REGISTRATION_STATUS_LABELS[status] }))}
          />
          <Input label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => scheduleRegistration(id, {
                registrationOffice: form.registrationOffice,
                registrationDate: form.registrationDate,
                remarks: form.remarks,
              }), 'Registration scheduled.')}
            >
              Schedule Registration
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => updateRegistrationStatus(id, form.status, form.remarks), 'Status updated.')}
            >
              Update Status
            </Button>
            <Button
              variant="accent"
              disabled={busy}
              onClick={() => run(() => markRegistrationRegistered(id, { remarks: form.remarks }), 'Marked registered.')}
            >
              Mark Registered
            </Button>
            <Button
              variant="accent"
              disabled={busy}
              onClick={() => run(() => markRegistrationSold(id, { remarks: form.remarks }), 'Marked sold.')}
            >
              Mark Sold
            </Button>
          </div>
        </section>

        <section className="property-booking-settings">
          <h3>Assign Executive</h3>
          <Select
            label="Registration Executive"
            value={form.executiveUserId}
            onChange={(value) => setForm((p) => ({ ...p, executiveUserId: value }))}
            options={[
              { value: '', label: 'Select executive' },
              ...executives.map((user) => ({
                value: String(user.id),
                label: `${user.name}${user.employeeCode ? ` (${user.employeeCode})` : ''}`,
              })),
            ]}
          />
          <Button
            variant="accent"
            disabled={busy || !form.executiveUserId}
            onClick={() => run(() => assignRegistrationExecutive(id, Number(form.executiveUserId)), 'Executive assigned.')}
          >
            Assign Executive
          </Button>
          <p style={{ marginTop: '0.75rem' }}>
            Current: {data.registrationExecutive?.name || 'Unassigned'}
          </p>
        </section>

        <section className="property-booking-settings">
          <h3>Upload Registration Document</h3>
          <Select
            label="Document Type"
            value={form.documentType}
            onChange={(value) => setForm((p) => ({ ...p, documentType: value }))}
            options={DOC_TYPES.map((type) => ({ value: type, label: type.replace(/_/g, ' ') }))}
          />
          <Input label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Input label="File URL" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." />
          <Button
            variant="accent"
            disabled={busy || !form.fileUrl.trim()}
            onClick={() => run(() => uploadRegistrationDocument(id, {
              documentType: form.documentType,
              title: form.title || form.documentType.replace(/_/g, ' '),
              fileUrl: form.fileUrl.trim(),
            }), 'Document uploaded.')}
          >
            Upload Document
          </Button>
        </section>
      </div>

      <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
        <h3>Documents</h3>
        {(data.documents || []).length === 0 ? <p>No documents uploaded.</p> : (
          <ul className="dashboard__activity-list">
            {data.documents.map((doc) => (
              <li key={doc.id} className="dashboard__activity-item">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="dashboard__activity-text">
                  {doc.title} · {doc.documentTypeLabel} · {formatDate(doc.createdAt)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
        <h3>Audit History</h3>
        {(data.audit || []).length === 0 ? <p>No audit events yet.</p> : (
          <ul className="dashboard__activity-list">
            {data.audit.map((item) => (
              <li key={item.id} className="dashboard__activity-item">
                <span className="dashboard__activity-text">
                  {item.action} · {formatDate(item.createdAt)} · actor #{item.actorId || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p style={{ marginTop: '1rem' }}>
        <Link to={`/dashboard/finance/ledgers/${data.bookingId}`}>Open customer financial ledger</Link>
        {' · '}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>Back</button>
      </p>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import {
  completeLifecycleFollowUp,
  createLifecycleFollowUp,
  listLifecycleFollowUps,
  listSiteVisits,
  rescheduleLifecycleFollowUp,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

const STAGE_OPTIONS = [
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'RESERVATION', label: 'Reservation' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'REGISTRATION', label: 'Registration' },
];

export default function LifecycleFollowUpsPage() {
  const toast = useToast();
  const [siteVisits, setSiteVisits] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form, setForm] = useState({
    siteVisitRequestId: '',
    stage: 'SITE_VISIT',
    followUpDate: '',
    followUpTime: '',
    notes: '',
    assigneeUserId: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [visits, followups] = await Promise.all([
        listSiteVisits(),
        listLifecycleFollowUps(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      ]);
      setSiteVisits(visits || []);
      setItems(followups || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const submit = async () => {
    if (!form.siteVisitRequestId || !form.followUpDate) {
      toast.error('Select site visit and follow-up date.');
      return;
    }
    const visit = siteVisits.find((v) => String(v.id) === String(form.siteVisitRequestId));
    try {
      await createLifecycleFollowUp({
        siteVisitRequestId: Number(form.siteVisitRequestId),
        customerUserId: visit?.customer?.id,
        propertyId: visit?.property?.id,
        assigneeUserId: form.assigneeUserId || visit?.assignee?.id,
        stage: form.stage,
        followUpDate: form.followUpDate,
        followUpTime: form.followUpTime || null,
        notes: form.notes || null,
        status: 'SCHEDULED',
      });
      toast.success('Follow-up created.');
      setForm({ siteVisitRequestId: '', stage: 'SITE_VISIT', followUpDate: '', followUpTime: '', notes: '', assigneeUserId: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create follow-up.');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeLifecycleFollowUp(id, { notes: 'Completed from admin portal.' });
      toast.success('Follow-up completed.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to complete follow-up.');
    }
  };

  const handleReschedule = async (item) => {
    const nextDate = window.prompt('New follow-up date (YYYY-MM-DD):', item.followUpDate);
    if (!nextDate) return;
    try {
      await rescheduleLifecycleFollowUp(item.id, { followUpDate: nextDate });
      toast.success('Follow-up rescheduled.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to reschedule follow-up.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Customer Follow-ups"
        description="Manage follow-ups across site visits, negotiation, booking, and registration."
      />

      <div className="partner-crm-panel">
        <h3>Create Follow-up</h3>
        <div className="partner-crm-form-grid">
          <Select
            label="Site Visit / Customer"
            required
            value={form.siteVisitRequestId}
            onChange={(v) => setForm((p) => ({ ...p, siteVisitRequestId: v }))}
            options={siteVisits.map((v) => ({
              value: String(v.id),
              label: `${v.referenceNumber} · ${v.customer?.name} · ${v.property?.title || 'Property'}`,
            }))}
            placeholder="Select site visit"
            searchable
          />
          <Select label="Stage" value={form.stage} onChange={(v) => setForm((p) => ({ ...p, stage: v }))} options={STAGE_OPTIONS} />
          <Input label="Follow-up Date" type="date" required value={form.followUpDate} onChange={(e) => setForm((p) => ({ ...p, followUpDate: e.target.value }))} />
          <Input label="Time" type="time" value={form.followUpTime} onChange={(e) => setForm((p) => ({ ...p, followUpTime: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit}>Save Follow-up</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <div className="partner-crm-actions" style={{ marginBottom: '1rem' }}>
          <Select
            label="Filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
        </div>
        {loading ? <p>Loading...</p> : (
          <table className="partner-crm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Property</th>
                <th>Stage</th>
                <th>Date</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.customer?.name || '—'}</td>
                  <td>{item.property?.title || '—'}</td>
                  <td>{item.stageLabel}</td>
                  <td>{item.followUpDate} {item.followUpTime || ''}</td>
                  <td><Badge>{item.status}</Badge></td>
                  <td>{item.assignee?.name || '—'}</td>
                  <td>
                    {item.status !== 'COMPLETED' ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleComplete(item.id)}>Complete</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReschedule(item)}>Reschedule</Button>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

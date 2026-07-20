import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import { createSalesFollowup, listSalesFollowups, listSalesLeads } from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

export default function PartnerFollowUpsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    leadId: '', followUpDate: '', followUpTime: '', notes: '', status: 'PENDING', reminderAt: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [leadResult, followups] = await Promise.all([
        listSalesLeads({ pageSize: 100 }),
        listSalesFollowups(),
      ]);
      setLeads(leadResult.items || []);
      setItems(followups || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load follow ups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.leadId || !form.followUpDate) {
      toast.error('Select lead and follow up date.');
      return;
    }
    try {
      await createSalesFollowup(form.leadId, {
        followUpDate: form.followUpDate,
        followUpTime: form.followUpTime || null,
        notes: form.notes || null,
        status: form.status,
        reminderAt: form.reminderAt || null,
      });
      toast.success('Follow up added.');
      setForm({ leadId: '', followUpDate: '', followUpTime: '', notes: '', status: 'PENDING', reminderAt: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create follow up.');
    }
  };

  const selectedLead = leads.find((l) => String(l.id) === String(form.leadId));

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Follow Ups"
        description="Track unlimited follow ups for every lead with reminders and timeline history."
      />

      <div className="partner-crm-panel">
        <h3>Add Follow Up</h3>
        <div className="partner-crm-form-grid">
          <Select label="Lead" required value={form.leadId} onChange={(v) => setForm((p) => ({ ...p, leadId: v }))} options={leads.map((l) => ({ value: String(l.id), label: `${l.name} (${l.leadCode})` }))} placeholder="Select lead" searchable />
          <Input label="Follow Up Date" type="date" required value={form.followUpDate} onChange={(e) => setForm((p) => ({ ...p, followUpDate: e.target.value }))} />
          <Input label="Time" type="time" value={form.followUpTime} onChange={(e) => setForm((p) => ({ ...p, followUpTime: e.target.value }))} />
          <Input label="Reminder At" type="datetime-local" value={form.reminderAt} onChange={(e) => setForm((p) => ({ ...p, reminderAt: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit}>Save Follow Up</Button>
          </div>
        </div>
      </div>

      {selectedLead && (
        <div className="partner-crm-panel">
          <h3>Lead Timeline — {selectedLead.name}</h3>
          <div className="partner-crm-timeline">
            <div className="partner-crm-timeline-item">
              <strong>Lead Created</strong>
              <span>{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : '—'}</span>
            </div>
            {(selectedLead.followups || items.filter((f) => f.leadId === selectedLead.id)).map((f) => (
              <div key={f.id} className="partner-crm-timeline-item">
                <strong>{f.notes || 'Follow up'}</strong>
                <span>{f.followUpDate} {f.followUpTime || ''} — {f.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="partner-crm-panel">
        <h3>All Follow Ups</h3>
        {loading ? (
          <p className="partner-crm-page__loading">Loading...</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.lead?.name || row.leadId}</td>
                    <td>{row.followUpDate}</td>
                    <td>{row.followUpTime || '—'}</td>
                    <td><Badge label={row.status} size="sm" /></td>
                    <td>{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

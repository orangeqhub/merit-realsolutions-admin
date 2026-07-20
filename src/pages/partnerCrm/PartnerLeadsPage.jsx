import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  assignSalesLead,
  createSalesLead,
  importSalesLeads,
  LEAD_STATUS_OPTIONS,
  listSalesLeads,
  updateSalesLead,
} from '../../services/sales/salesCrmApi.js';
import { useNotificationHighlight, useRecordUnavailableMessage } from '../../utils/notificationDeepLink.js';
import './partner-crm.css';

const EMPTY_LEAD = {
  name: '', mobile: '', email: '', source: 'Admin', status: 'NEW', remarks: '',
  assigneeUserId: '',
};

export default function PartnerLeadsPage() {
  const toast = useToast();
  useRecordUnavailableMessage((message) => toast.warning(message));
  const [items, setItems] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_LEAD });
  const [filters, setFilters] = useState({ search: '', status: '', assigneeUserId: '' });
  const [assignForm, setAssignForm] = useState({ leadId: '', assigneeUserId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [leadResult, users] = await Promise.all([
        listSalesLeads({
          pageSize: 100,
          search: filters.search || undefined,
          status: filters.status || undefined,
          assigneeUserId: filters.assigneeUserId || undefined,
        }),
        listSalesUsers(),
      ]);
      setItems(leadResult.items || []);
      setSalesUsers(users || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.status, filters.assigneeUserId]);

  useNotificationHighlight([items]);

  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const createLead = async () => {
    if (!form.name?.trim()) {
      toast.error('Lead name is required.');
      return;
    }
    try {
      await createSalesLead({
        ...form,
        assigneeUserId: form.assigneeUserId ? Number(form.assigneeUserId) : null,
      });
      toast.success('Lead created.');
      setForm({ ...EMPTY_LEAD });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create lead.');
    }
  };

  const importSample = async () => {
    try {
      await importSalesLeads([
        { name: 'Sample Lead 1', mobile: '9876543210', source: 'Import', status: 'NEW' },
        { name: 'Sample Lead 2', mobile: '9876543211', source: 'Import', status: 'NEW' },
      ]);
      toast.success('Sample leads imported.');
      load();
    } catch (err) {
      toast.error(err.message || 'Import failed.');
    }
  };

  const assignLead = async () => {
    if (!assignForm.leadId || !assignForm.assigneeUserId) {
      toast.error('Select lead and sales team member.');
      return;
    }
    try {
      await assignSalesLead(assignForm.leadId, {
        assigneeUserId: Number(assignForm.assigneeUserId),
      });
      toast.success('Lead assigned.');
      setAssignForm({ leadId: '', assigneeUserId: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to assign lead.');
    }
  };

  const changeStatus = async (lead, status) => {
    try {
      await updateSalesLead(lead.id, { status });
      toast.success('Lead status updated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update lead.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Leads"
        description="Create, import, assign, and track sales leads through the pipeline."
        actions={<Button variant="ghost" size="md" onClick={importSample}>Import Sample</Button>}
      />

      <div className="partner-crm-panel">
        <h3>Create Lead</h3>
        <div className="partner-crm-form-grid">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} />
          <Input label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Source" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} />
          <Select label="Assign To" value={form.assigneeUserId} onChange={(v) => setForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Optional" searchable />
          <Textarea label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} rows={2} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={createLead}>Create Lead</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Assign / Reassign Lead</h3>
        <div className="partner-crm-form-grid">
          <Select label="Lead" value={assignForm.leadId} onChange={(v) => setAssignForm((p) => ({ ...p, leadId: v }))} options={items.map((l) => ({ value: String(l.id), label: `${l.name} (${l.leadCode})` }))} placeholder="Select lead" searchable />
          <Select label="Assign To" value={assignForm.assigneeUserId} onChange={(v) => setAssignForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Select team member" searchable />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={assignLead}>Assign Lead</Button>
          </div>
        </div>
      </div>

      <div className="erp-toolbar">
        <Input type="search" placeholder="Search leads..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <Select value={filters.status} onChange={(v) => setFilters((p) => ({ ...p, status: v }))} options={[{ value: '', label: 'All Status' }, ...LEAD_STATUS_OPTIONS]} placeholder="Status" />
        <Select value={filters.assigneeUserId} onChange={(v) => setFilters((p) => ({ ...p, assigneeUserId: v }))} options={[{ value: '', label: 'All Team Members' }, ...assigneeOptions]} placeholder="Sales User" searchable />
        <Button variant="ghost" size="md" onClick={load}>Search</Button>
      </div>

      <div className="partner-crm-panel">
        {loading ? (
          <p className="partner-crm-page__loading">Loading leads...</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Assigned To</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead.id} data-highlight-id={lead.id}>
                    <td><strong>{lead.name}</strong><br /><small>{lead.leadCode}</small></td>
                    <td>{lead.mobile || lead.email || '—'}</td>
                    <td>{lead.assignee?.name || 'Unassigned'}</td>
                    <td>{lead.assignee?.roleLabel || lead.assignee?.role || '—'}</td>
                    <td><Badge label={lead.status} size="sm" /></td>
                    <td>
                      <Select value={lead.status} onChange={(v) => changeStatus(lead, v)} options={LEAD_STATUS_OPTIONS} />
                    </td>
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

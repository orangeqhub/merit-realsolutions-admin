import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import { listProperties } from '../../services/property/propertyApi.js';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  assignPropertyToSalesUser,
  listPropertyAssignments,
} from '../../services/sales/salesCrmApi.js';
import { useNotificationHighlight, useRecordUnavailableMessage } from '../../utils/notificationDeepLink.js';
import './partner-crm.css';

export default function PropertyAssignmentPage() {
  const toast = useToast();
  useRecordUnavailableMessage((message) => toast.warning(message));
  const [properties, setProperties] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ propertyId: '', assigneeUserId: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [propertyResult, salesResult, assignmentResult] = await Promise.all([
        listProperties({ pageSize: 100 }),
        listSalesUsers(),
        listPropertyAssignments({ pageSize: 50 }),
      ]);
      setProperties(propertyResult.items || []);
      setSalesUsers(salesResult || []);
      setAssignments(assignmentResult.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load property assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useNotificationHighlight([assignments]);

  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: String(p.id), label: `${p.propertyTitle} (${p.propertyCode})` })),
    [properties]
  );
  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const submit = async () => {
    if (!form.propertyId || !form.assigneeUserId) {
      toast.error('Select property and sales team member.');
      return;
    }
    setSaving(true);
    try {
      await assignPropertyToSalesUser(form.propertyId, {
        assigneeUserId: Number(form.assigneeUserId),
        notes: form.notes || null,
      });
      toast.success('Property assigned successfully.');
      setForm({ propertyId: '', assigneeUserId: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to assign property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Property Assignment"
        description="Assign properties to Area Business Partners, Coordinators, or Executives."
      />

      <div className="partner-crm-panel">
        <h3>Assign Property</h3>
        <div className="partner-crm-form-grid">
          <Select label="Property" required value={form.propertyId} onChange={(v) => setForm((p) => ({ ...p, propertyId: v }))} options={propertyOptions} placeholder="Select property" searchable />
          <Select label="Assign To" required value={form.assigneeUserId} onChange={(v) => setForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Select team member" searchable />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit} disabled={saving}>Assign Property</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Current Assignments</h3>
        {loading ? (
          <p className="partner-crm-page__loading">Loading...</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Assigned To</th>
                  <th>Role</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row) => (
                  <tr key={row.id} data-highlight-id={row.propertyId || row.property?.id}>
                    <td>{row.property?.propertyTitle || row.propertyId}</td>
                    <td>{row.assignee?.name || '—'}</td>
                    <td>{row.assignee?.roleLabel || row.assignee?.role || '—'}</td>
                    <td>{row.assignedAt ? new Date(row.assignedAt).toLocaleString() : '—'}</td>
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

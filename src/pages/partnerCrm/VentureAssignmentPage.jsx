import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  assignVentureToSalesUser,
  listVentureAssignments,
  listVentureCatalog,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

export default function VentureAssignmentPage() {
  const toast = useToast();
  const [ventures, setVentures] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ventureRef: '', assigneeUserId: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [users, assignmentRows, ventureRows] = await Promise.all([
        listSalesUsers(),
        listVentureAssignments(),
        listVentureCatalog(),
      ]);
      setSalesUsers(users || []);
      setAssignments(assignmentRows || []);
      setVentures(Array.isArray(ventureRows) ? ventureRows : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load venture assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ventureOptions = useMemo(
    () => ventures.map((v) => ({ value: v.id, label: `${v.name} (${v.code || v.id})` })),
    [ventures]
  );
  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const selectedVenture = ventures.find((v) => v.id === form.ventureRef);

  const submit = async () => {
    if (!form.ventureRef || !form.assigneeUserId || !selectedVenture) {
      toast.error('Select venture and sales team member.');
      return;
    }
    setSaving(true);
    try {
      await assignVentureToSalesUser({
        ventureRef: selectedVenture.id,
        ventureName: selectedVenture.name,
        ventureCode: selectedVenture.code || null,
        assigneeUserId: Number(form.assigneeUserId),
        notes: form.notes || null,
      });
      toast.success('Venture assigned successfully.');
      setForm({ ventureRef: '', assigneeUserId: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to assign venture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Venture Assignment"
        description="Assign complete ventures to sales team members. Assigned users see only their ventures after login."
      />

      <div className="partner-crm-panel">
        <h3>Assign Venture</h3>
        <div className="partner-crm-form-grid">
          <Select label="Venture" required value={form.ventureRef} onChange={(v) => setForm((p) => ({ ...p, ventureRef: v }))} options={ventureOptions} placeholder="Select venture" searchable />
          <Select label="Assign To" required value={form.assigneeUserId} onChange={(v) => setForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Select team member" searchable />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit} disabled={saving}>Assign Venture</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Current Venture Assignments</h3>
        {loading ? (
          <p className="partner-crm-page__loading">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="partner-crm-page__loading">No venture assignments yet.</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Venture</th>
                  <th>Assigned To</th>
                  <th>Role</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.ventureName}</td>
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

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  assignAreaToSalesUser,
  listAreaAssignments,
  unassignAreaFromSalesUser,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

export default function AreaAssignmentPage() {
  const toast = useToast();
  const [salesUsers, setSalesUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assigneeUserId: '',
    state: '',
    city: '',
    locality: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [salesResult, assignmentResult] = await Promise.all([
        listSalesUsers(),
        listAreaAssignments({ pageSize: 100 }),
      ]);
      setSalesUsers(salesResult || []);
      setAssignments(assignmentResult.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load area assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!form.assigneeUserId || !form.state.trim()) {
      toast.error('Select a sales user and enter at least a state.');
      return;
    }
    setSaving(true);
    try {
      await assignAreaToSalesUser({
        assigneeUserId: Number(form.assigneeUserId),
        state: form.state.trim(),
        city: form.city.trim() || null,
        locality: form.locality.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success('Area assigned successfully.');
      setForm({ assigneeUserId: '', state: '', city: '', locality: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to assign area.');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (id) => {
    try {
      await unassignAreaFromSalesUser(id);
      toast.success('Area assignment removed.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove area assignment.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Area Assignment"
        description="Assign geographic areas to sales team members. Company inventory in matching state, city, and locality will appear automatically on their dashboard."
      />

      <div className="partner-crm-panel" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={submit} className="partner-crm-form-grid">
          <Select
            label="Sales Team Member"
            value={form.assigneeUserId}
            onChange={(value) => setForm((prev) => ({ ...prev, assigneeUserId: value }))}
            options={[{ value: '', label: 'Select user' }, ...assigneeOptions]}
            required
          />
          <Input
            label="State"
            value={form.state}
            onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
            placeholder="Andhra Pradesh"
            required
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="Guntur"
          />
          <Input
            label="Locality"
            value={form.locality}
            onChange={(e) => setForm((prev) => ({ ...prev, locality: e.target.value }))}
            placeholder="Nehru Nagar"
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes"
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="submit" variant="primary" size="md" disabled={saving}>
              {saving ? 'Assigning…' : 'Assign Area'}
            </Button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="partner-crm-page__loading">Loading area assignments…</p>
      ) : (
        <div className="partner-crm-panel">
          {assignments.length === 0 ? (
            <p className="partner-crm-page__loading">No area assignments yet.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sales User</th>
                    <th>Area</th>
                    <th>Assigned</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.assignee?.name || item.assigneeUserId}</td>
                      <td>{item.label || [item.locality, item.city, item.state].filter(Boolean).join(', ')}</td>
                      <td>{item.assignedAt ? new Date(item.assignedAt).toLocaleString('en-IN') : '—'}</td>
                      <td>{item.notes || '—'}</td>
                      <td>
                        <Button variant="ghost" size="sm" onClick={() => removeAssignment(item.id)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

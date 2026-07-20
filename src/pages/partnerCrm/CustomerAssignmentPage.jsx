import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  assignCustomerToSalesUser,
  createSalesCustomer,
  listCustomerAssignments,
  listSalesCustomers,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

const EMPTY_CUSTOMER = { name: '', mobile: '', email: '', city: '', state: '', source: 'Admin' };

export default function CustomerAssignmentPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ ...EMPTY_CUSTOMER });
  const [form, setForm] = useState({ customerId: '', assigneeUserId: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [customerResult, users, assignmentRows] = await Promise.all([
        listSalesCustomers({ pageSize: 100 }),
        listSalesUsers(),
        listCustomerAssignments(),
      ]);
      setCustomers(customerResult.items || []);
      setSalesUsers(users || []);
      setAssignments(assignmentRows || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.customerCode})` })),
    [customers]
  );
  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const createCustomer = async () => {
    if (!newCustomer.name?.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      const created = await createSalesCustomer(newCustomer);
      toast.success('Customer created.');
      setNewCustomer({ ...EMPTY_CUSTOMER });
      await load();
      setForm((p) => ({ ...p, customerId: String(created.id) }));
    } catch (err) {
      toast.error(err.message || 'Failed to create customer.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!form.customerId || !form.assigneeUserId) {
      toast.error('Select customer and sales team member.');
      return;
    }
    setSaving(true);
    try {
      await assignCustomerToSalesUser(form.customerId, {
        assigneeUserId: Number(form.assigneeUserId),
        notes: form.notes || null,
      });
      toast.success('Customer assigned successfully.');
      setForm({ customerId: '', assigneeUserId: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to assign customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Customer Assignment"
        description="Create customers and assign them to sales team members."
      />

      <div className="partner-crm-panel">
        <h3>Add Customer</h3>
        <div className="partner-crm-form-grid">
          <Input label="Name" required value={newCustomer.name} onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Mobile" value={newCustomer.mobile} onChange={(e) => setNewCustomer((p) => ({ ...p, mobile: e.target.value }))} />
          <Input label="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} />
          <Input label="City" value={newCustomer.city} onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))} />
          <div className="partner-crm-actions form-section__full">
            <Button variant="soft" size="md" onClick={createCustomer} disabled={saving}>Create Customer</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Assign Customer</h3>
        <div className="partner-crm-form-grid">
          <Select label="Customer" required value={form.customerId} onChange={(v) => setForm((p) => ({ ...p, customerId: v }))} options={customerOptions} placeholder="Select customer" searchable />
          <Select label="Assign To" required value={form.assigneeUserId} onChange={(v) => setForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Select team member" searchable />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit} disabled={saving}>Assign Customer</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Current Customer Assignments</h3>
        {loading ? (
          <p className="partner-crm-page__loading">Loading...</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Assigned To</th>
                  <th>Role</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.customer?.name || row.customerId}</td>
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

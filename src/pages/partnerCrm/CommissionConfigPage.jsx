import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import {
  listCommissionConfigs,
  saveCommissionConfig,
  fetchCommissionReport,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

const TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount (₹)' },
];

export default function CommissionConfigPage() {
  const toast = useToast();
  const [salesUsers, setSalesUsers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    commissionType: 'PERCENTAGE',
    commissionValue: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [salesResult, configResult, reportResult] = await Promise.all([
        listSalesUsers(),
        listCommissionConfigs(),
        fetchCommissionReport(),
      ]);
      setSalesUsers(salesResult || []);
      setConfigs(configResult || []);
      setReport(reportResult || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load commission settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const userOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!form.userId || !form.commissionValue) {
      toast.error('Select a sales user and enter a commission value.');
      return;
    }
    setSaving(true);
    try {
      await saveCommissionConfig({
        userId: Number(form.userId),
        commissionType: form.commissionType,
        commissionValue: Number(form.commissionValue),
        notes: form.notes.trim() || null,
      });
      toast.success('Commission configuration saved.');
      setForm({ userId: '', commissionType: 'PERCENTAGE', commissionValue: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save commission configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Commission Configuration"
        description="Configure sales commission per employee. Commission is generated only after customer payment is completed and verified."
      />

      <div className="partner-crm-panel" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={submit} className="partner-crm-form-grid">
          <Select
            label="Sales Employee"
            value={form.userId}
            onChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}
            options={[{ value: '', label: 'Select user' }, ...userOptions]}
            required
          />
          <Select
            label="Commission Type"
            value={form.commissionType}
            onChange={(value) => setForm((prev) => ({ ...prev, commissionType: value }))}
            options={TYPE_OPTIONS}
          />
          <Input
            label={form.commissionType === 'PERCENTAGE' ? 'Percentage Value' : 'Fixed Amount (₹)'}
            type="number"
            min="0"
            step="0.01"
            value={form.commissionValue}
            onChange={(e) => setForm((prev) => ({ ...prev, commissionValue: e.target.value }))}
            placeholder={form.commissionType === 'PERCENTAGE' ? '2' : '30000'}
            required
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes"
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="submit" variant="primary" size="md" disabled={saving}>
              {saving ? 'Saving…' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </div>

      {report?.totals ? (
        <div className="partner-crm-panel" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Commission Summary</h3>
          <p>Verified transactions: {report.totals.count}</p>
          <p>Total revenue base: ₹{Number(report.totals.revenue || 0).toLocaleString('en-IN')}</p>
          <p>Total commission paid: ₹{Number(report.totals.commission || 0).toLocaleString('en-IN')}</p>
        </div>
      ) : null}

      {loading ? (
        <p className="partner-crm-page__loading">Loading commission configurations…</p>
      ) : (
        <div className="partner-crm-panel">
          <h3 style={{ marginTop: 0 }}>Active Configurations</h3>
          {configs.length === 0 ? (
            <p className="partner-crm-page__loading">No commission configurations yet.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Effective From</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((item) => (
                    <tr key={item.id}>
                      <td>{item.user?.name || item.userId}</td>
                      <td>{item.commissionType}</td>
                      <td>
                        {item.commissionType === 'PERCENTAGE'
                          ? `${item.commissionValue}%`
                          : `₹${Number(item.commissionValue).toLocaleString('en-IN')}`}
                      </td>
                      <td>{item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{item.isActive ? 'Active' : 'Inactive'}</td>
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

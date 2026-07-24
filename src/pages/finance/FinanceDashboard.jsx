import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import { useToast } from '../../components/feedback/Toast';
import {
  exportFinanceReport,
  fetchFinanceDashboard,
  fetchFinanceTracker,
  runFinanceReminders,
} from '../../services/finance/financeApi.js';
import { formatINR } from '../../utils/format';

function MiniBars({ items = [], labelKey = 'month', valueKey = 'amount', money = false }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);
  if (!items.length) return <p>No chart data yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {items.map((item) => (
        <div key={`${item[labelKey]}-${item.month || item.label || item.method || item.status}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>{item[labelKey] || item.month || item.label || item.method || item.status}</span>
            <strong>{money ? formatINR(item[valueKey]) : item[valueKey]}</strong>
          </div>
          <div style={{ height: 8, background: 'var(--surface-muted, #eef2f7)', borderRadius: 999 }}>
            <div
              style={{
                width: `${(Number(item[valueKey] || 0) / max) * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: 'var(--accent, #c9a84c)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinanceDashboard() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([fetchFinanceDashboard(), fetchFinanceTracker()])
      .then(([dash, track]) => {
        setDashboard(dash);
        setTracker(track);
      })
      .catch((err) => toast.error(err.message || 'Failed to load finance dashboard.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const cards = dashboard?.cards || {};
  const charts = dashboard?.charts || {};

  const download = async (type, format) => {
    try {
      const file = await exportFinanceReport(type, format);
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Export failed.');
    }
  };

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Finance Dashboard"
        description="Revenue, collections, registrations, and sold inventory for Phase-1 operations."
        actions={(
          <>
            <Button variant="ghost" size="md" to="/dashboard/documents/registrations">Registrations</Button>
            <Button variant="ghost" size="md" to="/dashboard/payments">Payments</Button>
            <Button variant="outline" size="md" onClick={() => download('collections', 'csv')}>Export CSV</Button>
            <Button
              variant="accent"
              size="md"
              onClick={async () => {
                try {
                  const data = await runFinanceReminders();
                  toast.success(`Reminders processed (${data.sent || 0}).`);
                } catch (err) {
                  toast.error(err.message || 'Reminder run failed.');
                }
              }}
            >
              Run Reminders
            </Button>
          </>
        )}
      />

      {loading ? <p>Loading finance dashboard…</p> : (
        <>
          <div className="dashboard__summary">
            {[
              ['Total Revenue', formatINR(cards.totalRevenue)],
              ['Collections Today', formatINR(cards.collectionsToday)],
              ['Collections This Month', formatINR(cards.collectionsThisMonth)],
              ['Outstanding Amount', formatINR(cards.outstandingAmount)],
              ['Pending Registrations', cards.pendingRegistrations ?? 0],
              ['Completed Registrations', cards.completedRegistrations ?? 0],
              ['Sold Plots', cards.soldPlots ?? 0],
              ['Unsold Inventory', cards.unsoldInventory ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="dashboard__summary-item">
                <span className="dashboard__summary-label">{label}</span>
                <span className="dashboard__summary-value">{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <section className="property-booking-settings">
              <h3>Monthly Revenue</h3>
              <MiniBars items={charts.monthlyRevenue || []} money />
            </section>
            <section className="property-booking-settings">
              <h3>Collection Trend</h3>
              <MiniBars items={charts.collectionTrend || []} valueKey="count" />
            </section>
            <section className="property-booking-settings">
              <h3>Payment Method Breakdown</h3>
              <MiniBars items={charts.paymentMethodBreakdown || []} labelKey="method" money />
            </section>
            <section className="property-booking-settings">
              <h3>Pending vs Paid</h3>
              <MiniBars items={charts.pendingVsPaid || []} labelKey="label" valueKey="value" />
            </section>
            <section className="property-booking-settings">
              <h3>Registration Status</h3>
              <MiniBars items={charts.registrationStatus || []} labelKey="label" valueKey="count" />
            </section>
          </div>

          <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <h3>Recent Collections</h3>
              <Link to="/dashboard/finance/tracker">Open payment tracker</Link>
            </div>
            {(tracker?.recentCollections || []).length === 0 ? <p>No collections yet.</p> : (
              <ul className="dashboard__activity-list">
                {tracker.recentCollections.map((row) => (
                  <li key={row.id} className="dashboard__activity-item">
                    <span className="dashboard__activity-text">
                      {row.bookingNumber} · {row.customerName} · {formatINR(row.amount)} · {row.paymentMethod || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}

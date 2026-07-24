import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Input from '../../components/ui/input/Input';
import Button from '../../components/ui/button/Button';
import { useToast } from '../../components/feedback/Toast';
import { fetchFinanceTracker, listInstallments, recordInstallmentPayment } from '../../services/finance/financeApi.js';
import { formatINR, formatDate } from '../../utils/format';

export default function FinanceTracker() {
  const toast = useToast();
  const [tracker, setTracker] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchFinanceTracker(filters),
      listInstallments({ limit: 100 }),
    ])
      .then(([track, installmentData]) => {
        setTracker(track);
        setInstallments(installmentData?.items || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load tracker.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const metrics = tracker?.metrics || {};

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payment Tracker"
        description="Track collections, overdue installments, and expected revenue."
        actions={<Button variant="ghost" size="md" to="/dashboard/finance">Finance Dashboard</Button>}
      />

      <div className="erp-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Input label="From" type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
        <Input label="To" type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
        <div style={{ alignSelf: 'flex-end' }}>
          <Button variant="outline" onClick={load}>Apply Filters</Button>
        </div>
      </div>

      {loading ? <p>Loading tracker…</p> : (
        <>
          <div className="dashboard__summary">
            {[
              ["Today's Collections", formatINR(metrics.todaysCollections)],
              ['Weekly Collections', formatINR(metrics.weeklyCollections)],
              ['Monthly Collections', formatINR(metrics.monthlyCollections)],
              ['Pending Payments', metrics.pendingPayments ?? 0],
              ['Overdue Payments', metrics.overduePayments ?? 0],
              ['Expected Collections', formatINR(metrics.expectedCollections)],
              ['Registration Charges Collected', formatINR(metrics.registrationChargesCollected)],
              ['Total Revenue', formatINR(metrics.totalRevenue)],
            ].map(([label, value]) => (
              <div key={label} className="dashboard__summary-item">
                <span className="dashboard__summary-label">{label}</span>
                <span className="dashboard__summary-value">{value}</span>
              </div>
            ))}
          </div>

          <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
            <h3>Installment Schedule</h3>
            {installments.length === 0 ? <p>No installments found.</p> : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Receipt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((row) => (
                      <tr key={row.id}>
                        <td>{row.installmentNumber}</td>
                        <td>
                          <Link to={`/dashboard/finance/ledgers/${row.bookingId}`}>{row.bookingNumber || row.bookingId}</Link>
                        </td>
                        <td>{row.customerName || '—'}</td>
                        <td>{formatDate(row.dueDate)}</td>
                        <td>{formatINR(row.amount)}</td>
                        <td>{formatINR(row.paidAmount)}</td>
                        <td>{formatINR(row.pendingAmount)}</td>
                        <td>{row.status}</td>
                        <td>{row.receiptNumber || '—'}</td>
                        <td>
                          {!['PAID', 'CANCELLED'].includes(row.status) ? (
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={busyId === row.id}
                              onClick={async () => {
                                setBusyId(row.id);
                                try {
                                  await recordInstallmentPayment(row.id, {
                                    amount: row.pendingAmount || row.amount,
                                    paymentMethod: 'CASH',
                                  });
                                  toast.success('Payment recorded.');
                                  load();
                                } catch (err) {
                                  toast.error(err.message || 'Payment failed.');
                                } finally {
                                  setBusyId('');
                                }
                              }}
                            >
                              Record Payment
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
}

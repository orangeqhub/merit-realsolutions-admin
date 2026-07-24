import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import { useToast } from '../../components/feedback/Toast';
import { fetchLedger, fetchReceipt, recordInstallmentPayment } from '../../services/finance/financeApi.js';
import { formatINR, formatDate } from '../../utils/format';

export default function CustomerLedgerPage() {
  const { bookingId } = useParams();
  const toast = useToast();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    fetchLedger(bookingId)
      .then(setLedger)
      .catch((err) => toast.error(err.message || 'Failed to load ledger.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [bookingId]);

  if (loading) return <p>Loading ledger…</p>;
  if (!ledger) return <p>Ledger unavailable.</p>;

  const summary = ledger.summary || {};

  const openReceipt = async (paymentId) => {
    try {
      const data = await fetchReceipt(paymentId, 'html');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data.html);
        win.document.close();
      }
    } catch (err) {
      toast.error(err.message || 'Unable to open receipt.');
    }
  };

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Ledger · ${ledger.booking?.bookingNumber || bookingId}`}
        description={`${ledger.booking?.customerName || 'Customer'} · ${ledger.plot?.plotNumber || ledger.plot?.plotRef || 'Plot'}`}
        actions={(
          <>
            <Button variant="ghost" size="md" to="/dashboard/finance/tracker">Installments</Button>
            <Button variant="outline" size="md" to="/dashboard/documents/registrations">Registrations</Button>
          </>
        )}
      />

      <div className="dashboard__summary">
        {[
          ['Agreement Value', formatINR(summary.agreementValue)],
          ['Advance Paid', formatINR(summary.advancePaid)],
          ['Installments Paid', formatINR(summary.installmentsPaid)],
          ['Pending Installments', formatINR(summary.pendingInstallments)],
          ['Registration Charges', formatINR(summary.registrationCharges)],
          ['GST', formatINR(summary.gst)],
          ['Discount', formatINR(summary.discount)],
          ['Other Charges', formatINR(summary.otherCharges)],
          ['Late Fee', formatINR(summary.lateFee)],
          ['Total Paid', formatINR(summary.totalPaid)],
          ['Outstanding Balance', formatINR(summary.outstandingBalance)],
          ['Payment Completion %', `${summary.paymentCompletionPct ?? 0}%`],
        ].map(([label, value]) => (
          <div key={label} className="dashboard__summary-item">
            <span className="dashboard__summary-label">{label}</span>
            <span className="dashboard__summary-value">{value}</span>
          </div>
        ))}
      </div>

      <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
        <h3>Installments</h3>
        {(ledger.installments || []).length === 0 ? <p>No installment schedule.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Paid Date</th>
                <th>Method</th>
                <th>Receipt</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ledger.installments.map((row) => (
                <tr key={row.id}>
                  <td>{row.installmentNumber}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>{formatINR(row.amount)}</td>
                  <td>{formatINR(row.paidAmount)}</td>
                  <td>{formatINR(row.pendingAmount)}</td>
                  <td>{formatDate(row.paidDate)}</td>
                  <td>{row.paymentMethod || '—'}</td>
                  <td>
                    {row.paymentId ? (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => openReceipt(row.paymentId)}>
                        {row.receiptNumber || 'View'}
                      </button>
                    ) : (row.receiptNumber || '—')}
                  </td>
                  <td>{row.status}</td>
                  <td>
                    {ledger.canEdit && !['PAID', 'CANCELLED'].includes(row.status) ? (
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
                            toast.success('Payment recorded & receipt generated.');
                            load();
                          } catch (err) {
                            toast.error(err.message || 'Failed.');
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
        )}
      </section>

      <section className="property-booking-settings" style={{ marginTop: '1.25rem' }}>
        <h3>Transaction History</h3>
        {(ledger.transactions || []).length === 0 ? <p>No transactions yet.</p> : (
          <ul className="dashboard__activity-list">
            {ledger.transactions.map((tx) => (
              <li key={tx.id} className="dashboard__activity-item">
                <span className="dashboard__activity-text">
                  {formatDate(tx.date || tx.createdAt)} · {tx.title} · {formatINR(tx.amount)} · {tx.status}
                  {tx.receiptNumber ? ` · ${tx.receiptNumber}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ledger.registration ? (
        <p style={{ marginTop: '1rem' }}>
          Registration: <Link to={`/dashboard/documents/registrations/${ledger.registration.id}`}>{ledger.registration.registrationNumber}</Link>
          {' · '}
          {ledger.registration.statusLabel}
        </p>
      ) : null}
    </motion.div>
  );
}

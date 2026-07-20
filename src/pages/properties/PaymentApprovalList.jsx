import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import { useToast } from '../../components/feedback/Toast';
import { listPendingPayments } from '../../services/booking/installmentPaymentApi.js';
import { formatINR } from '../../utils/format';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-IN') : '—';
}

export default function PaymentApprovalList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await listPendingPayments({ pageSize: 100 });
      setItems(result?.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load pending payments.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payment Approvals"
        description="Review and approve cash, bank transfer, and cheque installment payments."
        actions={<Button variant="ghost" size="sm" onClick={load}>Refresh</Button>}
      />

      {loading && <p>Loading pending payments...</p>}
      {!loading && items.length === 0 && (
        <p className="property-enquiry-card">No payments pending approval.</p>
      )}

      <div className="property-enquiry-list">
        {items.map((item) => (
          <article key={item.id} className="property-enquiry-card">
            <div className="property-enquiry-card__main">
              <div className="property-enquiry-card__header">
                <h3>{item.paymentNumber}</h3>
                <Badge tone="warning">{item.status}</Badge>
              </div>
              <p><strong>{item.booking?.customerName}</strong> · {item.booking?.mobile}</p>
              <p>Booking: {item.booking?.bookingNumber} · {item.property?.title || 'Property'}</p>
              <p>Amount: {formatINR(item.amount)} · Method: {item.paymentMethod}</p>
              <p>Reference: {item.transactionReference || '—'}</p>
              <p>Submitted: {formatDate(item.createdAt)}</p>
            </div>
            <div className="property-enquiry-card__actions">
              <Button size="sm" to={`/dashboard/property-payments/${item.id}`}>Review</Button>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}

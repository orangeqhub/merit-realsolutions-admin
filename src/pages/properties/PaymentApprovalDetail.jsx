import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import {
  approvePayment,
  getPaymentDetail,
  rejectPayment,
} from '../../services/booking/installmentPaymentApi.js';
import { formatINR } from '../../utils/format';
import { API_BASE_URL } from '../../config/api.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-IN') : '—';
}

export default function PaymentApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDetail(await getPaymentDetail(id));
    } catch (err) {
      toast.error(err.message || 'Failed to load payment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    setSaving(true);
    try {
      await approvePayment(id, remarks);
      toast.success('Payment approved.');
      navigate('/dashboard/property-payments');
    } catch (err) {
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!remarks.trim()) {
      toast.error('Remarks are required when rejecting a payment.');
      return;
    }
    setSaving(true);
    try {
      await rejectPayment(id, remarks);
      toast.success('Payment rejected.');
      navigate('/dashboard/property-payments');
    } catch (err) {
      toast.error(err.message || 'Failed to reject payment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="erp-module-page"><p>Loading payment...</p></div>;
  }

  if (!detail) {
    return (
      <div className="erp-module-page">
        <p>Payment not found.</p>
        <Link to="/dashboard/property-payments">Back to approvals</Link>
      </div>
    );
  }

  const { booking, property } = detail;

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Review Payment ${detail.paymentNumber}`}
        description="Verify payment details and proof before approval."
        actions={
          <Button variant="ghost" size="sm" to="/dashboard/property-payments">
            Back to list
          </Button>
        }
      />

      <section className="property-booking-settings">
        <h3>Customer Details</h3>
        <p><strong>{booking?.customerName}</strong></p>
        <p>{booking?.mobile} · {booking?.email || '—'}</p>
      </section>

      <section className="property-booking-settings">
        <h3>Property & Booking</h3>
        <p>{property?.title || 'Property'} ({property?.code || '—'})</p>
        <p>Booking: {booking?.bookingNumber} · Status: <Badge>{booking?.status}</Badge></p>
        <p>Property Price: {formatINR(booking?.propertyPrice)} · Paid: {formatINR(booking?.totalPaid)} · Remaining: {formatINR(booking?.remainingBalance)}</p>
        <p>Reservation Expiry: {formatDate(booking?.reservationExpiresAt)}</p>
      </section>

      <section className="property-booking-settings">
        <h3>Payment Details</h3>
        <p>Amount: {formatINR(detail.amount)}</p>
        <p>Method: {detail.paymentMethod}</p>
        <p>Status: <Badge tone="warning">{detail.status}</Badge></p>
        <p>Transaction Reference: {detail.transactionReference || '—'}</p>
        <p>Submitted: {formatDate(detail.createdAt)}</p>
        {detail.proofOfPaymentUrl ? (
          <p>
            Proof:{' '}
            <a href={`${API_BASE_URL}${detail.proofOfPaymentUrl}`} target="_blank" rel="noreferrer">
              View uploaded proof
            </a>
          </p>
        ) : null}
      </section>

      <section className="property-booking-settings">
        <h3>Admin Remarks</h3>
        <textarea
          rows={4}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add approval or rejection remarks"
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="accent" onClick={approve} disabled={saving || detail.status !== 'PENDING_APPROVAL'}>
            Approve Payment
          </Button>
          <Button variant="ghost" onClick={reject} disabled={saving || detail.status !== 'PENDING_APPROVAL'}>
            Reject Payment
          </Button>
        </div>
      </section>
    </motion.div>
  );
}

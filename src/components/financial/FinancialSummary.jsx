import { formatINR } from '../../utils/format';

function SummaryRow({ label, value, highlight }) {
  return (
    <div className={`dashboard__summary-item${highlight ? ' dashboard__summary-item--highlight' : ''}`}>
      <span className="dashboard__summary-label">{label}</span>
      <span className="dashboard__summary-value">{value}</span>
    </div>
  );
}

export default function FinancialSummary({
  summary,
  reservation,
  booking,
  compact = false,
}) {
  if (!summary) return null;

  const rows = [
    { label: 'Property Price', value: formatINR(summary.propertyPrice) },
    { label: 'Approved Payments', value: formatINR(summary.totalPaid ?? summary.approvedPaymentsTotal ?? 0) },
    { label: 'Pending Approval', value: formatINR(summary.pendingApprovalTotal ?? 0) },
    { label: 'Rejected Payments', value: formatINR(summary.rejectedPaymentsTotal ?? 0) },
    { label: 'Remaining Balance', value: formatINR(summary.remainingBalance), highlight: true },
    { label: 'Payment Progress', value: `${summary.progressPercent ?? 0}%` },
  ];

  if (booking) {
    rows.push(
      { label: 'Booking Status', value: booking.bookingStatus || booking.status || '—' },
      { label: 'Payment Status', value: booking.paymentStatus || '—' }
    );
  }

  if (reservation && !compact) {
    rows.push(
      { label: 'Reservation Status', value: reservation.status || '—' },
      { label: 'Expiry Date', value: reservation.expiryDate ? new Date(reservation.expiryDate).toLocaleDateString('en-IN') : '—' },
      { label: 'Days Remaining', value: reservation.daysRemaining != null ? String(reservation.daysRemaining) : '—' }
    );
  }

  return (
    <div className="dashboard__summary">
      {rows.map((row) => (
        <SummaryRow key={row.label} label={row.label} value={row.value} highlight={row.highlight} />
      ))}
    </div>
  );
}

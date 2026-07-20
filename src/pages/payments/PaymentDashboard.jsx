import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../components/feedback/Toast";
import { getAdminDashboard } from "../../services/admin/adminDashboardApi.js";
import { listPayments } from "../../services/booking/installmentPaymentApi.js";
import { formatINR } from "../../utils/format";

export default function PaymentDashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminDashboard(), listPayments({ pageSize: 8 })])
      .then(([dashboard, payments]) => {
        setMetrics(dashboard?.payments);
        setRecent(payments?.items || []);
      })
      .catch((err) => toast.error(err.message || "Failed to load payments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payments"
        description="Installment payments synced from the production payment workflow."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/payments/list">All payments</Button>
            <Button variant="accent" size="md" to="/dashboard/property-payments">Pending approvals</Button>
          </>
        }
      />

      {loading ? <p>Loading payment metrics...</p> : (
        <>
          <div className="dashboard__summary">
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Today's Collections</span><span className="dashboard__summary-value">{formatINR(metrics?.todaysCollections ?? 0)}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Monthly Collections</span><span className="dashboard__summary-value">{formatINR(metrics?.monthlyCollections ?? 0)}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Pending Approval</span><span className="dashboard__summary-value">{metrics?.pendingApproval ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Approved Payments</span><span className="dashboard__summary-value">{metrics?.approvedPayments ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Collected Revenue</span><span className="dashboard__summary-value">{formatINR(metrics?.totalRevenue ?? 0)}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Outstanding</span><span className="dashboard__summary-value">{formatINR(metrics?.outstandingBalance ?? 0)}</span></div>
          </div>

          <section className="property-booking-settings">
            <h3>Recent Payments</h3>
            {recent.length === 0 ? <p>No payments yet.</p> : (
              <ul className="dashboard__activity-list">
                {recent.map((payment) => (
                  <li key={payment.id} className="dashboard__activity-item">
                    <Link to={`/dashboard/payments/${payment.id}`} className="dashboard__activity-text">
                      {payment.paymentNumber} · {payment.booking?.bookingNumber} · {formatINR(payment.amount)} · {payment.status}
                    </Link>
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

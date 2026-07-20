import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useToast } from "../../components/feedback/Toast";
import { listPayments } from "../../services/booking/installmentPaymentApi.js";
import { formatINR } from "../../utils/format";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function PaymentList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    setLoading(true);
    listPayments({ pageSize: 100, ...(statusFilter ? { status: statusFilter } : {}) })
      .then((result) => setItems(result?.items || []))
      .catch((err) => {
        toast.error(err.message || "Failed to load payments.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="All Payments"
        description="Installment payments from the production payment service."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/payments">Dashboard</Button>
            <Button variant="ghost" size="md" onClick={load}>Refresh</Button>
            <Button variant="accent" size="md" to="/dashboard/property-payments">Pending approvals</Button>
          </>
        }
      />

      <div className="property-booking-settings">
        <label>
          Status{" "}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SUCCESS">Success</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
      </div>

      {loading && <p>Loading payments...</p>}
      {!loading && (
        <div className="dashboard__table-wrap">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Booking</th>
                <th>Customer</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Installment</th>
                <th>Receipt</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((payment) => (
                <tr key={payment.id} role="button" tabIndex={0} onClick={() => navigate(`/dashboard/payments/${payment.id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/dashboard/payments/${payment.id}`)}>
                  <td>{payment.paymentNumber}</td>
                  <td>{payment.booking?.bookingNumber}</td>
                  <td>{payment.booking?.customerName}</td>
                  <td>{payment.property?.title || "—"}</td>
                  <td>{formatINR(payment.amount)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.installmentNumber ?? "—"}</td>
                  <td>{payment.receiptNumber || "—"}</td>
                  <td><Badge>{payment.status}</Badge></td>
                  <td>{formatDate(payment.approvedAt || payment.paidAt || payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

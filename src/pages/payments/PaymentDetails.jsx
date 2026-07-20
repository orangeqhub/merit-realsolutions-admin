import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import FinancialSummary from "../../components/financial/FinancialSummary.jsx";
import { useToast } from "../../components/feedback/Toast";
import {
  approvePayment,
  getPaymentDetail,
  rejectPayment,
  downloadPaymentReceipt,
  printPaymentReceipt,
} from "../../services/booking/installmentPaymentApi.js";
import { getBookingDetail } from "../../services/booking/bookingApi.js";
import { formatINR } from "../../utils/format";
import { API_BASE_URL } from "../../config/api.js";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function PaymentDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const payment = await getPaymentDetail(id);
      setDetail(payment);
      if (payment?.booking?.id) {
        const bookingDetail = await getBookingDetail(payment.booking.id);
        setSummary(bookingDetail);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load payment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    setSaving(true);
    try {
      await approvePayment(id, remarks);
      toast.success("Payment approved.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to approve payment.");
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!remarks.trim()) {
      toast.error("Remarks are required when rejecting a payment.");
      return;
    }
    setSaving(true);
    try {
      await rejectPayment(id, remarks);
      toast.success("Payment rejected.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to reject payment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="erp-module-page"><p>Loading payment...</p></div>;
  if (!detail) return <div className="erp-module-page"><p>Payment not found.</p></div>;

  const { booking, property } = detail;
  const isPending = detail.status === "PENDING_APPROVAL";
  const isApproved = detail.status === "APPROVED" || detail.status === "SUCCESS";

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Payment ${detail.paymentNumber}`}
        description={`${booking?.bookingNumber} · ${property?.title || "Property"}`}
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/payments/list">Back</Button>
            {isApproved && (
              <>
                <Button variant="ghost" size="md" onClick={() => printPaymentReceipt(detail.id)}>Print receipt</Button>
                <Button variant="ghost" size="md" onClick={async () => {
                  const file = await downloadPaymentReceipt(detail.id);
                  const blob = new Blob([file.text], { type: file.contentType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = file.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>Download</Button>
                <Button variant="ghost" size="md" to={`/dashboard/receipts/${detail.id}`}>View receipt</Button>
              </>
            )}
          </>
        }
      />

      <section className="property-booking-settings">
        <h3>Payment Details</h3>
        <p>Amount: {formatINR(detail.amount)} · Method: {detail.paymentMethod}</p>
        <p>Status: <Badge tone={isPending ? "warning" : "success"}>{detail.status}</Badge></p>
        <p>Installment #: {detail.installmentNumber ?? "—"} · Receipt: {detail.receiptNumber || "—"}</p>
        <p>Reference: {detail.transactionReference || "—"}</p>
        <p>Approved by: {detail.approvedBy?.name || "—"} · Date: {formatDate(detail.approvedAt || detail.paidAt)}</p>
        <p>Remaining balance: {formatINR(booking?.remainingBalance)}</p>
        {detail.proofOfPaymentUrl && (
          <p><a href={`${API_BASE_URL.replace('/api', '')}${detail.proofOfPaymentUrl}`} target="_blank" rel="noreferrer">View payment proof</a></p>
        )}
      </section>

      {summary && (
        <section className="property-booking-settings">
          <h3>Booking Financial Summary</h3>
          <FinancialSummary
            summary={summary.financialSummary}
            reservation={summary.reservation}
            booking={summary.booking}
            compact
          />
          <Button variant="ghost" size="sm" to={`/dashboard/property-bookings/${booking?.id}`}>Open booking details</Button>
        </section>
      )}

      {isPending && (
        <section className="property-booking-settings">
          <h3>Approval Actions</h3>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Admin remarks" rows={3} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
            <Button variant="accent" size="md" disabled={saving} onClick={approve}>Approve</Button>
            <Button variant="ghost" size="md" disabled={saving} onClick={reject}>Reject</Button>
          </div>
        </section>
      )}
    </motion.div>
  );
}

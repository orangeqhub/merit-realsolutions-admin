import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../components/feedback/Toast";
import {
  getPaymentDetail,
  downloadPaymentReceipt,
  printPaymentReceipt,
} from "../../services/booking/installmentPaymentApi.js";
import { formatINR } from "../../utils/format";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export default function ReceiptDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPaymentDetail(id),
      downloadPaymentReceipt(id, "html").catch(() => null),
    ])
      .then(([payment, receiptFile]) => {
        setDetail(payment);
        setPreviewHtml(receiptFile?.text || "");
      })
      .catch((err) => toast.error(err.message || "Failed to load receipt."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="erp-module-page"><p>Loading receipt...</p></div>;
  if (!detail) return <div className="erp-module-page"><p>Receipt not found.</p></div>;

  const { booking, property } = detail;

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Receipt ${detail.receiptNumber || detail.paymentNumber}`}
        description={`${booking?.customerName} · ${property?.title || "Property"}`}
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/receipts">Back</Button>
            <Button variant="ghost" size="md" onClick={() => printPaymentReceipt(detail.id)}>Print</Button>
            <Button variant="ghost" size="md" onClick={async () => {
              const file = await downloadPaymentReceipt(detail.id, "html");
              const blob = new Blob([file.text], { type: file.contentType });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = file.filename;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download</Button>
            <Button variant="accent" size="md" onClick={async () => {
              await downloadPaymentReceipt(detail.id, "html");
              toast.success("Receipt regenerated from latest payment data.");
              const file = await downloadPaymentReceipt(detail.id, "html");
              setPreviewHtml(file.text);
            }}>Regenerate</Button>
          </>
        }
      />

      <section className="property-booking-settings">
        <p>Customer: {booking?.customerName}</p>
        <p>Booking: <Link to={`/dashboard/property-bookings/${booking?.id}`}>{booking?.bookingNumber}</Link></p>
        <p>Property: {property?.title}</p>
        <p>Installment: {detail.installmentNumber ?? "—"} · Amount: {formatINR(detail.amount)}</p>
        <p>Payment: <Link to={`/dashboard/payments/${detail.id}`}>{detail.paymentNumber}</Link></p>
        <p>Approved: {formatDate(detail.approvedAt || detail.paidAt)} by {detail.approvedBy?.name || "System"}</p>
      </section>

      {previewHtml ? (
        <section className="property-booking-settings receipts-details__mock">
          <h3>Receipt Preview</h3>
          <iframe title="Receipt preview" srcDoc={previewHtml} style={{ width: "100%", minHeight: "720px", border: "1px solid #ddd" }} />
        </section>
      ) : (
        <p>Receipt preview unavailable for this payment status.</p>
      )}
    </motion.div>
  );
}

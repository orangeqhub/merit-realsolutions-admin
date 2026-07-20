import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";

export default function PaymentCollect() {
  return (
    <div className="erp-module-page">
      <PageHeader
        title="Collect Payment"
        description="Manual installment collection happens through the customer portal or website checkout."
      />
      <p>Cash, bank transfer, and cheque payments are submitted by customers and appear under pending approvals.</p>
      <p>Razorpay payments are recorded automatically when verified by the gateway.</p>
      <Button variant="accent" size="md" to="/dashboard/property-payments">Review pending payments</Button>
      <Button variant="ghost" size="md" to="/dashboard/payments/list">View all payments</Button>
    </div>
  );
}

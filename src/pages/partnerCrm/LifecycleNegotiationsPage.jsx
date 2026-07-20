import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import { useToast } from '../../components/feedback/Toast';
import {
  createLifecycleNegotiation,
  listLifecycleNegotiations,
  listSiteVisits,
  updateLifecycleNegotiation,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

export default function LifecycleNegotiationsPage() {
  const toast = useToast();
  const [siteVisits, setSiteVisits] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    siteVisitRequestId: '',
    listPrice: '',
    negotiationAmount: '',
    discount: '',
    finalPrice: '',
    expectedClosingDate: '',
    customerDecision: 'PENDING',
    negotiationNotes: '',
    salesRemarks: '',
    customerVisibleNotes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [visits, negotiations] = await Promise.all([
        listSiteVisits(),
        listLifecycleNegotiations(),
      ]);
      setSiteVisits(visits || []);
      setItems(negotiations || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load negotiations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.siteVisitRequestId) {
      toast.error('Select a site visit.');
      return;
    }
    const visit = siteVisits.find((v) => String(v.id) === String(form.siteVisitRequestId));
    try {
      await createLifecycleNegotiation({
        siteVisitRequestId: Number(form.siteVisitRequestId),
        customerUserId: visit?.customer?.id,
        propertyId: visit?.property?.id,
        assigneeUserId: visit?.assignee?.id,
        listPrice: form.listPrice ? Number(form.listPrice) : visit?.property?.price,
        negotiationAmount: form.negotiationAmount ? Number(form.negotiationAmount) : null,
        discount: form.discount ? Number(form.discount) : 0,
        finalPrice: form.finalPrice ? Number(form.finalPrice) : null,
        expectedClosingDate: form.expectedClosingDate || null,
        customerDecision: form.customerDecision,
        negotiationNotes: form.negotiationNotes || null,
        salesRemarks: form.salesRemarks || null,
        customerVisibleNotes: form.customerVisibleNotes || null,
      });
      toast.success('Negotiation saved.');
      setForm({
        siteVisitRequestId: '',
        listPrice: '',
        negotiationAmount: '',
        discount: '',
        finalPrice: '',
        expectedClosingDate: '',
        customerDecision: 'PENDING',
        negotiationNotes: '',
        salesRemarks: '',
        customerVisibleNotes: '',
      });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save negotiation.');
    }
  };

  const handleDecision = async (item, decision) => {
    try {
      await updateLifecycleNegotiation(item.id, { customerDecision: decision });
      toast.success('Customer decision updated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update negotiation.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Negotiations"
        description="Manage negotiation amounts, discounts, and customer decisions synced to customer timeline."
      />

      <div className="partner-crm-panel">
        <h3>New / Update Negotiation</h3>
        <div className="partner-crm-form-grid">
          <Select
            label="Site Visit / Customer"
            required
            value={form.siteVisitRequestId}
            onChange={(v) => setForm((p) => ({ ...p, siteVisitRequestId: v }))}
            options={siteVisits.map((v) => ({
              value: String(v.id),
              label: `${v.referenceNumber} · ${v.customer?.name}`,
            }))}
            placeholder="Select site visit"
            searchable
          />
          <Input label="List Price" type="number" value={form.listPrice} onChange={(e) => setForm((p) => ({ ...p, listPrice: e.target.value }))} />
          <Input label="Negotiation Amount" type="number" value={form.negotiationAmount} onChange={(e) => setForm((p) => ({ ...p, negotiationAmount: e.target.value }))} />
          <Input label="Discount" type="number" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} />
          <Input label="Final Price" type="number" value={form.finalPrice} onChange={(e) => setForm((p) => ({ ...p, finalPrice: e.target.value }))} />
          <Input label="Expected Closing Date" type="date" value={form.expectedClosingDate} onChange={(e) => setForm((p) => ({ ...p, expectedClosingDate: e.target.value }))} />
          <Select
            label="Customer Decision"
            value={form.customerDecision}
            onChange={(v) => setForm((p) => ({ ...p, customerDecision: v }))}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'COUNTER', label: 'Counter Offer' },
            ]}
          />
          <Textarea label="Negotiation Notes" value={form.negotiationNotes} onChange={(e) => setForm((p) => ({ ...p, negotiationNotes: e.target.value }))} rows={2} className="form-section__full" />
          <Textarea label="Sales Remarks" value={form.salesRemarks} onChange={(e) => setForm((p) => ({ ...p, salesRemarks: e.target.value }))} rows={2} />
          <Textarea label="Customer Visible Notes" value={form.customerVisibleNotes} onChange={(e) => setForm((p) => ({ ...p, customerVisibleNotes: e.target.value }))} rows={2} />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit}>Save Negotiation</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Negotiation History</h3>
        {loading ? <p>Loading...</p> : (
          <table className="partner-crm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Property</th>
                <th>Final Price</th>
                <th>Decision</th>
                <th>Closing Date</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.customer?.name || '—'}</td>
                  <td>{item.property?.title || '—'}</td>
                  <td>{item.finalPrice != null ? `₹${Number(item.finalPrice).toLocaleString('en-IN')}` : '—'}</td>
                  <td>{item.customerDecision}</td>
                  <td>{item.expectedClosingDate || '—'}</td>
                  <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-IN') : '—'}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => handleDecision(item, 'ACCEPTED')}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDecision(item, 'REJECTED')}>Reject</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

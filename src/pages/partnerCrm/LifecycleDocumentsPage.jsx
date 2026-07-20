import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import { useToast } from '../../components/feedback/Toast';
import {
  completeLifecycleRegistration,
  createLifecycleDocument,
  listLifecycleDocuments,
} from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

const DOCUMENT_TYPES = [
  { value: 'SALE_AGREEMENT', label: 'Sale Agreement' },
  { value: 'REGISTRATION', label: 'Registration Documents' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'TAX', label: 'Tax Documents' },
  { value: 'LEGAL', label: 'Legal Documents' },
];

export default function LifecycleDocumentsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customerUserId: '',
    bookingId: '',
    documentType: 'SALE_AGREEMENT',
    title: '',
    fileUrl: '',
    fileName: '',
    visibleToCustomer: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const docs = await listLifecycleDocuments();
      setItems(docs || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.customerUserId || !form.title || !form.fileUrl) {
      toast.error('Customer ID, title, and file URL are required.');
      return;
    }
    try {
      await createLifecycleDocument({
        customerUserId: Number(form.customerUserId),
        bookingId: form.bookingId ? Number(form.bookingId) : null,
        documentType: form.documentType,
        title: form.title,
        fileUrl: form.fileUrl,
        fileName: form.fileName || form.title,
        visibleToCustomer: form.visibleToCustomer,
      });
      toast.success('Document uploaded.');
      setForm({
        customerUserId: '',
        bookingId: '',
        documentType: 'SALE_AGREEMENT',
        title: '',
        fileUrl: '',
        fileName: '',
        visibleToCustomer: true,
      });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to upload document.');
    }
  };

  const handleCompleteRegistration = async () => {
    const journeyId = window.prompt('Journey ID to mark registration complete:');
    if (!journeyId) return;
    try {
      await completeLifecycleRegistration({ journeyId: Number(journeyId) });
      toast.success('Registration marked complete.');
    } catch (err) {
      toast.error(err.message || 'Failed to complete registration.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Legal Documents"
        description="Upload sale agreements, registration documents, and receipts visible to customers."
        actions={<Button variant="accent" size="md" onClick={handleCompleteRegistration}>Complete Registration</Button>}
      />

      <div className="partner-crm-panel">
        <h3>Upload Document</h3>
        <div className="partner-crm-form-grid">
          <Input label="Customer User ID" type="number" required value={form.customerUserId} onChange={(e) => setForm((p) => ({ ...p, customerUserId: e.target.value }))} />
          <Input label="Booking ID (optional)" type="number" value={form.bookingId} onChange={(e) => setForm((p) => ({ ...p, bookingId: e.target.value }))} />
          <Select label="Document Type" value={form.documentType} onChange={(v) => setForm((p) => ({ ...p, documentType: v }))} options={DOCUMENT_TYPES} />
          <Input label="Title" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Input label="File URL" required value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} className="form-section__full" />
          <Input label="File Name" value={form.fileName} onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))} />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit}>Upload Document</Button>
          </div>
        </div>
      </div>

      <div className="partner-crm-panel">
        <h3>Uploaded Documents</h3>
        {loading ? <p>Loading...</p> : (
          <table className="partner-crm-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Visible</th>
                <th>Uploaded</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.documentTypeLabel}</td>
                  <td>{item.customerUserId || '—'}</td>
                  <td>{item.visibleToCustomer ? 'Yes' : 'No'}</td>
                  <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}</td>
                  <td><a href={item.fileUrl} target="_blank" rel="noopener noreferrer">Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

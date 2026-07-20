import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import { listSalesUsers, formatSalesUserOption } from '../../services/users/userApi.js';
import { listProperties } from '../../services/property/propertyApi.js';
import {
  cancelSalesMeeting,
  completeSalesMeeting,
  createSalesMeeting,
  listSalesCustomers,
  listSalesMeetings,
  listVentureCatalog,
  MEETING_OUTCOME_OPTIONS,
  MEETING_TYPE_OPTIONS,
  rescheduleSalesMeeting,
} from '../../services/sales/salesCrmApi.js';
import { useNotificationHighlight, useRecordUnavailableMessage } from '../../utils/notificationDeepLink.js';
import './partner-crm.css';

const EMPTY_MEETING = {
  title: '',
  meetingType: 'OFFICE',
  assigneeUserId: '',
  customerId: '',
  propertyId: '',
  ventureRef: '',
  meetingDate: '',
  meetingTime: '',
  location: '',
  meetLink: '',
  agenda: '',
  remarks: '',
  sendNotification: true,
  sendEmail: false,
  sendWhatsApp: false,
};

const ASSIGN_ALL_VALUE = '__ALL__';

function participantLabel(row) {
  const names = (row.participants || []).map((user) => user.name).filter(Boolean);
  if (names.length) return names.join(', ');
  return row.assignee?.name || '—';
}

export default function PartnerMeetingsPage() {
  const toast = useToast();
  useRecordUnavailableMessage((message) => toast.warning(message));
  const [ventures, setVentures] = useState([]);
  const [items, setItems] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_MEETING });
  const [actionMeeting, setActionMeeting] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [rescheduleForm, setRescheduleForm] = useState({ meetingDate: '', meetingTime: '', location: '' });
  const [whatsappLinks, setWhatsappLinks] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [meetings, users, customerResult, propertyResult, ventureRows] = await Promise.all([
        listSalesMeetings(),
        listSalesUsers(),
        listSalesCustomers({ pageSize: 100 }),
        listProperties({ pageSize: 100 }),
        listVentureCatalog(),
      ]);
      setItems(meetings || []);
      setSalesUsers(users || []);
      setCustomers(customerResult.items || []);
      setProperties(propertyResult.items || []);
      setVentures(Array.isArray(ventureRows) ? ventureRows : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useNotificationHighlight([items]);

  const assigneeOptions = useMemo(
    () => [
      { value: ASSIGN_ALL_VALUE, label: 'All Team Members' },
      ...salesUsers.map(formatSalesUserOption),
    ],
    [salesUsers]
  );

  const submit = async () => {
    if (!form.title || !form.meetingDate || !form.meetingTime) {
      toast.error('Title, date, and time are required.');
      return;
    }
    const venture = ventures.find((v) => v.id === form.ventureRef);
    const assignAll = form.assigneeUserId === ASSIGN_ALL_VALUE;
    try {
      const result = await createSalesMeeting({
        ...form,
        assignAll,
        notifyInApp: form.sendNotification,
        assigneeUserId: assignAll ? null : (form.assigneeUserId ? Number(form.assigneeUserId) : null),
        customerId: form.customerId ? Number(form.customerId) : null,
        propertyId: form.propertyId ? Number(form.propertyId) : null,
        ventureRef: venture?.id || null,
        ventureName: venture?.name || null,
      });
      toast.success(
        result?.participantCount > 1
          ? `Meeting scheduled with ${result.participantCount} team members.`
          : 'Meeting scheduled.'
      );
      if (result?.whatsappLinks?.length) {
        setWhatsappLinks(result.whatsappLinks);
      }
      setForm({ ...EMPTY_MEETING });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule meeting.');
    }
  };

  const openAction = (meeting, type) => {
    setActionMeeting(meeting);
    setActionType(type);
    setOutcome('');
    setOutcomeNotes('');
    setRescheduleForm({
      meetingDate: meeting.meetingDate || meeting.date || '',
      meetingTime: meeting.meetingTime || meeting.time || '',
      location: meeting.location || '',
    });
  };

  const closeAction = () => {
    setActionMeeting(null);
    setActionType(null);
  };

  const submitAction = async () => {
    if (!actionMeeting) return;
    try {
      if (actionType === 'complete') {
        if (!outcome) {
          toast.error('Select a meeting outcome.');
          return;
        }
        await completeSalesMeeting(actionMeeting.id, { outcome, outcomeNotes });
        toast.success('Meeting completed.');
      } else if (actionType === 'reschedule') {
        await rescheduleSalesMeeting(actionMeeting.id, rescheduleForm);
        toast.success('Meeting rescheduled.');
      } else if (actionType === 'cancel') {
        await cancelSalesMeeting(actionMeeting.id, outcomeNotes || 'Meeting cancelled.');
        toast.success('Meeting cancelled.');
      }
      closeAction();
      load();
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader title="Meetings" description="Schedule and manage sales meetings with lifecycle-driven reminders." />

      <div className="partner-crm-panel">
        <h3>Schedule Meeting</h3>
        <div className="partner-crm-form-grid">
          <Input label="Meeting Title" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="form-section__full" />
          <Select label="Meeting Type" value={form.meetingType} onChange={(v) => setForm((p) => ({ ...p, meetingType: v }))} options={MEETING_TYPE_OPTIONS} />
          <Select label="Assign To" value={form.assigneeUserId} onChange={(v) => setForm((p) => ({ ...p, assigneeUserId: v }))} options={assigneeOptions} placeholder="Select team member" searchable />
          <Select label="Customer" value={form.customerId} onChange={(v) => setForm((p) => ({ ...p, customerId: v }))} options={customers.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="Optional" searchable />
          <Select label="Property" value={form.propertyId} onChange={(v) => setForm((p) => ({ ...p, propertyId: v }))} options={properties.map((p) => ({ value: String(p.id), label: p.propertyTitle }))} placeholder="Optional" searchable />
          <Select label="Venture" value={form.ventureRef} onChange={(v) => setForm((p) => ({ ...p, ventureRef: v }))} options={ventures.map((v) => ({ value: v.id, label: v.name }))} placeholder="Optional" searchable />
          <Input label="Meeting Date" type="date" required value={form.meetingDate} onChange={(e) => setForm((p) => ({ ...p, meetingDate: e.target.value }))} />
          <Input label="Meeting Time" type="time" required value={form.meetingTime} onChange={(e) => setForm((p) => ({ ...p, meetingTime: e.target.value }))} />
          <Input label="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          <Input label="Google Meet Link" value={form.meetLink} onChange={(e) => setForm((p) => ({ ...p, meetLink: e.target.value }))} />
          <Textarea label="Agenda" value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))} rows={2} className="form-section__full" />
          <Textarea label="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} rows={2} className="form-section__full" />
          <div className="partner-crm-checkbox-row form-section__full">
            <label><input type="checkbox" checked={form.sendNotification} onChange={(e) => setForm((p) => ({ ...p, sendNotification: e.target.checked }))} /> Send Notification</label>
            <label><input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm((p) => ({ ...p, sendEmail: e.target.checked }))} /> Send Email</label>
            <label><input type="checkbox" checked={form.sendWhatsApp} onChange={(e) => setForm((p) => ({ ...p, sendWhatsApp: e.target.checked }))} /> Send WhatsApp</label>
          </div>
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" size="md" onClick={submit}>Schedule Meeting</Button>
          </div>
        </div>

        {whatsappLinks.length > 0 && (
          <div className="partner-crm-panel__note form-section__full">
            <strong>WhatsApp links</strong>
            <ul>
              {whatsappLinks.map((link) => (
                <li key={link.userId}>
                  <a href={link.url} target="_blank" rel="noreferrer">{link.name} ({link.mobile})</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="partner-crm-panel">
        <h3>Meetings</h3>
        {loading ? (
          <p className="partner-crm-page__loading">Loading...</p>
        ) : (
          <div className="partner-crm-table-wrap">
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Participants</th>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} data-highlight-id={row.id}>
                    <td>{row.title}</td>
                    <td>{participantLabel(row)}</td>
                    <td>{row.customer?.name || '—'}</td>
                    <td>{row.property?.propertyTitle || row.propertyTitle || '—'}</td>
                    <td>{row.meetingDate || row.date} {row.meetingTime || row.time}</td>
                    <td><Badge label={row.status || row.rawStatus} size="sm" /></td>
                    <td className="partner-crm-table__actions">
                      {(row.rawStatus === 'UPCOMING' || row.status === 'Scheduled') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openAction(row, 'complete')}>Complete</Button>
                          <Button variant="ghost" size="sm" onClick={() => openAction(row, 'reschedule')}>Reschedule</Button>
                          <Button variant="ghost" size="sm" onClick={() => openAction(row, 'cancel')}>Cancel</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {actionMeeting && (
        <div className="partner-crm-modal-backdrop" role="dialog" aria-modal="true">
          <div className="partner-crm-modal">
            <h3>
              {actionType === 'complete' && 'Complete Meeting'}
              {actionType === 'reschedule' && 'Reschedule Meeting'}
              {actionType === 'cancel' && 'Cancel Meeting'}
            </h3>
            <p>{actionMeeting.title}</p>

            {actionType === 'complete' && (
              <>
                <Select label="Outcome" value={outcome} onChange={setOutcome} options={MEETING_OUTCOME_OPTIONS} placeholder="Select outcome" />
                <Textarea label="Notes" value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} rows={3} />
              </>
            )}

            {actionType === 'reschedule' && (
              <>
                <Input label="Date" type="date" value={rescheduleForm.meetingDate} onChange={(e) => setRescheduleForm((p) => ({ ...p, meetingDate: e.target.value }))} />
                <Input label="Time" type="time" value={rescheduleForm.meetingTime} onChange={(e) => setRescheduleForm((p) => ({ ...p, meetingTime: e.target.value }))} />
                <Input label="Location" value={rescheduleForm.location} onChange={(e) => setRescheduleForm((p) => ({ ...p, location: e.target.value }))} />
              </>
            )}

            {actionType === 'cancel' && (
              <Textarea label="Reason" value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} rows={3} />
            )}

            <div className="partner-crm-actions">
              <Button variant="ghost" size="md" onClick={closeAction}>Close</Button>
              <Button variant="accent" size="md" onClick={submitAction}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

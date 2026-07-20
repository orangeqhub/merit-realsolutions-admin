import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Textarea from '../../components/ui/textarea/Textarea';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import {
  approveSiteVisitVehicle,
  getSiteVisit,
  listSiteVisitVehicleRequests,
  listSiteVisits,
  rejectSiteVisitVehicle,
} from '../../services/sales/salesCrmApi.js';
import { readSiteVisitIdFromSearch } from '../../utils/siteVisitNavigation.js';
import { prefetchAdminSiteVisit } from '../../utils/siteVisitOpenFlow.js';
import LeadLifecycleTimeline from '../../components/lifecycle/LeadLifecycleTimeline.jsx';
import { useNotificationHighlight } from '../../utils/notificationDeepLink.js';
import './partner-crm.css';

const EMPTY_ASSIGNMENT = {
  vehicleName: '',
  vehicleNumber: '',
  driverName: '',
  driverMobile: '',
  pickupTime: '',
  pickupLocation: '',
  destination: '',
  meetingPoint: '',
  additionalNotes: '',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SiteVisitWorkflowPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ ...EMPTY_ASSIGNMENT });
  const [submitting, setSubmitting] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  useNotificationHighlight([siteVisits, vehicleRequests]);

  const openVisitById = useCallback(async (openId) => {
    if (!openId) return;
    const result = await prefetchAdminSiteVisit(openId);
    if (!result.ok) {
      toast.warning(result.error);
      setSearchParams({}, { replace: true });
      return;
    }
    try {
      const detail = await getSiteVisit(result.id);
      setSelectedVisit(detail);
      setActiveTab('visits');
    } catch {
      toast.warning(result.error);
      setSearchParams({}, { replace: true });
    }
  }, [toast, setSearchParams]);

  const openApprove = useCallback((request) => {
    setSelectedRequest(request);
    setAssignmentForm({
      ...EMPTY_ASSIGNMENT,
      pickupLocation: request.pickupAddress || '',
      destination: request.destination || '',
      pickupTime: request.visitTime || '',
    });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [vehicles, visits] = await Promise.all([
        listSiteVisitVehicleRequests(),
        listSiteVisits(),
      ]);
      setVehicleRequests(vehicles || []);
      setSiteVisits(visits || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load site visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const siteVisitId = readSiteVisitIdFromSearch(searchParams);
    const openId = siteVisitId || searchParams.get('open') || searchParams.get('highlight');
    const vehicleRequestId = searchParams.get('vehicleRequest');

    if (tab === 'vehicles' || tab === 'visits' || tab === 'calendar') {
      setActiveTab(tab);
    }

    if (vehicleRequestId && vehicleRequests.length) {
      const request = vehicleRequests.find((row) => String(row.id) === String(vehicleRequestId));
      if (request) {
        setActiveTab('vehicles');
        openApprove(request);
      }
    }

    if (openId) {
      openVisitById(openId);
    }
  }, [searchParams, vehicleRequests, openVisitById, openApprove]);

  const pendingCount = vehicleRequests.length;

  const handleApprove = async () => {
    if (!selectedRequest) return;
    if (!assignmentForm.vehicleName || !assignmentForm.driverName || !assignmentForm.driverMobile) {
      toast.error('Vehicle name, driver name, and driver mobile are required.');
      return;
    }
    setSubmitting(true);
    try {
      await approveSiteVisitVehicle(selectedRequest.id, assignmentForm);
      toast.success('Vehicle assigned and visit confirmed. Customer and sales notified.');
      setSelectedRequest(null);
      setAssignmentForm({ ...EMPTY_ASSIGNMENT });
      setSearchParams({});
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to approve vehicle request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return;
    try {
      await rejectSiteVisitVehicle(request.id, reason);
      toast.success('Vehicle request rejected.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to reject request.');
    }
  };

  const visitRows = useMemo(
    () => (siteVisits || []).map((visit) => ({
      ...visit,
      highlightId: visit.partnerMeetingId || visit.id,
    })),
    [siteVisits]
  );

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const startPad = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startPad; i += 1) days.push({ outside: true, day: '', key: `pad-${i}` });
    for (let d = 1; d <= lastDay.getDate(); d += 1) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayVisits = siteVisits.filter((visit) => visit.preferredDate === key);
      days.push({ outside: false, day: d, key, visits: dayVisits });
    }
    return days;
  }, [viewDate, siteVisits]);

  return (
    <div className="partner-crm-page">
      <PageHeader
        title="Site Visit Workflow"
        subtitle="Manage vehicle arrangements, confirmations, and site visit calendar."
      />

      <div className="partner-crm-tabs">
        <button type="button" className={activeTab === 'vehicles' ? 'is-active' : ''} onClick={() => setActiveTab('vehicles')}>
          Vehicle Requests {pendingCount ? <Badge variant="warning">{pendingCount}</Badge> : null}
        </button>
        <button type="button" className={activeTab === 'visits' ? 'is-active' : ''} onClick={() => setActiveTab('visits')}>
          All Site Visits
        </button>
        <button type="button" className={activeTab === 'calendar' ? 'is-active' : ''} onClick={() => setActiveTab('calendar')}>
          Calendar
        </button>
      </div>

      {loading ? <p>Loading…</p> : null}

      {!loading && activeTab === 'vehicles' ? (
        <div className="partner-crm-table-wrap">
          {vehicleRequests.length === 0 ? <p>No pending vehicle requests.</p> : (
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>Sales Rep</th>
                  <th>Visit Date</th>
                  <th>Visit Time</th>
                  <th>Pickup Address</th>
                  <th>Destination</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRequests.map((row) => (
                  <tr key={row.id} data-highlight-id={row.partnerMeetingId || row.id}>
                    <td>{row.customerName}</td>
                    <td>{row.propertyTitle}</td>
                    <td>{row.salesRepresentative || row.requestedBy}</td>
                    <td>{row.visitDate}</td>
                    <td>{row.visitTime}</td>
                    <td>{row.pickupAddress}</td>
                    <td>{row.destination}</td>
                    <td>{row.remarks || '—'}</td>
                    <td className="partner-crm-actions">
                      <Button size="sm" variant="accent" onClick={() => openApprove(row)}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(row)}>Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {!loading && activeTab === 'visits' ? (
        <div className="partner-crm-table-wrap">
          {visitRows.length === 0 ? <p>No site visits found.</p> : (
            <table className="partner-crm-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Stage</th>
                  <th>Next Follow-up</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitRows.map((row) => (
                  <tr key={row.id} data-highlight-id={row.highlightId}>
                    <td>{row.referenceNumber}</td>
                    <td>{row.customer?.name}</td>
                    <td>{row.property?.title}</td>
                    <td>{row.preferredDate} {row.preferredTime}</td>
                    <td><Badge>{row.displayStatus || row.workflowStatus}</Badge></td>
                    <td>{row.visitOutcomeLabel || row.visitOutcome || '—'}</td>
                    <td>{row.currentLifecycleStageLabel || row.currentLifecycleStage || '—'}</td>
                    <td>{row.nextFollowUpDate || '—'}</td>
                    <td>{row.assignee?.name || '—'}</td>
                    <td><Button size="sm" variant="outline" onClick={() => openVisitById(row.partnerMeetingId || row.id)}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {!loading && activeTab === 'calendar' ? (
        <div className="partner-crm-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Button size="sm" variant="ghost" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>Previous</Button>
            <strong>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
            <Button size="sm" variant="ghost" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>Next</Button>
          </div>
          <div className="partner-crm-calendar-grid">
            {calendarDays.map((cell) => (
              <button
                key={cell.key}
                type="button"
                className={`partner-crm-calendar-day ${cell.outside ? 'is-outside' : ''}`}
                disabled={cell.outside || !cell.visits?.length}
                onClick={() => cell.visits?.length && openVisitById(cell.visits[0].partnerMeetingId || cell.visits[0].id)}
              >
                <span>{cell.day}</span>
                {cell.visits?.length ? <small>{cell.visits.length} visit(s)</small> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="partner-crm-modal-backdrop" onClick={() => setSelectedRequest(null)} role="presentation">
          <div className="partner-crm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Vehicle Arrangement</h3>
            <p>{selectedRequest.customerName} · {selectedRequest.propertyTitle}</p>
            <div className="partner-crm-detail-grid">
              <div><strong>Sales Representative</strong><p>{selectedRequest.salesRepresentative || selectedRequest.requestedBy}</p></div>
              <div><strong>Visit</strong><p>{selectedRequest.visitDate} at {selectedRequest.visitTime}</p></div>
              <div><strong>Pickup Address</strong><p>{selectedRequest.pickupAddress}</p></div>
              <div><strong>Destination</strong><p>{selectedRequest.destination}</p></div>
            </div>
            <div className="partner-crm-form-grid">
              <Input label="Vehicle Name" value={assignmentForm.vehicleName} onChange={(e) => setAssignmentForm((p) => ({ ...p, vehicleName: e.target.value }))} />
              <Input label="Vehicle Number" value={assignmentForm.vehicleNumber} onChange={(e) => setAssignmentForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
              <Input label="Driver Name" value={assignmentForm.driverName} onChange={(e) => setAssignmentForm((p) => ({ ...p, driverName: e.target.value }))} />
              <Input label="Driver Mobile" value={assignmentForm.driverMobile} onChange={(e) => setAssignmentForm((p) => ({ ...p, driverMobile: e.target.value }))} />
              <Input label="Pickup Time" value={assignmentForm.pickupTime} onChange={(e) => setAssignmentForm((p) => ({ ...p, pickupTime: e.target.value }))} />
              <Input label="Meeting Point" value={assignmentForm.meetingPoint} onChange={(e) => setAssignmentForm((p) => ({ ...p, meetingPoint: e.target.value }))} />
              <Input label="Pickup Location" value={assignmentForm.pickupLocation} onChange={(e) => setAssignmentForm((p) => ({ ...p, pickupLocation: e.target.value }))} />
              <Input label="Destination" value={assignmentForm.destination} onChange={(e) => setAssignmentForm((p) => ({ ...p, destination: e.target.value }))} />
            </div>
            <Textarea label="Remarks" value={assignmentForm.additionalNotes} onChange={(e) => setAssignmentForm((p) => ({ ...p, additionalNotes: e.target.value }))} />
            <div className="partner-crm-modal-actions">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)}>Cancel</Button>
              <Button variant="accent" onClick={handleApprove} disabled={submitting}>Approve & Notify</Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedVisit ? (
        <div className="partner-crm-modal-backdrop" onClick={() => setSelectedVisit(null)} role="presentation">
          <div className="partner-crm-modal partner-crm-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>{selectedVisit.referenceNumber} — Site Visit Details</h3>
            <div className="partner-crm-detail-grid">
              <div><strong>Customer</strong><p>{selectedVisit.customer?.name}</p><p>{selectedVisit.customer?.mobile}</p><p>{selectedVisit.customer?.email}</p><p>{selectedVisit.customer?.address}</p></div>
              <div><strong>Property</strong><p>{selectedVisit.property?.title}</p><p>{selectedVisit.property?.type}</p><p>{selectedVisit.property?.location}</p><p>{selectedVisit.property?.price ? `₹${Number(selectedVisit.property.price).toLocaleString('en-IN')}` : '—'}</p></div>
              <div><strong>Visit</strong><p>{selectedVisit.preferredDate} at {selectedVisit.preferredTime}</p><p>{selectedVisit.purpose || '—'}</p><p>{selectedVisit.displayStatus}</p></div>
              <div><strong>Sales Rep</strong><p>{selectedVisit.assignee?.name}</p><p>{selectedVisit.assignee?.mobile}</p></div>
            </div>
            {selectedVisit.assignment ? (
              <div className="partner-crm-detail-grid">
                <div><strong>Driver</strong><p>{selectedVisit.assignment.driverName}</p><p>{selectedVisit.assignment.driverMobile}</p></div>
                <div><strong>Vehicle</strong><p>{selectedVisit.assignment.vehicleName}</p><p>{selectedVisit.assignment.vehicleNumber}</p></div>
                <div><strong>Pickup</strong><p>{selectedVisit.assignment.pickupTime}</p><p>{selectedVisit.assignment.pickupLocation}</p></div>
                <div><strong>Meeting Point</strong><p>{selectedVisit.assignment.meetingPoint}</p></div>
              </div>
            ) : null}
            {(selectedVisit.visitOutcome || selectedVisit.currentLifecycleStage) ? (
              <div className="partner-crm-detail-grid">
                <div><strong>Visit Outcome</strong><p>{selectedVisit.visitOutcomeLabel || selectedVisit.visitOutcome || '—'}</p></div>
                <div><strong>Current Stage</strong><p>{selectedVisit.currentLifecycleStageLabel || selectedVisit.currentLifecycleStage || '—'}</p></div>
                <div><strong>Updated By</strong><p>{selectedVisit.outcomeUpdatedBy?.name || '—'}</p><p>{selectedVisit.outcomeUpdatedAt ? new Date(selectedVisit.outcomeUpdatedAt).toLocaleString('en-IN') : ''}</p></div>
                <div><strong>Next Follow-up</strong><p>{selectedVisit.nextFollowUpDate || '—'}</p></div>
                <div className="form-section__full"><strong>Remarks</strong><p>{selectedVisit.outcomeRemarks || '—'}</p></div>
                <div className="form-section__full"><strong>Customer Visible Remarks</strong><p>{selectedVisit.customerVisibleRemarks || '—'}</p></div>
              </div>
            ) : null}
            {(selectedVisit.leadLifecycle?.steps || selectedVisit.masterTimeline || []).length > 0 ? (
              <div className="partner-crm-panel" style={{ marginTop: '1rem' }}>
                <h4>Master Lead Lifecycle</h4>
                <LeadLifecycleTimeline
                  steps={selectedVisit.leadLifecycle?.steps || selectedVisit.masterTimeline || []}
                  history={selectedVisit.leadLifecycle?.history || []}
                  showHistory
                />
              </div>
            ) : null}
            {(selectedVisit.activityTimeline || []).length > 0 ? (
              <div className="partner-crm-panel" style={{ marginTop: '1rem' }}>
                <h4>Activity Timeline</h4>
                <ul className="partner-crm-timeline">
                  {selectedVisit.activityTimeline.map((event) => (
                    <li key={event.id || event.key}>
                      <strong>{event.label}</strong>
                      <span>{event.actor || 'System'} · {event.at ? new Date(event.at).toLocaleString('en-IN') : ''}</span>
                      {event.description ? <p>{event.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="partner-crm-modal-actions">
              <Button variant="ghost" onClick={() => setSelectedVisit(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/button/Button';
import Select from '../ui/select/Select';
import Textarea from '../ui/textarea/Textarea';
import {
  completeSalesMeeting,
  fetchMeetingPopups,
  MEETING_OUTCOME_OPTIONS,
  snoozeSalesMeeting,
} from '../../services/sales/salesCrmApi.js';
import {
  fetchNotificationById,
  markNotificationRead,
} from '../../services/notifications/notificationApi.js';
import { getAuthToken } from '../../services/auth/authStorage.js';
import { useToast } from '../feedback/Toast';
import { handleNotificationClick } from '../../utils/notificationNavigation.js';
import './MeetingTimePopup.css';

export default function MeetingTimePopup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [popup, setPopup] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!getAuthToken()) {
      setPopup(null);
      return;
    }
    try {
      const items = await fetchMeetingPopups();
      setPopup(items[0] || null);
    } catch {
      setPopup(null);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (!popup) return null;

  const metadata = popup.metadata || {};
  const meetingId = metadata.meetingId || popup.entityId;

  const openMeeting = () => {
    handleNotificationClick({
      item: popup,
      navigate,
      markReadFn: markNotificationRead,
      fetchNotificationFn: fetchNotificationById,
    });
    setPopup(null);
  };

  const snooze = async () => {
    try {
      await snoozeSalesMeeting(meetingId, 10);
      setPopup(null);
      toast.info('Meeting reminder snoozed for 10 minutes.');
    } catch (err) {
      toast.error(err.message || 'Unable to snooze meeting.');
    }
  };

  const submitComplete = async () => {
    if (!outcome) {
      toast.error('Select a meeting outcome.');
      return;
    }
    setCompleting(true);
    try {
      await completeSalesMeeting(meetingId, { outcome, outcomeNotes: notes });
      toast.success('Meeting marked completed.');
      setPopup(null);
    } catch (err) {
      toast.error(err.message || 'Unable to complete meeting.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="meeting-popup-backdrop" role="dialog" aria-modal="true" aria-labelledby="meeting-popup-title">
      <div className="meeting-popup">
        <p className="meeting-popup__eyebrow">Meeting Time</p>
        <h2 id="meeting-popup-title">{metadata.meetingTitle || popup.title}</h2>
        <div className="meeting-popup__details">
          <p><span>Customer</span><strong>{metadata.customerName || '—'}</strong></p>
          <p><span>Property</span><strong>{metadata.propertyTitle || '—'}</strong></p>
          <p><span>Agenda</span><strong>{metadata.agenda || '—'}</strong></p>
          <p><span>When</span><strong>{metadata.meetingDate} {metadata.meetingTime}</strong></p>
        </div>

        <div className="meeting-popup__complete">
          <Select
            label="Outcome"
            value={outcome}
            onChange={setOutcome}
            options={MEETING_OUTCOME_OPTIONS}
            placeholder="Select outcome"
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="meeting-popup__actions">
          <Button variant="accent" size="md" onClick={openMeeting}>Open Meeting</Button>
          <Button variant="ghost" size="md" onClick={snooze}>Snooze</Button>
          <Button variant="primary" size="md" onClick={submitComplete} disabled={completing}>
            {completing ? 'Saving...' : 'Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

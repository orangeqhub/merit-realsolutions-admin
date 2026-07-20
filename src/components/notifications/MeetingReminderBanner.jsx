import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/button/Button';
import {
  dismissNotificationBanner,
  fetchNotificationBanners,
  fetchNotificationById,
  markNotificationRead,
} from '../../services/notifications/notificationApi.js';
import { getAuthToken } from '../../services/auth/authStorage.js';
import { handleNotificationClick } from '../../utils/notificationNavigation.js';
import './MeetingReminderBanner.css';

const MEETING_EVENTS = new Set([
  'MEETING_SCHEDULED',
  'MEETING_REMINDER',
  'MEETING_UPDATED',
]);

function pickMeetingBanner(items = []) {
  return items.find((item) => MEETING_EVENTS.has(item.type || item.eventType) && item.showBanner);
}

export default function MeetingReminderBanner() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [dismissing, setDismissing] = useState(false);

  const load = useCallback(async () => {
    if (!getAuthToken()) {
      setBanner(null);
      return;
    }
    try {
      const items = await fetchNotificationBanners();
      setBanner(pickMeetingBanner(items));
    } catch {
      setBanner(null);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 45000);
    return () => clearInterval(timer);
  }, [load]);

  const metadata = useMemo(() => banner?.metadata || {}, [banner]);

  if (!banner) return null;

  const handleView = () => {
    handleNotificationClick({
      item: banner,
      navigate,
      markReadFn: markNotificationRead,
      fetchNotificationFn: fetchNotificationById,
    });
  };

  const handleClose = async () => {
    setDismissing(true);
    try {
      await dismissNotificationBanner(banner.id);
      setBanner(null);
    } catch {
      setBanner(null);
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="meeting-banner" role="status" aria-live="polite">
      <div className="meeting-banner__content">
        <p className="meeting-banner__eyebrow">Upcoming Meeting</p>
        <h3 className="meeting-banner__title">{metadata.meetingTitle || banner.title}</h3>
        <div className="meeting-banner__grid">
          <div><span>Customer</span><strong>{metadata.customerName || '—'}</strong></div>
          <div><span>Property</span><strong>{metadata.propertyTitle || '—'}</strong></div>
          <div><span>Date</span><strong>{metadata.meetingDate || '—'}</strong></div>
          <div><span>Time</span><strong>{metadata.meetingTime || '—'}</strong></div>
          <div className="meeting-banner__grid-wide"><span>Agenda</span><strong>{metadata.agenda || '—'}</strong></div>
          <div><span>Location</span><strong>{metadata.location || '—'}</strong></div>
        </div>
      </div>
      <div className="meeting-banner__actions">
        <Button variant="accent" size="sm" onClick={handleView}>View</Button>
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={dismissing}>Close</Button>
      </div>
    </div>
  );
}

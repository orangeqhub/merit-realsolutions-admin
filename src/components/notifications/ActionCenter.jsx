import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/button/Button';
import {
  completeActionCenterItem,
  dismissActionCenterItem,
  fetchActionCenter,
  openActionCenterItem,
  snoozeActionCenterItem,
  markNotificationRead,
  fetchNotificationById,
} from '../../services/notifications/notificationApi.js';
import { getAuthToken } from '../../services/auth/authStorage.js';
import { handleNotificationClick } from '../../utils/notificationNavigation.js';
import './ActionCenter.css';

function levelClass(level) {
  const value = String(level || 'INFO').toLowerCase();
  if (value === 'urgent' || value === 'error') return 'action-center--urgent';
  if (value === 'high' || value === 'warning') return 'action-center--high';
  return 'action-center--info';
}

function actionPayload(action) {
  return {
    alertKey: action.alertKey,
    notificationId: action.notificationId,
    category: action.category,
    title: action.title,
    metadata: action.metadata,
  };
}

function notifyDashboardRefresh() {
  window.dispatchEvent(new CustomEvent('action-center:changed'));
}

export default function ActionCenter() {
  const navigate = useNavigate();
  const [action, setAction] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [busy, setBusy] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const applyData = useCallback((data) => {
    setAction(data?.action || data?.alert || null);
    setQueueLength(data?.queueLength || 0);
  }, []);

  const load = useCallback(async () => {
    if (!getAuthToken()) {
      setAction(null);
      setQueueLength(0);
      return;
    }
    try {
      const data = await fetchActionCenter();
      applyData(data);
    } catch {
      setAction(null);
      setQueueLength(0);
    }
  }, [applyData]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  if (!action) return null;

  const runAndRefresh = async (runner) => {
    setBusy(true);
    try {
      const data = await runner();
      if (data?.action || data?.alert) applyData(data);
      else await load();
      notifyDashboardRefresh();
    } finally {
      setBusy(false);
      setSnoozeOpen(false);
    }
  };

  const handleOpen = (actionItem) => {
    runAndRefresh(async () => {
      const data = await openActionCenterItem(actionPayload(action));
      const notificationItem = {
        id: action.notificationId,
        actionUrl: actionItem?.url || action.primaryAction?.url || action.actionUrl,
        isRead: false,
      };
      await handleNotificationClick({
        item: notificationItem,
        navigate,
        markReadFn: markNotificationRead,
        fetchNotificationFn: fetchNotificationById,
      });
      return data;
    });
  };

  const handleDismiss = () => {
    runAndRefresh(() => dismissActionCenterItem(actionPayload(action)));
  };

  const handleComplete = () => {
    runAndRefresh(() => completeActionCenterItem(actionPayload(action)));
  };

  const handleSnooze = (option) => {
    runAndRefresh(() => snoozeActionCenterItem({
      ...actionPayload(action),
      minutes: option.minutes,
      until: option.until,
    }));
  };

  const primaryAction = action.primaryAction || action.actions?.find((item) => item.primary) || action.actions?.[0];
  const secondaryAction = action.secondaryAction
    || action.actions?.find((item) => item.secondary && item.url);
  const snoozeOptions = action.snoozeOptions || [];
  const requiresAction = action.requiresAction || String(action.headerLabel || '').toLowerCase().includes('action');

  return (
    <div className={`action-center ${levelClass(action.level)}`} role="status" aria-live="polite">
      <div className="action-center__main">
        <div className="action-center__header">
          <p className={`action-center__eyebrow${requiresAction ? ' action-center__eyebrow--required' : ''}`}>
            {requiresAction ? 'Action Required' : (action.headerLabel || 'Information')}
          </p>
          {queueLength > 1 ? (
            <span className="action-center__queue">{queueLength - 1} more in queue</span>
          ) : null}
        </div>
        <h3 className="action-center__title">{action.title}</h3>
        {action.message ? <p className="action-center__message">{action.message}</p> : null}
        <div className="action-center__grid">
          {(action.fields || []).map((field) => (
            <div key={`${field.label}-${field.value}`} className={field.wide ? 'action-center__grid-wide' : undefined}>
              <span>{field.label}</span>
              <strong>{field.value || '—'}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="action-center__actions">
        {primaryAction && primaryAction.action !== 'dismiss' && primaryAction.action !== 'snooze' && (
          <Button
            variant="accent"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (primaryAction.action === 'complete') handleComplete();
              else handleOpen(primaryAction);
            }}
          >
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction?.url && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => handleOpen(secondaryAction)}
          >
            {secondaryAction.label}
          </Button>
        )}

        {snoozeOptions.length > 0 && (
          <div className="action-center__snooze-wrap">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setSnoozeOpen((v) => !v)}>
              Snooze
            </Button>
            {snoozeOpen && (
              <div className="action-center__snooze-menu">
                {snoozeOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSnooze(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" disabled={busy} onClick={handleDismiss}>Dismiss</Button>
      </div>
    </div>
  );
}

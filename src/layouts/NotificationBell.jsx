import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotificationCount,
  fetchNotificationById,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications/notificationApi.js';
import { handleNotificationClick } from '../utils/notificationNavigation.js';
import { useToast } from '../components/feedback/Toast';
import { getAuthToken } from '../services/auth/authStorage.js';
import { isBackendUnavailableError } from '../utils/backendHealth.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    if (!getAuthToken()) {
      setUnreadCount(0);
      setItems([]);
      return;
    }
    try {
      const [count, data] = await Promise.all([
        fetchNotificationCount(),
        listNotifications({ limit: 15 }),
      ]);
      setUnreadCount(count);
      setItems(data?.items || []);
    } catch (err) {
      setUnreadCount(0);
      setItems([]);
      if (!isBackendUnavailableError(err)) {
        // ignore transient auth errors on bell
      }
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    listNotifications({ limit: 15 })
      .then((data) => setItems(data?.items || []))
      .catch(() => {});
    const onClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const openItem = (item) => {
    handleNotificationClick({
      item,
      navigate,
      markReadFn: markNotificationRead,
      fetchNotificationFn: fetchNotificationById,
      onUnreadCountChange: setUnreadCount,
      onItemsUpdate: setItems,
      onClose: () => setOpen(false),
      onEntityLoadFailed: (message) => toast.warning(message),
    }).then(() => load());
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="dash-header__notifications" ref={panelRef}>
      <button
        type="button"
        className="dash-header__icon-btn"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? <span className="dash-header__badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="dash-header__notification-panel">
          <div className="dash-header__notification-panel-head">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" onClick={markAll}>Mark all read</button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="dash-header__notification-empty">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`dash-header__notification-item ${item.isRead ? '' : 'is-unread'}`}
                    onClick={() => openItem(item)}
                  >
                    <div className="dash-header__notification-item-head">
                      <strong>{item.title}</strong>
                      {!item.isRead ? <span className="dash-header__notification-dot" aria-hidden="true" /> : null}
                    </div>
                    <span>{item.message}</span>
                    <small>{item.time || (item.createdAt ? new Date(item.createdAt).toLocaleString() : '')}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

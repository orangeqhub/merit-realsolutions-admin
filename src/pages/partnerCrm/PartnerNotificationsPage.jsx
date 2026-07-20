import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import {
  fetchNotificationById,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications/notificationApi.js';
import { handleNotificationClick } from '../../utils/notificationNavigation.js';
import { useRecordUnavailableMessage } from '../../utils/notificationDeepLink.js';
import './partner-crm.css';

const READ_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function PartnerNotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  useRecordUnavailableMessage((message) => toast.warning(message));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listNotifications({
        page,
        limit: 20,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
        isRead: readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined,
      });
      setItems(result.items || []);
      setUnreadCount(result.unreadCount || 0);
      setPagination(result.pagination || { totalPages: 1 });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, priorityFilter, readFilter]);

  useEffect(() => { load(); }, [load]);

  const openItem = (item) => {
    handleNotificationClick({
      item,
      navigate,
      markReadFn: markNotificationRead,
      fetchNotificationFn: fetchNotificationById,
      onUnreadCountChange: setUnreadCount,
      onItemsUpdate: setItems,
      onEntityLoadFailed: (message) => toast.warning(message),
    }).then(() => load());
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Notifications"
        description="Unified notification center — assignments, meetings, bookings, and system alerts."
        actions={unreadCount > 0 ? <Button variant="ghost" size="md" onClick={markAll}>Mark All Read</Button> : null}
      />

      <div className="partner-crm-panel partner-notifications__filters">
        <input
          type="search"
          className="form-input"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select className="form-input" value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}>
          <option value="">All types</option>
          <option value="PROPERTY_ASSIGNED">Property assigned</option>
          <option value="CUSTOMER_ASSIGNED">Customer assigned</option>
          <option value="LEAD_ASSIGNED">Lead assigned</option>
          <option value="MEETING_SCHEDULED">Meeting scheduled</option>
          <option value="BOOKING_STARTED">Booking started</option>
          <option value="PAYMENT_RECEIVED">Payment received</option>
        </select>
        <select className="form-input" value={priorityFilter} onChange={(e) => { setPage(1); setPriorityFilter(e.target.value); }}>
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="form-input" value={readFilter} onChange={(e) => { setPage(1); setReadFilter(e.target.value); }}>
          {READ_FILTER_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="partner-crm-page__loading">Loading notifications...</p>
      ) : (
        <div className="partner-crm-panel">
          {items.length === 0 ? (
            <p className="partner-crm-page__loading">No notifications yet.</p>
          ) : (
            <div className="partner-notifications-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`partner-notifications-list__item ${item.isRead ? '' : 'partner-notifications-list__item--unread'}`}
                  onClick={() => openItem(item)}
                >
                  <div className="partner-notifications-list__head">
                    <strong>{item.title}</strong>
                    <div className="partner-notifications-list__badges">
                      {!item.isRead ? <span className="partner-notifications-list__dot" aria-hidden="true" /> : null}
                      <Badge label={(item.type || 'GENERAL').replace(/_/g, ' ')} size="sm" />
                      {item.priority ? <Badge label={item.priority} size="sm" /> : null}
                    </div>
                  </div>
                  <span>{item.message}</span>
                  <div className="partner-notifications-list__meta">
                    <small>{item.time || (item.createdAt ? new Date(item.createdAt).toLocaleString() : '')}</small>
                    {item.creator?.name ? <small>By {item.creator.name}</small> : null}
                  </div>
                  <span className="partner-notifications-list__action">View Details</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <span>Page {page} of {pagination.totalPages || 1}</span>
            <Button variant="ghost" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

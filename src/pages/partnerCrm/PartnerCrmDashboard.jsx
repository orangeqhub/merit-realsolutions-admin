import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers, FiUserCheck, FiHome, FiMap, FiUser, FiTarget,
  FiCalendar, FiPhone, FiTrendingUp,
} from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import { getSalesCrmDashboard, getLifecycleReports } from '../../services/sales/salesCrmApi.js';
import './partner-crm.css';

const lifecycleCards = [
  { key: 'totalEnquiries', label: 'Total Enquiries' },
  { key: 'siteVisits', label: 'Site Visits' },
  { key: 'negotiations', label: 'Negotiations' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'payments', label: 'Payments' },
  { key: 'soldProperties', label: 'Sold Properties' },
  { key: 'lostCustomers', label: 'Lost Customers' },
  { key: 'cancelledBookings', label: 'Cancelled Bookings' },
  { key: 'reservationExpired', label: 'Reservation Expired' },
  { key: 'conversionRate', label: 'Conversion Rate (%)' },
];

const statCards = [
  { key: 'totalAreaBusinessPartners', label: 'Area Business Partners', icon: FiUsers, tone: 'navy' },
  { key: 'totalAreaBusinessCoordinators', label: 'Area Business Coordinators', icon: FiUserCheck, tone: 'info' },
  { key: 'totalAreaBusinessExecutives', label: 'Area Business Executives', icon: FiTrendingUp, tone: 'success' },
  { key: 'totalCustomers', label: 'Customers', icon: FiUser, tone: 'primary' },
  { key: 'assignedProperties', label: 'Assigned Properties', icon: FiHome, tone: 'accent' },
  { key: 'assignedVentures', label: 'Assigned Ventures', icon: FiMap, tone: 'violet' },
  { key: 'assignedCustomers', label: 'Assigned Customers', icon: FiUser, tone: 'primary' },
  { key: 'openLeads', label: 'Open Leads', icon: FiTarget, tone: 'warning' },
  { key: 'convertedLeads', label: 'Converted Leads', icon: FiTarget, tone: 'success' },
  { key: 'todaysMeetings', label: "Today's Meetings", icon: FiCalendar, tone: 'info' },
  { key: 'todaysFollowUps', label: "Today's Follow Ups", icon: FiPhone, tone: 'accent' },
];

export default function PartnerCrmDashboard() {
  const [stats, setStats] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getSalesCrmDashboard(),
      getLifecycleReports().catch(() => null),
    ])
      .then(([dashboardStats, lifecycleStats]) => {
        setStats(dashboardStats);
        setLifecycle(lifecycleStats);
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div className="erp-module-page partner-crm-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Sales CRM Dashboard"
        description="Sales hierarchy statistics — assignments, leads, meetings, and follow ups."
        actions={
          <div className="partner-crm-actions">
            <Button variant="accent" size="md" to="/dashboard/sales-crm/leads">Manage Leads</Button>
            <Button variant="ghost" size="md" to="/dashboard/sales-crm/meetings">Schedule Meeting</Button>
          </div>
        }
      />

      {loading && <p className="partner-crm-page__loading">Loading dashboard...</p>}
      {error && !loading && <p className="partner-crm-page__loading">{error}</p>}

      {stats && (
        <>
          <div className="partner-crm-stats">
            {statCards.map(({ key, label, icon: Icon }) => (
              <div key={key} className="partner-crm-stat">
                <span>{label}</span>
                <strong>{stats[key] ?? 0}</strong>
                <Icon style={{ opacity: 0.35, marginTop: '0.35rem' }} />
              </div>
            ))}
          </div>

          <div className="partner-crm-panel">
            <h3>Quick Actions</h3>
            <div className="partner-crm-actions">
              <Button variant="outline" size="sm" to="/dashboard/sales-crm/property-assignment">Property Assignment</Button>
              <Button variant="outline" size="sm" to="/dashboard/sales-crm/venture-assignment">Venture Assignment</Button>
              <Button variant="outline" size="sm" to="/dashboard/sales-crm/customer-assignment">Customer Assignment</Button>
              <Button variant="outline" size="sm" to="/dashboard/users/abp">Manage Sales Users</Button>
              <Button variant="outline" size="sm" to="/dashboard/sales-crm/performance">Performance</Button>
              <Button variant="outline" size="sm" to="/dashboard/sales-crm/notifications">Notifications</Button>
            </div>
          </div>

          {lifecycle ? (
            <div className="partner-crm-panel">
              <h3>Sales Lifecycle Funnel</h3>
              <div className="partner-crm-stats">
                {lifecycleCards.map(({ key, label }) => (
                  <div key={key} className="partner-crm-stat">
                    <span>{label}</span>
                    <strong>{key === 'conversionRate' ? `${lifecycle[key] ?? 0}%` : (lifecycle[key] ?? 0)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="partner-crm-panel">
            <h3>User Management</h3>
            <p style={{ color: 'var(--erp-text-muted)', marginBottom: '0.75rem' }}>
              Manage Area Business Partners, Coordinators, and Executives from User Management.
            </p>
            <Link to="/dashboard/users">View All Users →</Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
